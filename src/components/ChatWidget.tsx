"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircle, X, Send } from "lucide-react";
import toast from "react-hot-toast";
import { useCartStore } from "@/lib/store/cart";
import { useAuthStore } from "@/lib/store/auth";
import { useHydrated } from "@/lib/useHydrated";
import { formatPrice } from "@/lib/utils";
import type { ProductSummary } from "@/lib/chat/tools";
import Photo from "@/components/Photo";

interface Message {
  role: "user" | "assistant";
  content: string;
  products?: ProductSummary[];
  tools?: string[];
}

const OPENER =
  "Namaste — I'm Sutra Help. I know every piece in the collection: what it's made of, who weaves it, and whether it's in stock. Ask me anything, or start here.";

const SUGGESTIONS = [
  "What should I wear to a wedding?",
  "Where's my order?",
  "How do I care for silk?",
  "Show me something under ₹5,000",
];

const TOOL_LABELS: Record<string, string> = {
  search_products: "Searching the collection",
  get_product: "Checking the details",
  lookup_orders: "Looking up your orders",
  add_to_cart: "Adding to your cart",
};

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);

  const logRef = useRef<HTMLDivElement>(null);
  const hydrated = useHydrated();

  const addItem = useCartStore((s) => s.addItem);
  const cartItems = useCartStore((s) => s.items);
  const user = useAuthStore((s) => s.user);
  const ordersFor = useAuthStore((s) => s.ordersFor);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, busy, open]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || busy) return;

      const history: Message[] = [
        ...messages,
        { role: "user", content: trimmed },
      ];
      setMessages(history);
      setDraft("");
      setBusy(true);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: history.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            context: {
              user: user ? { name: user.name, email: user.email } : null,
              cart: cartItems.map((i) => ({
                name: i.name,
                size: i.size,
                quantity: i.quantity,
                price: i.price,
              })),
              orders: user ? ordersFor(user.email) : [],
            },
          }),
        });

        if (!res.ok || !res.body) {
          const problem = await res
            .json()
            .then((d: { error?: string }) => d.error)
            .catch(() => null);
          setMessages([
            ...history,
            {
              role: "assistant",
              content:
                problem ?? "Sutra Help is unreachable right now. Try again shortly.",
            },
          ]);
          return;
        }

        setMessages([...history, { role: "assistant", content: "" }]);

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        const apply = (mutate: (m: Message) => Message) => {
          setMessages((prev) => {
            const next = [...prev];
            const last = next[next.length - 1];
            if (last?.role === "assistant") next[next.length - 1] = mutate(last);
            return next;
          });
        };

        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.trim()) continue;
            let event: { t: string; v?: unknown };
            try {
              event = JSON.parse(line);
            } catch {
              continue;
            }

            if (event.t === "text" && typeof event.v === "string") {
              const chunk = event.v;
              apply((m) => ({ ...m, content: m.content + chunk }));
            } else if (event.t === "tool" && typeof event.v === "string") {
              const name = event.v;
              apply((m) => ({ ...m, tools: [...(m.tools ?? []), name] }));
            } else if (event.t === "products" && Array.isArray(event.v)) {
              const found = event.v as ProductSummary[];
              apply((m) => ({
                ...m,
                products: [...(m.products ?? []), ...found],
              }));
            } else if (event.t === "action") {
              const action = event.v as {
                name: string;
                item: Parameters<typeof addItem>[0];
              };
              if (action?.name === "add_to_cart" && action.item) {
                const ok = addItem(action.item);
                toast[ok ? "success" : "error"](
                  ok
                    ? `${action.item.name} added to your cart`
                    : `${action.item.name} is at its stock limit`
                );
              }
            } else if (event.t === "error" && typeof event.v === "string") {
              const problem = event.v;
              apply((m) => ({
                ...m,
                content: m.content || problem,
              }));
            }
          }
        }
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: "That didn't go through. Check your connection and try again.",
          },
        ]);
      } finally {
        setBusy(false);
      }
    },
    [addItem, busy, cartItems, messages, ordersFor, user]
  );

  if (!hydrated) return null;

  return (
    <div className="print:hidden">
      {!open && (
        <button
          onClick={() => setOpen(true)}
          aria-label="Open Sutra Help"
          className="fixed bottom-7 right-3 z-40 flex h-12 w-12 max-md:bottom-[calc(4.4rem+env(safe-area-inset-bottom))] max-md:h-11 max-md:w-11 items-center justify-center rounded-full border border-accent-light/50 bg-primary-dark text-accent-light shadow-[0_14px_30px_-10px_rgba(0,0,0,0.6)] transition hover:-translate-y-0.5 hover:shadow-[0_18px_34px_-10px_rgba(0,0,0,0.66)]"
        >
          <MessageCircle size={21} />
        </button>
      )}

      {/* dvh, not vh: on phones `100vh` counts the browser's address bar as
          visible space, so the panel ran past the bottom of the screen and took
          the input and send button with it. dvh tracks the space that is
          actually on screen. On desktop the two are identical. */}
      {open && (
        <div className="fixed bottom-7 right-3 z-40 flex h-[min(660px,calc(100dvh-3rem))] w-[min(428px,calc(100vw-2.5rem))] max-md:inset-x-2 max-md:bottom-2 max-md:top-2 max-md:z-[60] max-md:h-auto max-md:w-auto origin-bottom-right animate-[sutra-expand_0.26s_cubic-bezier(0.2,0.8,0.3,1)] flex-col overflow-hidden rounded-[17px] border border-white/12 bg-cream shadow-[0_30px_64px_-22px_rgba(0,0,0,0.55)]">
          <div className="flex flex-shrink-0 items-center gap-3 bg-primary p-3.5 text-cream">
            <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-full border border-accent-light/40 bg-cream/10 text-accent-light">
              <svg viewBox="0 0 100 100" className="h-5 w-5" aria-hidden="true">
                <g fill="none" stroke="currentColor" strokeWidth={10}>
                  <path d="M53.83 34.32 A23 23 0 1 1 45.62 28.67" />
                  <path d="M46.17 65.68 A23 23 0 1 1 54.38 71.33" />
                </g>
              </svg>
            </span>
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block font-display text-base font-semibold">
                Sutra Help
              </span>
              <span className="flex items-center gap-1.5 text-[10.5px] text-cream/70">
                <span className="block h-1.5 w-1.5 rounded-full bg-green-400" />
                Usually replies instantly
              </span>
            </span>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              className="rounded-md p-1.5 text-cream/75 transition hover:bg-cream/10 hover:text-cream"
            >
              <X size={16} />
            </button>
          </div>

          <div
            ref={logRef}
            className="scrollbar-thin flex flex-1 flex-col gap-3 overflow-y-auto px-4 pb-2 pt-4 max-md:overscroll-contain"
          >
            <Bubble role="assistant">{OPENER}</Bubble>

            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex max-w-[88%] flex-col gap-1.5 ${
                  m.role === "user" ? "self-end items-end" : "self-start"
                }`}
              >
                {m.tools?.map((t, j) => (
                  <span
                    key={j}
                    className="text-[10.5px] font-medium text-foreground/45"
                  >
                    {TOOL_LABELS[t] ?? t}…
                  </span>
                ))}
                {m.content && <Bubble role={m.role}>{m.content}</Bubble>}
                {m.products?.length ? (
                  <div className="flex w-full flex-col gap-1.5">
                    {dedupe(m.products).map((p) => (
                      <ProductLine
                        key={p.slug}
                        product={p}
                        onNavigate={() => setOpen(false)}
                      />
                    ))}
                  </div>
                ) : null}
              </div>
            ))}

            {busy && !messages[messages.length - 1]?.content && (
              <div className="flex w-fit gap-1 self-start rounded-2xl rounded-bl-md bg-cream-dark px-3.5 py-3">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="block h-1.5 w-1.5 animate-bounce rounded-full bg-foreground/40"
                    style={{ animationDelay: `${i * 0.16}s` }}
                  />
                ))}
              </div>
            )}
          </div>

          {messages.length === 0 && (
            <div className="flex flex-shrink-0 flex-wrap gap-1.5 px-4 pb-3 pt-1">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-primary/25 px-3 py-1.5 text-[11.5px] font-medium text-primary transition hover:border-primary/50 hover:bg-primary/5"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(draft);
            }}
            className="flex flex-shrink-0 items-center gap-2.5 border-t border-white/10 bg-cream px-3.5 py-2.5"
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Ask about a fabric, a size, an order…"
              aria-label="Message Sutra Help"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-foreground/40"
            />
            <button
              type="submit"
              disabled={busy || !draft.trim()}
              aria-label="Send"
              className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-full bg-primary text-cream transition hover:bg-primary-dark disabled:opacity-40"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function dedupe(items: ProductSummary[]): ProductSummary[] {
  const seen = new Set<string>();
  return items.filter((p) => !seen.has(p.slug) && seen.add(p.slug));
}

function Bubble({
  role,
  children,
}: {
  role: "user" | "assistant";
  children: string;
}) {
  const mine = role === "user";
  return (
    <div
      className={`whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
        mine
          ? "self-end rounded-br-md bg-primary text-cream"
          : "self-start rounded-bl-md bg-cream-dark text-foreground"
      }`}
    >
      {withBold(children)}
    </div>
  );
}

/** Renders **bold** spans; everything else stays literal text. */
function withBold(text: string) {
  return text.split(/(\*\*[^*\n]+\*\*)/g).map((segment, i) =>
    segment.startsWith("**") && segment.endsWith("**") && segment.length > 4 ? (
      <strong key={i} className="font-semibold">
        {segment.slice(2, -2)}
      </strong>
    ) : (
      segment
    )
  );
}

function ProductLine({
  product,
  onNavigate,
}: {
  product: ProductSummary;
  onNavigate: () => void;
}) {
  return (
    <Link
      href={`/product/${product.slug}`}
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-xl border border-white/10 bg-cream-dark p-2 transition hover:border-accent/40"
    >
      <Photo
        src={product.image}
        sizes="50px"
        alt={product.name}
        className="h-[62px] w-[50px] flex-shrink-0 rounded-lg object-cover"
      />
      <span className="min-w-0 flex-1">
        <span className="block text-[12.5px] font-medium leading-tight">
          {product.name}
        </span>
        <span className="mt-0.5 block text-[10.5px] text-foreground/50">
          {[product.state, product.fabric].filter(Boolean).join(" · ")}
        </span>
        <span className="mt-1 block text-[12.5px] font-semibold text-primary tabular-nums">
          {formatPrice(product.price)}
          {product.compareAtPrice && (
            <s className="ml-1.5 text-[11px] font-normal text-foreground/40">
              {formatPrice(product.compareAtPrice)}
            </s>
          )}
        </span>
      </span>
    </Link>
  );
}
