import { NextRequest, NextResponse } from "next/server";
import { getOrder, setOrderStatus } from "@/lib/server/orders";
import { sendOrderStatusUpdate } from "@/lib/server/email";
import { getSession } from "@/lib/server/session";
import { canCancel, canRequestReturn, type Order, type OrderStatus } from "@/lib/order";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES: OrderStatus[] = [
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Return Requested",
  "Returned",
];

/**
 * What a customer may do to their own order - exactly the two buttons the order
 * page already offers, under the same rules it already applies. Shipping,
 * delivering and completing returns are the shop's job, so only the admin can
 * move an order any other way.
 */
function customerMayChange(order: Order, status: OrderStatus): boolean {
  if (status === "Cancelled") return canCancel(order);
  if (status === "Return Requested") return canRequestReturn(order);
  return false;
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Please sign in first." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  const status = body?.status;

  if (!STATUSES.includes(status)) {
    return NextResponse.json({ ok: false, error: "Unknown order status." }, { status: 400 });
  }

  try {
    let from: OrderStatus | undefined;
    if (session.role !== "ADMIN") {
      const existing = await getOrder(id);
      // Someone else's order answers exactly like a missing one, so the endpoint
      // cannot be used to discover which order ids exist.
      if (!existing || existing.email !== session.email) {
        return NextResponse.json({ ok: false, error: "No such order." }, { status: 404 });
      }
      if (!customerMayChange(existing, status)) {
        return NextResponse.json(
          { ok: false, error: "That change isn't available for this order." },
          { status: 403 }
        );
      }
      from = existing.status;
    }

    const order = await setOrderStatus(id, status, from);
    if (!order) {
      return from
        ? NextResponse.json(
            { ok: false, error: "This order has just been updated. Refresh the page to see where it is." },
            { status: 409 }
          )
        : NextResponse.json({ ok: false, error: "No such order." }, { status: 404 });
    }

    // Status is already committed; a mail failure must not fail the update.
    const mail = await sendOrderStatusUpdate(order);
    if (mail && !mail.ok) console.error("[orders] status email failed:", mail.error);

    return NextResponse.json({ ok: true, order, emailed: mail?.ok ?? false });
  } catch (error) {
    console.error("[orders PATCH]", error);
    return NextResponse.json(
      { ok: false, error: "Could not update that order." },
      { status: 500 }
    );
  }
}
