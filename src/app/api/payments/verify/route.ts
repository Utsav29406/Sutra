import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/server/session";
import { getOrder } from "@/lib/server/orders";
import { settlePayment } from "@/lib/server/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Called by the browser once the Cashfree window closes, or on the return page. */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: "Please sign in first." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const id = typeof body?.orderId === "string" ? body.orderId : "";
  const existing = id ? await getOrder(id).catch(() => null) : null;
  // Someone else's order answers like a missing one.
  if (!existing || existing.email !== session.email) {
    return NextResponse.json({ ok: false, error: "No such order." }, { status: 404 });
  }

  try {
    const { order, paid } = await settlePayment(id);
    return NextResponse.json({ ok: true, paid, order });
  } catch (error) {
    console.error("[payments verify]", error);
    return NextResponse.json({ ok: false, error: "Could not check the payment. Please refresh in a moment." }, { status: 502 });
  }
}
