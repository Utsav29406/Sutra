import { NextRequest, NextResponse } from "next/server";
import { deleteUnpaidOrder, getOrder, markOrderRefunded, setOrderStatus } from "@/lib/server/orders";
import { cashfreeEnabled, refundCashfreeOrder } from "@/lib/server/cashfree";
import { sendOrderStatusUpdate } from "@/lib/server/email";
import { getSession } from "@/lib/server/session";
import { canCancel, canRequestReturn, isDemoPayment, nextStatuses, type Order, type OrderStatus } from "@/lib/order";

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
    const existing = await getOrder(id);
    if (session.role !== "ADMIN") {
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
    } else {
      if (!existing) return NextResponse.json({ ok: false, error: "No such order." }, { status: 404 });
      // The admin follows the same steps as the order list's buttons, checked
      // against where the order is now - not where a tab opened an hour ago
      // thought it was. Without this a stale tab could ship an order the
      // customer had just cancelled (and been refunded for).
      if (!nextStatuses(existing).includes(status)) {
        return NextResponse.json(
          { ok: false, error: `This order is ${existing.status} now, so it can't be marked ${status}. Refresh to see it.` },
          { status: 409 }
        );
      }
      // An online order whose payment never came through is not a sale.
      if (existing.paymentStatus === "pending" && status !== "Cancelled") {
        return NextResponse.json({ ok: false, error: "This order hasn't been paid yet." }, { status: 409 });
      }
    }

    // Conditional on the status just checked, so a change in between loses.
    let order = await setOrderStatus(id, status, existing.status);
    if (!order) {
      return NextResponse.json(
        { ok: false, error: "This order has just been updated. Refresh the page to see where it is." },
        { status: 409 }
      );
    }

    // A paid online order that is cancelled or comes back is refunded in full,
    // to the card or UPI account it came from. If Cashfree refuses, the order
    // stays "paid" so the admin can see it still needs refunding.
    if ((status === "Cancelled" || status === "Returned") && order.paymentStatus === "paid") {
      try {
        // A demo payment moved no money, so its refund is only recorded.
        if (!isDemoPayment(order)) {
          if (!cashfreeEnabled()) throw new Error("Cashfree keys are not set");
          await refundCashfreeOrder(order.id, order.total);
        }
        await markOrderRefunded(order.id);
        order = { ...order, paymentStatus: "refunded" };
      } catch (error) {
        console.error("[orders] refund failed", order.id, error);
      }
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

/**
 * Drops the shopper's own online order whose payment window was closed or
 * failed, so abandoned attempts don't pile up as unpaid orders. Only ever an
 * order that is still unpaid; a paid one is untouched.
 */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: "Please sign in first." }, { status: 401 });
  const { id } = await ctx.params;
  try {
    const existing = await getOrder(id);
    if (!existing || existing.email !== session.email) {
      return NextResponse.json({ ok: false, error: "No such order." }, { status: 404 });
    }
    if (existing.paymentStatus !== "pending") {
      return NextResponse.json({ ok: false, error: "Only an unpaid order can be removed." }, { status: 409 });
    }
    await deleteUnpaidOrder(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("[orders DELETE]", error);
    return NextResponse.json({ ok: false, error: "Could not remove that order." }, { status: 500 });
  }
}
