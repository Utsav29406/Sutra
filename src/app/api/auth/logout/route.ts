import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/server/session";

export const runtime = "nodejs";

/**
 * Signing out has to reach the server now. Clearing only the browser's copy
 * would leave the cookie alive, and the next person at a shared computer would
 * still be signed in as the last one.
 */
export async function POST() {
  const res = NextResponse.json({ ok: true });
  clearSessionCookie(res);
  return res;
}
