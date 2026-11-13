import { after, NextRequest, NextResponse } from "next/server";
import { rejectNonJson } from "@/lib/server/json-only";
import { createChallenge, maskEmail } from "@/lib/otp";
import { findAccount } from "@/lib/server/users";
import { sendOtpCode } from "@/lib/server/email";
import { CAPTCHA_ERROR, clientIp, verifyTurnstile } from "@/lib/server/turnstile";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const notJson = rejectNonJson(req);
  if (notJson) return notJson;
  const body = await req.json().catch(() => null);
  const identifier = body?.identifier;

  // A real email only (the same rule as sign-up). Anything looser let
  // "login:someone@x.com" through, which shares its lock row with that
  // person's wrong-password limit: failing codes for it paused their sign-in.
  if (
    typeof identifier !== "string" ||
    identifier.trim().length > 190 ||
    !/^[^\s@:]+@[^\s@]+\.[^\s@]+$/.test(identifier.trim().toLowerCase())
  ) {
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
  // A database error is not "no account": answering "code sent" and sending
  // nothing would leave a real customer waiting for an email that never comes.
  let account: Awaited<ReturnType<typeof findAccount>>;
  try {
    account = await findAccount(email);
  } catch (error) {
    console.error("[otp/request] account lookup failed:", error);
    return NextResponse.json({ ok: false, error: "Could not send a code just now. Please try again." }, { status: 500 });
  }
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

  // In production the email goes out after the reply, so a registered address
  // answers as fast as an unknown one: waiting for the mail provider first
  // made the response time reveal who has an account.
  if (process.env.NODE_ENV === "production") {
    const to = account.email;
    after(async () => {
      const mail = await sendOtpCode(to, code).catch((error) => ({ ok: false as const, error: String(error) }));
      if (!mail.ok) console.error("[otp/request] could not send code:", mail.error);
    });
    return NextResponse.json({ ok: true, challenge, masked, delivery: "email" });
  }

  // Outside production (only): send now, and if no mail provider is set up,
  // hand the code back so the flow stays testable. Never in production, where
  // that would let anyone reset any account by calling this endpoint.
  const mail = await sendOtpCode(account.email, code);
  if (!mail.ok) {
    console.error("[otp/request] could not send code:", mail.error);
    return NextResponse.json({ ok: true, challenge, masked, delivery: "none", devCode: code });
  }

  return NextResponse.json({ ok: true, challenge, masked, delivery: "email" });
}
