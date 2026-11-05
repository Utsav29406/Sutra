import { NextResponse } from "next/server";
import { getSession } from "@/lib/server/session";
import { getCircle, joinCircle } from "@/lib/server/circle";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The signed-in shopper's Sutra Gold status; null when signed out or not a member. */
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: true, circle: null });
  try {
    return NextResponse.json({ ok: true, circle: await getCircle(session.email) });
  } catch (error) {
    console.error("[circle GET]", error);
    return NextResponse.json({ ok: false, error: "Could not load your membership." }, { status: 500 });
  }
}

/** Joins Sutra Gold. Free, so there is nothing to confirm beyond being signed in. */
export async function POST() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Sign in to join Sutra Gold." }, { status: 401 });
  }
  try {
    return NextResponse.json({ ok: true, circle: await joinCircle(session.email) });
  } catch (error) {
    console.error("[circle POST]", error);
    return NextResponse.json({ ok: false, error: "Could not join right now. Please try again." }, { status: 500 });
  }
}
