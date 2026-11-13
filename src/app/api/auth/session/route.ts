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
  // A database hiccup is "don't know", not "signed out": answering user:null
  // would sign the browser out while its cookie is still good. ok:false makes
  // the store keep what it has.
  try {
    return NextResponse.json({ ok: true, user: await getSession({ throwOnDbError: true }) });
  } catch {
    return NextResponse.json({ ok: false, error: "Could not check your session." }, { status: 503 });
  }
}
