import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/server/session";
import { getOrder } from "@/lib/server/orders";
import { paymentProvider } from "@/lib/server/cashfree";
import { settleSutraPay } from "@/lib/server/payments";
import { cardBrand, cardDeclined, cardProblem, digits, TEST, upiDeclined, upiValid } from "@/lib/sutrapay";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Sutra Pay, the dummy gateway: decides a payment the way a bank would, from
 * the details entered (lib/sutrapay has the test card, UPI IDs and OTP). No
 * money moves; card numbers are checked and dropped, only the last four are
 * kept. Off whenever Cashfree is the gateway, so it can never stand in for a
 * real payment.
 */
export async function POST(req: NextRequest) {
  if (paymentProvider() !== "sutrapay") {
    return NextResponse.json({ ok: false, error: "Sutra Pay is off." }, { status: 403 });
  }
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: "Please sign in first." }, { status: 401 });

  const body = await req.json().catch(() => null);
  const id = typeof body?.orderId === "string" ? body.orderId : "";
  const order = id ? await getOrder(id).catch(() => null) : null;
  // Someone else's order answers like a missing one.
  if (!order || order.email !== session.email) {
    return NextResponse.json({ ok: false, error: "No such order." }, { status: 404 });
  }
  if (order.paymentMethod !== "card") {
    return NextResponse.json({ ok: false, error: "This order is cash on delivery." }, { status: 400 });
  }
  if (order.paymentStatus === "paid") return NextResponse.json({ ok: true, paid: true, order });
  if (order.paymentStatus !== "pending") {
    return NextResponse.json({ ok: false, error: "This order can't be paid now." }, { status: 409 });
  }

  const stamp = Date.now().toString(36).toUpperCase();
  let ref: string;
  if (body?.method === "card") {
    const card = {
      number: String(body.card?.number ?? ""),
      expiry: String(body.card?.expiry ?? ""),
      cvv: String(body.card?.cvv ?? ""),
    };
    const problem = cardProblem(card);
    if (problem) return NextResponse.json({ ok: false, error: problem }, { status: 400 });
    if (String(body.card?.otp ?? "") !== TEST.otp) {
      return NextResponse.json({ ok: true, paid: false, error: "Incorrect OTP. The payment was not made." });
    }
    if (cardDeclined(card.number)) {
      return NextResponse.json({ ok: true, paid: false, error: "Your bank declined this card. No money was taken." });
    }
    ref = `SPAY-CARD-${(cardBrand(card.number) ?? "CARD").toUpperCase()}-${digits(card.number).slice(-4)}-${stamp}`;
  } else if (body?.method === "upi" && body.upi?.qr === true) {
    // Scanned QR: in the demo, "I've paid" stands for the app confirming, and
    // "simulate a failed payment" for the shopper giving up in the app.
    if (body.upi.simulate === "decline") {
      return NextResponse.json({ ok: true, paid: false, error: "The payment was not completed in the UPI app. No money was taken." });
    }
    ref = `SPAY-UPI-QR-${stamp}`;
  } else if (body?.method === "upi") {
    const vpa = String(body.upi?.vpa ?? "").trim().toLowerCase();
    if (!upiValid(vpa)) return NextResponse.json({ ok: false, error: "Check the UPI ID." }, { status: 400 });
    if (upiDeclined(vpa)) {
      return NextResponse.json({ ok: true, paid: false, error: "The payment request was declined in the UPI app." });
    }
    ref = `SPAY-UPI-${stamp}`;
  } else {
    return NextResponse.json({ ok: false, error: "Choose card or UPI." }, { status: 400 });
  }

  try {
    const updated = await settleSutraPay(id, ref);
    if (!updated) return NextResponse.json({ ok: false, error: "This order can't be paid now." }, { status: 409 });
    return NextResponse.json({ ok: true, paid: true, order: updated });
  } catch (error) {
    console.error("[payments sutrapay]", error);
    return NextResponse.json({ ok: false, error: "Could not record the payment." }, { status: 500 });
  }
}
