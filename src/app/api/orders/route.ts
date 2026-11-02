import { NextRequest, NextResponse } from "next/server";
import { listOrders, createOrder } from "@/lib/server/orders";
import { sendOrderConfirmation } from "@/lib/server/email";
import type { Order, OrderStatus } from "@/lib/order";
import { getSession } from "@/lib/server/session";
import { checkItems, checkTotals } from "@/lib/server/order-totals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();

  // Signed out: an empty list, not an error. The store asks on every page load
  // for everyone, and a visitor browsing the shop simply has no orders to see.
  if (!session) return NextResponse.json({ ok: true, orders: [] });

  try {
    // The admin sees the whole shop; everyone else sees only their own orders.
    // This used to return every order to anyone - names, phones, home addresses.
    const orders = session.role === "ADMIN" ? await listOrders() : await listOrders(session.email);
    return NextResponse.json({ ok: true, orders });
  } catch (error) {
    console.error("[orders GET]", error);
    return NextResponse.json({ ok: false, error: "Could not load orders." }, { status: 500 });
  }
}

const STATUSES: OrderStatus[] = [
  "Processing",
  "Shipped",
  "Delivered",
  "Cancelled",
  "Return Requested",
  "Returned",
];

/**
 * Checks the order against what the columns will actually accept.
 *
 * Without this the insert fails inside MySQL and the customer is told "Could
 * not save your order. Please try again." - advice that can never work, because
 * the same too-long address fails identically every time. A 400 that names the
 * problem is the difference between a fixable mistake and a dead end.
 */
function describeProblem(order: Order): string | null {
  if (typeof order.id !== "string" || !/^[A-Za-z0-9-]{4,32}$/.test(order.id)) {
    return "That order reference is not valid.";
  }
  for (const field of [order.address, order.customerName, order.phone, order.couponCode]) {
    if (field != null && typeof field !== "string") return "That order looks incomplete.";
  }
  if (!order.email?.includes("@") || order.email.length > 190) {
    return "Enter a valid email address.";
  }
  if (!order.address?.trim()) return "Enter a delivery address.";
  if (order.address.length > 500) return "That address is too long. Please shorten it.";
  if ((order.customerName ?? "").length > 120) return "That name is too long.";
  if ((order.phone ?? "").length > 20) return "That phone number is too long.";
  if ((order.couponCode ?? "").length > 40) return "That coupon code is not valid.";
  // Card / UPI was a demo with no payment taken. Until a payment gateway is
  // connected, an order marked "card" would read as paid when it isn't.
  if (order.paymentMethod !== "cod") return "Only Cash on Delivery is available right now.";
  if (!STATUSES.includes(order.status)) return "Unknown order status.";
  if (!Number.isFinite(order.total) || order.total < 0) return "That order total is not valid.";
  if (order.discount != null && (!Number.isFinite(order.discount) || order.discount < 0)) {
    return "That discount is not valid.";
  }

  for (const item of order.items) {
    if (!item?.name || !item.size) return "An item on that order is incomplete.";
    if (item.name.length > 200 || item.size.length > 32) return "An item on that order is too long.";
    if (!Number.isFinite(item.price) || item.price < 0) return "An item price is not valid.";
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      return "An item quantity is not valid.";
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  // The checkout page already sends signed-out visitors to login, but that runs
  // in the browser and anyone can skip it. This is the check that actually holds.
  const session = await getSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "Please sign in to place your order." },
      { status: 401 }
    );
  }

  const body = await req.json().catch(() => null);
  const order = body?.order as Order | undefined;

  if (!order?.id || !Array.isArray(order.items) || order.items.length === 0) {
    return NextResponse.json({ ok: false, error: "That order looks incomplete." }, { status: 400 });
  }

  // The order belongs to whoever is signed in, whatever the request body says.
  // Trusting the body would let one customer file an order under someone
  // else's address - and it would then appear in that person's history.
  order.email = session.email;
  // A new order starts now and in Processing, whatever the request says. A
  // client-chosen "Delivered" with a far-future date kept the return window
  // open forever and skewed the admin's revenue by date.
  order.status = "Processing";
  order.placedAt = new Date().toISOString();
  delete order.updatedAt;

  const problem = describeProblem(order) ?? checkItems(order);
  if (problem) {
    return NextResponse.json({ ok: false, error: problem }, { status: 400 });
  }

  const checked = checkTotals(order);
  if (typeof checked === "string") {
    return NextResponse.json({ ok: false, error: checked }, { status: 409 });
  }
  // Store the server's figures, not the request's.
  order.total = checked.total;
  if (checked.discount > 0) order.discount = checked.discount;
  else delete order.discount;
  if (checked.couponCode) order.couponCode = checked.couponCode;
  else delete order.couponCode;

  try {
    const saved = await createOrder(order);

    // The order is already safe in the database, so a mail failure must not turn
    // a successful purchase into an error for the customer. Log it and move on.
    const mail = await sendOrderConfirmation(saved);
    if (!mail.ok) console.error("[orders] confirmation email failed:", mail.error);

    return NextResponse.json({ ok: true, order: saved, emailed: mail.ok }, { status: 201 });
  } catch (error) {
    console.error("[orders POST]", error);
    return NextResponse.json(
      { ok: false, error: "Could not save your order. Please try again." },
      { status: 500 }
    );
  }
}
