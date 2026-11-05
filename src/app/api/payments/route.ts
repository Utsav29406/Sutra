import { NextResponse } from "next/server";
import { cashfreeMode, paymentProvider } from "@/lib/server/cashfree";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Which gateway "Pay online" uses, and Cashfree's mode when it is Cashfree. */
export async function GET() {
  const provider = paymentProvider();
  return NextResponse.json({ ok: true, online: true, provider, mode: provider === "cashfree" ? cashfreeMode() : "demo" });
}
