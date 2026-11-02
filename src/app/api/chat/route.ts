import { systemPrompt, type ChatContext } from "@/lib/chat/catalogue";
import { runTool, toolDefinitions } from "@/lib/chat/tools";

export const runtime = "nodejs";
export const maxDuration = 30;

// Flash first for the best answers at chat speed. Free-tier quotas on Flash are
// small (and Pro has none), so when a model is out of quota (429) or
// overloaded (503) the next one is tried at once; the flash-lite fallbacks have
// the most generous limits.
const MODELS = ["gemini-3.8-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"];
const endpoint = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse`;

/** Statuses that mean "this model can't take the request right now" — try another. */
const RETRYABLE = new Set([429, 500, 503, 504]);

/*
 * Comfortably under maxDuration. Without a deadline of our own, a slow Gemini
 * response lets Vercel kill the function at 30s — the stream dies mid-flight,
 * the browser never receives a `t:"error"` line, and the chat sits there
 * spinning forever. Aborting first means the catch below still gets to speak.
 */
const DEADLINE_MS = 25_000;

const MAX_TOOL_ROUNDS = 4;
const MAX_TURNS = 20;
const MAX_CHARS = 2000;

const WINDOW_MS = 60_000;
const MAX_PER_WINDOW = 12;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > MAX_PER_WINDOW;
}

interface Turn {
  role: "user" | "assistant";
  content: string;
}

interface FunctionCall {
  name: string;
  args?: Record<string, unknown>;
  id?: string;
}

interface Part {
  text?: string;
  functionCall?: FunctionCall;
  functionResponse?: { name: string; id?: string; response: Record<string, unknown> };
  /** Gemini 3.x rejects the next request unless this is echoed back verbatim. */
  thoughtSignature?: string;
}

interface Content {
  role: "user" | "model";
  parts: Part[];
}

function parseTurns(value: unknown): Turn[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter(
      (m): m is Turn =>
        !!m &&
        typeof m === "object" &&
        typeof (m as Turn).content === "string" &&
        ((m as Turn).role === "user" || (m as Turn).role === "assistant")
    )
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
}

const functionDeclarations = toolDefinitions.map((t) => ({
  name: t.name,
  description: t.description,
  parameters: t.input_schema,
}));

/**
 * The context comes from the browser and goes into the system prompt, which is
 * sent to Gemini again on every tool round. Messages were capped but this
 * wasn't, so a few megabytes of "cart" cost real quota. Keep what a genuine
 * page could send, and no more.
 */
function trimContext(raw: unknown): ChatContext {
  if (!raw || typeof raw !== "object") return {};
  const c = raw as Record<string, unknown>;
  const text = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");
  const out: ChatContext = {};
  const user = c.user as Record<string, unknown> | null | undefined;
  if (user && typeof user === "object") out.user = { name: text(user.name, 120), email: text(user.email, 190) };
  if (Array.isArray(c.cart)) {
    out.cart = c.cart.slice(0, 30).map((raw) => {
      const i = (raw ?? {}) as Record<string, unknown>;
      return { name: text(i.name, 120), size: text(i.size, 20), quantity: Number(i.quantity) || 0, price: Number(i.price) || 0 };
    });
  }
  if (Array.isArray(c.orders)) out.orders = (c.orders as ChatContext["orders"])!.slice(0, 20);
  return JSON.stringify(out).length > 60_000 ? { user: out.user, cart: out.cart } : out;
}

export async function POST(req: Request) {
  // Pasted/piped env values can carry a BOM or stray whitespace.
  const apiKey = process.env.GEMINI_API_KEY?.replace(/^﻿/, "").trim();
  if (!apiKey) {
    console.error("[chat] GEMINI_API_KEY is not set — add it to the Vercel project env.");
    return Response.json(
      {
        error:
          "Sutra Help is still being set up and can't answer just yet. Do browse the collection in the meantime — everything else on the site works normally.",
      },
      { status: 503 }
    );
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (rateLimited(ip)) {
    return Response.json(
      { error: "That's a lot of questions at once. Give it a minute and try again." },
      { status: 429 }
    );
  }

  let body: { messages?: unknown; context?: unknown } | null;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Malformed request." }, { status: 400 });
  }

  if (!body || typeof body !== "object") {
    return Response.json({ error: "Malformed request." }, { status: 400 });
  }

  const turns = parseTurns(body.messages);
  if (!turns.length) {
    return Response.json({ error: "No message to answer." }, { status: 400 });
  }

  const context = trimContext(body.context);

  const contents: Content[] = turns.map((t) => ({
    role: t.role === "assistant" ? "model" : "user",
    parts: [{ text: t.content }],
  }));

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (payload: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(JSON.stringify(payload) + "\n"));
      };

      // One deadline for the whole exchange, not per round: four tool rounds of
      // 25s each would still overrun the function.
      const abort = new AbortController();
      const deadline = setTimeout(() => abort.abort(), DEADLINE_MS);

      let chosen: string | undefined;
      // One log line per request: which models were tried, and how each went.
      const attempts: string[] = [];

      try {
        for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
          const request = JSON.stringify({
            systemInstruction: { parts: [{ text: systemPrompt(context) }] },
            contents,
            tools: [{ functionDeclarations }],
            generationConfig: {
              maxOutputTokens: 2048,
              temperature: 0.7,
              // Short shopping answers don't need long reasoning; this is most of the latency.
              thinkingConfig: { thinkingLevel: "low" },
            },
          });

          // The model that answered the previous round goes first; Gemini accepts
          // another model's thought signatures if it has to switch.
          const order = chosen ? [chosen, ...MODELS.filter((m) => m !== chosen)] : MODELS;
          let res: Response | undefined;
          for (let pass = 0; pass < 2 && !(res?.ok && res.body); pass++) {
            // Everything busy at once is usually a brief spike: wait a moment, then one more pass.
            if (pass > 0) await new Promise((r) => setTimeout(r, 1000));
            for (const candidate of order) {
              const started = Date.now();
              res = await fetch(`${endpoint(candidate)}&key=${encodeURIComponent(apiKey)}`, {
                method: "POST",
                signal: abort.signal,
                headers: { "Content-Type": "application/json" },
                body: request,
              });
              if (res.ok && res.body) {
                attempts.push(`${candidate} ok ${Date.now() - started}ms`);
                chosen = candidate;
                break;
              }
              const detail = await res.text().catch(() => "");
              attempts.push(`${candidate} ${res.status} ${detail.replace(/\s+/g, " ").slice(0, 160)}`);
              if (!RETRYABLE.has(res.status)) {
                pass = 2;
                break;
              }
            }
          }

          if (!res?.ok || !res.body) {
            throw new Error(`Gemini responded ${res?.status}`);
          }

          const calls: FunctionCall[] = [];
          const modelParts: Part[] = [];

          const reader = res.body.getReader();
          const decoder = new TextDecoder();
          let buffer = "";

          for (;;) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            const lines = buffer.split("\n");
            buffer = lines.pop() ?? "";

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              let chunk: {
                candidates?: { content?: { parts?: Part[] } }[];
              };
              try {
                chunk = JSON.parse(line.slice(6));
              } catch {
                continue;
              }
              for (const part of chunk.candidates?.[0]?.content?.parts ?? []) {
                if (part.text) send({ t: "text", v: part.text });
                if (part.functionCall) calls.push(part.functionCall);
                // Push the part as received — rebuilding it strips thoughtSignature.
                if (part.text || part.functionCall) modelParts.push(part);
              }
            }
          }

          if (!calls.length) break;

          contents.push({ role: "model", parts: modelParts });

          const responses: Part[] = [];
          for (const call of calls) {
            send({ t: "tool", v: call.name });
            const outcome = runTool(call.name, call.args ?? {}, context);
            if (outcome.products?.length) send({ t: "products", v: outcome.products });
            if (outcome.action) send({ t: "action", v: outcome.action });
            responses.push({
              functionResponse: {
                name: call.name,
                ...(call.id ? { id: call.id } : {}),
                response: { result: outcome.result },
              },
            });
          }

          contents.push({ role: "user", parts: responses });
        }

        send({ t: "done" });
      } catch (err) {
        console.error("[chat]", String(err), "|", attempts.join(" | "));
        const timedOut = abort.signal.aborted;
        send({
          t: "error",
          v: timedOut
            ? "Sutra Help is taking longer than usual to answer. Please try again."
            : "Something went wrong reaching Sutra Help. Try again in a moment.",
        });
      } finally {
        if (attempts.length) console.log("[chat] models:", attempts.join(" | "));
        clearTimeout(deadline);
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
