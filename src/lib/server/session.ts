import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { query } from "@/lib/db";

/*
 * Server-side sessions.
 *
 * Until now the signed-in user lived only in the browser's Zustand store. The
 * server never knew who was calling, so every "gate" was advisory: anyone could
 * GET /api/orders and read every customer's name, phone and home address, POST
 * an order with no account, or PATCH any order to any status.
 *
 * Signing in now sets an httpOnly cookie holding the user, signed with an HMAC.
 * Routes read it back and decide from THAT, never from what the request body
 * claims. httpOnly keeps it out of reach of page scripts; SameSite=Lax stops
 * another site riding it on a cross-site POST or PATCH.
 */

export const SESSION_COOKIE = "sutra_session";
const MAX_AGE_SECONDS = 30 * 24 * 60 * 60;

export interface SessionUser {
  name: string;
  email: string;
  role: "USER" | "ADMIN";
}

interface SessionPayload {
  n: string;
  e: string;
  r: SessionUser["role"];
  /** Expiry, epoch milliseconds. */
  x: number;
  /** Fingerprint of the password at sign-in; see sessionVersion. */
  v: string;
}

/**
 * Derived from OTP_SECRET rather than adding a new secret, but never used as
 * OTP_SECRET itself: running it through its own HMAC with a fixed label gives
 * sessions a separate key, so a value signed for one purpose can never be
 * passed off as the other.
 *
 * Same rule as the reset codes - the development fallback is refused in
 * production, where it would let anyone who reads the source forge a session
 * for any account, the admin included.
 */
function sessionKey(): string {
  const base = process.env.OTP_SECRET?.trim();
  if (!base && process.env.NODE_ENV === "production") {
    throw new Error("OTP_SECRET is not set - refusing to sign sessions with a public fallback.");
  }
  return createHmac("sha256", base || "sutra-dev-otp-secret")
    .update("sutra-session-v1")
    .digest("base64url");
}

function sign(body: string): string {
  return createHmac("sha256", sessionKey()).update(body).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return bufA.length === bufB.length && timingSafeEqual(bufA, bufB);
}

/**
 * A short fingerprint of the account's stored password hash, carried in the
 * cookie and checked against the database on every request. Changing the
 * password (a reset, or Google taking over an account) changes the hash, and
 * with it every cookie issued before goes dead: a stolen or planted session no
 * longer outlives the password it was made with.
 */
export function sessionVersion(passwordHash: string): string {
  return createHmac("sha256", sessionKey()).update("pw:" + passwordHash).digest("base64url").slice(0, 16);
}

function encode(user: SessionUser, version: string): string {
  const payload: SessionPayload = {
    n: user.name,
    e: user.email.trim().toLowerCase(),
    r: user.role,
    x: Date.now() + MAX_AGE_SECONDS * 1000,
    v: version,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `${body}.${sign(body)}`;
}

function decode(token: string | undefined): (SessionUser & { version: string }) | null {
  if (!token) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature || !safeEqual(signature, sign(body))) return null;

  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as SessionPayload;
    if (typeof payload.x !== "number" || Date.now() > payload.x) return null;
    if (payload.r !== "USER" && payload.r !== "ADMIN") return null;
    if (typeof payload.e !== "string" || !payload.e.includes("@")) return null;
    if (typeof payload.v !== "string" || !payload.v) return null;
    return { name: String(payload.n ?? ""), email: payload.e, role: payload.r, version: payload.v };
  } catch {
    return null;
  }
}

interface AccountRow {
  name: string;
  email: string;
  role: SessionUser["role"];
  password_hash: string;
}

/**
 * The signed-in user for this request, or null.
 *
 * The cookie alone is not trusted for long: the account is read back so a
 * deleted account, a changed password or a removed admin role takes effect at
 * once instead of when the cookie expires up to 30 days later. Name and role
 * come from the database, not from the cookie.
 */
export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const claimed = decode(store.get(SESSION_COOKIE)?.value);
  if (!claimed) return null;

  let row: AccountRow | undefined;
  try {
    [row] = await query<AccountRow[]>(
      "SELECT name, email, role, password_hash FROM users WHERE email = $1 LIMIT 1",
      [claimed.email]
    );
  } catch (error) {
    console.error("[session] account lookup failed", error);
    return null;
  }
  if (!row || !safeEqual(claimed.version, sessionVersion(row.password_hash))) return null;
  return { name: row.name, email: row.email, role: row.role };
}

/** `passwordHash` is the account's stored hash, fingerprinted into the cookie. */
export function setSessionCookie(res: NextResponse, user: SessionUser, passwordHash: string): void {
  res.cookies.set(SESSION_COOKIE, encode(user, sessionVersion(passwordHash)), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}
