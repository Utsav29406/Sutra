import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Who the server thinks is signed in.
 *
 * The browser keeps its own copy of the user for instant rendering, but that
 * copy can be stale - left over from before sessions existed, or outliving an
 * expired cookie. The store checks here on load and defers to the answer, so
 * the page never shows someone as signed in while every request fails as
 * signed out.
 */
export async function GET() {
  return NextResponse.json({ ok: true, user: await getSession() });
}
