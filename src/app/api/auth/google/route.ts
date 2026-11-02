import { NextRequest, NextResponse } from "next/server";
import { googleClientId, verifyGoogleIdToken } from "@/lib/server/google";
import { signInWithGoogle } from "@/lib/server/users";
import { setSessionCookie } from "@/lib/server/session";
import { alertSignIn } from "@/lib/server/sign-in-alert";

export const runtime = "nodejs";

/** Turns a Google ID token from the button or One Tap into a Sutra session. */
export async function POST(req: NextRequest) {
  if (!googleClientId) {
    return NextResponse.json({ ok: false, error: "Google sign-in is not available." }, { status: 503 });
  }
  const body = await req.json().catch(() => null);

  let account;
  try {
    account = await verifyGoogleIdToken(body?.credential);
  } catch (error) {
    console.error("[auth/google] keys", error);
    return NextResponse.json({ ok: false, error: "Could not reach Google. Please try again." }, { status: 502 });
  }
  if (!account) {
    return NextResponse.json({ ok: false, error: "Google sign-in failed. Please try again." }, { status: 401 });
  }

  try {
    const { user, passwordHash } = await signInWithGoogle(account.email, account.name);
    const res = NextResponse.json({ ok: true, user });
    setSessionCookie(res, user, passwordHash);
    alertSignIn(req, user, "Google");
    return res;
  } catch (error) {
    console.error("[auth/google]", error);
    return NextResponse.json(
      { ok: false, error: "Could not reach the database. Please try again." },
      { status: 500 }
    );
  }
}
