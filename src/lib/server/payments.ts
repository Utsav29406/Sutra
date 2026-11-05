import "server-only";
import { getOrder, markOrderPaid } from "@/lib/server/orders";
import { getCashfreeOrder, paymentProvider } from "@/lib/server/cashfree";
import { sendOrderConfirmation } from "@/lib/server/email";
import type { Order } from "@/lib/order";

/**
 * Asks Cashfree whether an online order has been paid, and if so records it and
 * sends the confirmation email. Shared by the browser's check after the payment
 * window closes and by Cashfree's webhook; whichever arrives first does the work.
 */
export async function settlePayment(id: string): Promise<{ order: Order | null; paid: boolean }> {
  const order = await getOrder(id);
  if (!order || order.paymentMethod !== "card") return { order, paid: false };
  if (order.paymentStatus !== "pending") return { order, paid: order.paymentStatus === "paid" };
  // Never paid through Cashfree when there is no Cashfree account to ask.
  if (paymentProvider() !== "cashfree") return { order, paid: false };

  const cf = await getCashfreeOrder(id);
  // Paid, and for the amount this order is worth: a session opened for a
  // different figure would not be this order's payment.
  if (cf.order_status !== "PAID" || Math.abs(Number(cf.order_amount) - order.total) > 0.005) {
    return { order, paid: false };
  }

  const updated = await markOrderPaid(id, cf.cf_order_id != null ? String(cf.cf_order_id) : null);
  if (updated) {
    const mail = await sendOrderConfirmation(updated);
    if (!mail.ok) console.error("[payments] confirmation email failed:", mail.error);
    return { order: updated, paid: true };
  }
  // Settled in the meantime by the other caller.
  const now = await getOrder(id);
  return { order: now, paid: now?.paymentStatus === "paid" };
}

/** Records a Sutra Pay payment (no money moved) and sends the confirmation, once. */
export async function settleSutraPay(id: string, ref: string): Promise<Order | null> {
  const updated = await markOrderPaid(id, ref.slice(0, 64));
  if (updated) {
    const mail = await sendOrderConfirmation(updated);
    if (!mail.ok) console.error("[payments] confirmation email failed:", mail.error);
  }
  return updated;
}
