import { NextRequest, NextResponse } from "next/server";
import { resetPassword } from "@/lib/server/users";
import { verifyChallenge } from "@/lib/otp";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { challenge, code, password } = body ?? {};

  if (typeof challenge !== "string" || typeof code !== "string" || typeof password !== "string") {
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Please start again." },
      { status: 400 }
    );
  }

  // Checked before the code is spent: a too-short password used to burn the
  // code and send the customer back to request another.
  if (password.length < 6 || password.length > 200) {
    return NextResponse.json(
      { ok: false, error: password.length < 6 ? "Password must be at least 6 characters." : "That password is too long." },
      { status: 400 }
    );
  }

  // The signed OTP challenge carries the email it was issued for, so the account
  // being reset is the one that was verified — not whatever the client asks for.
  // Consumed here, so a challenge cannot be replayed to reset the password
  // again later while it is still inside its window.
  let verified: Awaited<ReturnType<typeof verifyChallenge>>;
  try {
    verified = await verifyChallenge(challenge, code, { consume: true });
  } catch (error) {
    console.error("[auth/reset-password] verify", error);
    return NextResponse.json({ ok: false, error: "Could not reach the database. Please try again." }, { status: 500 });
  }
  if (!verified.ok) {
    return NextResponse.json({ ok: false, error: verified.error }, { status: 401 });
  }

  try {
    const result = await resetPassword(verified.identifier, password);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (error) {
    console.error("[auth/reset-password]", error);
    return NextResponse.json(
      { ok: false, error: "Could not reach the database. Please try again." },
      { status: 500 }
    );
  }
}
