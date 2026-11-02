import { NextRequest, NextResponse } from "next/server";
import { createChallenge, maskEmail } from "@/lib/otp";
import { findAccount } from "@/lib/server/users";
import { sendOtpCode } from "@/lib/server/email";
import { CAPTCHA_ERROR, clientIp, verifyTurnstile } from "@/lib/server/turnstile";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const identifier = body?.identifier;

  if (typeof identifier !== "string" || !identifier.includes("@") || identifier.trim().length > 190) {
    return NextResponse.json({ ok: false, error: "Enter a valid email address." }, { status: 400 });
  }

  // Every send needs a fresh check, resends included: otherwise a script could
  // email codes to any number of addresses, spamming them and burning our quota.
  if (!(await verifyTurnstile(body?.captcha, clientIp(req.headers)))) {
    return NextResponse.json({ ok: false, error: CAPTCHA_ERROR }, { status: 400 });
  }

  const email = identifier.trim().toLowerCase();

  // Only issue a challenge for an address that actually has an account. The
  // reply is deliberately identical either way, so this endpoint cannot be used
  // to discover which addresses are registered.
  const account = await findAccount(email).catch(() => null);
  const masked = maskEmail(email);

  // Issued before the account check, and by the same path either way, so a
  // rate-limited or paused address answers identically whether or not it is
  // registered - otherwise the limits themselves would leak who has an account.
  let issued: Awaited<ReturnType<typeof createChallenge>>;
  try {
    issued = await createChallenge(email);
  } catch (error) {
    console.error("[otp/request] could not issue a code:", error);
    return NextResponse.json({ ok: false, error: "Could not send a code just now. Please try again." }, { status: 500 });
  }
  if (!issued.ok) {
    return NextResponse.json(
      { ok: false, error: issued.error },
      { status: 429, headers: { "Retry-After": String(issued.retryAfterSeconds) } }
    );
  }
  const { challenge, code } = issued;

  // Unknown address: reply exactly as if it had worked, but send nothing. The
  // reset itself fails later against a non-existent account.
  if (!account) {
    return NextResponse.json({ ok: true, challenge, masked, delivery: "email" });
  }

  const mail = await sendOtpCode(account.email, code);

  if (!mail.ok) {
    console.error("[otp/request] could not send code:", mail.error);

    // Outside production the code is returned so the flow stays testable with no
    // mail provider configured. Never in production: handing the code back would
    // let anyone reset any account by calling this endpoint directly.
    if (process.env.NODE_ENV !== "production") {
      return NextResponse.json({ ok: true, challenge, masked, delivery: "none", devCode: code });
    }
    return NextResponse.json(
      { ok: false, error: "We could not send your code right now. Please try again shortly." },
      { status: 502 }
    );
  }

  return NextResponse.json({ ok: true, challenge, masked, delivery: "email" });
}
