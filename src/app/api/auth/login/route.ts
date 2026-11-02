import { NextRequest, NextResponse } from "next/server";
import { signIn } from "@/lib/server/users";
import { setSessionCookie } from "@/lib/server/session";
import { alertSignIn } from "@/lib/server/sign-in-alert";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { email, password } = body ?? {};

  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json({ ok: false, error: "Enter your email and password." }, { status: 400 });
  }

  try {
    const result = await signIn(email, password);
    const res = result.ok
      ? NextResponse.json({ ok: true, user: result.user })
      : NextResponse.json(result, { status: 401 });
    // The server now remembers who signed in, rather than trusting the browser to.
    if (result.ok) {
      setSessionCookie(res, result.user, result.passwordHash);
      // Tell the account's owner, by email, that it was just signed in.
      alertSignIn(req, result.user, "Password");
    }
    return res;
  } catch (error) {
    console.error("[auth/login]", error);
    return NextResponse.json(
      { ok: false, error: "Could not reach the database. Please try again." },
      { status: 500 }
    );
  }
}
