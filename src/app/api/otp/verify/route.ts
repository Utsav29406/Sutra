import { NextRequest, NextResponse } from "next/server";
import { verifyChallenge } from "@/lib/otp";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const challenge = body?.challenge;
  const code = body?.code;

  if (typeof challenge !== "string" || typeof code !== "string") {
    return NextResponse.json({ ok: false, error: "Something went wrong. Please try again." }, { status: 400 });
  }

  // Not consumed here: the form checks the code before showing the password
  // fields, then submits it again with the new password. Consuming now would
  // make the reset reject the very code it just accepted.
  let result: Awaited<ReturnType<typeof verifyChallenge>>;
  try {
    result = await verifyChallenge(challenge, code);
  } catch (error) {
    console.error("[otp/verify]", error);
    return NextResponse.json({ ok: false, error: "Could not check the code just now. Please try again." }, { status: 500 });
  }
  if (!result.ok) {
    return NextResponse.json({ ok: false, error: result.error });
  }

  return NextResponse.json({ ok: true });
}
