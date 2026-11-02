import "server-only";

/*
 * Cloudflare Turnstile — the bot check on sign-up and on requesting a
 * password-reset code. The browser widget (components/Turnstile.tsx) hands the
 * form a single-use token; this confirms it with Cloudflare before the route
 * does anything that costs us (a new account row, an outgoing email).
 *
 * Off until TURNSTILE_SECRET_KEY is set, so a deploy made before the keys exist
 * cannot lock everyone out of signing up. Set it together with
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY: a secret without a site key means the form
 * never gets a token, and every attempt is refused.
 */

const VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

export const CAPTCHA_ERROR = "Please complete the security check and try again.";

export function turnstileEnabled(): boolean {
  return Boolean(process.env.TURNSTILE_SECRET_KEY?.trim());
}

export async function verifyTurnstile(token: unknown, ip?: string | null): Promise<boolean> {
  // Pasted/piped env values can carry a BOM or stray whitespace.
  const secret = process.env.TURNSTILE_SECRET_KEY?.replace(/^﻿/, "").trim();
  if (!secret) return true;
  if (typeof token !== "string" || !token || token.length > 2048) return false;

  const form = new URLSearchParams({ secret, response: token });
  if (ip) form.set("remoteip", ip);

  try {
    const res = await fetch(VERIFY_URL, {
      method: "POST",
      body: form,
      signal: AbortSignal.timeout(8000),
    });
    const data = (await res.json()) as { success?: boolean; "error-codes"?: string[] };
    if (!data.success) console.warn("[turnstile] rejected:", data["error-codes"]?.join(", "));
    return data.success === true;
  } catch (error) {
    // Refuse rather than wave through: a check that passes whenever Cloudflare
    // is unreachable is a check a bot can route around.
    console.error("[turnstile] could not verify:", error);
    return false;
  }
}

/** The visitor's address as Vercel reports it, passed to Cloudflare as a signal. */
export function clientIp(headers: Headers): string | null {
  return headers.get("x-forwarded-for")?.split(",")[0].trim() || null;
}
