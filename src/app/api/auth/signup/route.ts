import { NextRequest, NextResponse } from "next/server";
import { signUp } from "@/lib/server/users";
import { setSessionCookie } from "@/lib/server/session";
import { CAPTCHA_ERROR, clientIp, verifyTurnstile } from "@/lib/server/turnstile";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { name, email, password, phone, captcha } = body ?? {};

  if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json({ ok: false, error: "Fill in every field." }, { status: 400 });
  }

  // Before touching the database: a bot that fails the check costs nothing.
  if (!(await verifyTurnstile(captcha, clientIp(req.headers)))) {
    return NextResponse.json({ ok: false, error: CAPTCHA_ERROR }, { status: 400 });
  }

  try {
    const result = await signUp(
      name,
      email,
      password,
      typeof phone === "string" ? phone : undefined
    );
    const res = result.ok
      ? NextResponse.json({ ok: true, user: result.user }, { status: 201 })
      : NextResponse.json(result, { status: 400 });
    // Signing up signs you in, exactly as before - now on the server as well.
    if (result.ok) setSessionCookie(res, result.user, result.passwordHash);
    return res;
  } catch (error) {
    console.error("[auth/signup]", error);
    return NextResponse.json(
      { ok: false, error: "Could not reach the database. Please try again." },
      { status: 500 }
    );
  }
}
