import "server-only";
import { query, mutate, transaction, toSqlDate, fromSqlDate, normalizeEmail } from "@/lib/db";
import type { Order, OrderItem, OrderStatus, PaymentStatus } from "@/lib/order";
import { returnStock, takeStock } from "@/lib/server/stock";

interface OrderRow {
  id: string;
  email: string;
  placed_at: Date;
  updated_at: Date | null;
  total: string;
  discount: string | null;
  coupon_code: string | null;
  payment_method: "cod" | "card";
  address: string;
  customer_name: string | null;
  phone: string | null;
  status: OrderStatus;
  payment_status: PaymentStatus | null;
  payment_ref: string | null;
}

interface ItemRow {
  order_id: string;
  product_id: string;
  slug: string;
  name: string;
  size: string;
  quantity: number;
  price: string;
}

function toItem(row: ItemRow): OrderItem {
  return {
    productId: row.product_id,
    slug: row.slug,
    name: row.name,
    size: row.size,
    quantity: row.quantity,
    // numeric comes back as a string to protect precision.
    price: Number(row.price),
  };
}

function toOrder(row: OrderRow, items: OrderItem[]): Order {
  return {
    id: row.id,
    placedAt: fromSqlDate(row.placed_at),
    ...(row.updated_at ? { updatedAt: fromSqlDate(row.updated_at) } : {}),
    items,
    total: Number(row.total),
    ...(row.discount !== null ? { discount: Number(row.discount) } : {}),
    ...(row.coupon_code ? { couponCode: row.coupon_code } : {}),
    paymentMethod: row.payment_method,
    ...(row.payment_status ? { paymentStatus: row.payment_status } : {}),
    ...(row.payment_ref ? { paymentRef: row.payment_ref } : {}),
    address: row.address,
    status: row.status,
    email: row.email,
    ...(row.customer_name ? { customerName: row.customer_name } : {}),
    ...(row.phone ? { phone: row.phone } : {}),
  };
}

/**
 * Orders newest first, each with its line items attached.
 *
 * Pass an email to get only that customer's orders - filtered in SQL, so other
 * people's orders never leave the database. Omit it for the whole shop, which
 * only the admin should ever be given.
 *
 * A customer doesn't see an online order until it is paid: one left unpaid
 * (the payment window closed) is not an order they placed. The admin sees it,
 * marked as payment pending.
 */
export async function listOrders(email?: string): Promise<Order[]> {
  const rows =
    email === undefined
      ? await query<OrderRow[]>("SELECT * FROM orders ORDER BY placed_at DESC")
      : await query<OrderRow[]>("SELECT * FROM orders WHERE email = $1 AND payment_status IS DISTINCT FROM 'pending' ORDER BY placed_at DESC", [
          normalizeEmail(email),
        ]);
  if (rows.length === 0) return [];

  const items = await query<ItemRow[]>("SELECT * FROM order_items WHERE order_id = ANY($1) ORDER BY id", [
    rows.map((r) => r.id),
  ]);

  const byOrder = new Map<string, OrderItem[]>();
  for (const item of items) {
    const list = byOrder.get(item.order_id) ?? [];
    list.push(toItem(item));
    byOrder.set(item.order_id, list);
  }

  return rows.map((row) => toOrder(row, byOrder.get(row.id) ?? []));
}

/** Inserts the order and its line items atomically. */
export async function createOrder(order: Order): Promise<Order> {
  await transaction(async (client) => {
    // Stock first: if a piece has run out, nothing is saved (OutOfStock).
    await takeStock(client, order.items.map((i) => ({ productId: i.productId ?? "", quantity: i.quantity })));
    await client.query(
      `INSERT INTO orders
         (id, email, placed_at, updated_at, total, discount, coupon_code,
          payment_method, address, customer_name, phone, status, payment_status, stock_taken)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true)`,
      [
        order.id,
        normalizeEmail(order.email ?? ""),
        toSqlDate(order.placedAt) ?? toSqlDate(new Date().toISOString()),
        toSqlDate(order.updatedAt),
        order.total,
        order.discount ?? null,
        order.couponCode ?? null,
        order.paymentMethod,
        order.address,
        order.customerName?.trim() || null,
        order.phone?.trim() || null,
        order.status,
        order.paymentStatus ?? null,
      ]
    );

    for (const item of order.items) {
      await client.query(
        `INSERT INTO order_items (order_id, product_id, slug, name, size, quantity, price)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [order.id, item.productId ?? "", item.slug ?? "", item.name, item.size, item.quantity, item.price]
      );
    }
  });

  return order;
}

/** One order with its items, or null. Used to check who owns it before acting. */
export async function getOrder(id: string): Promise<Order | null> {
  const rows = await query<OrderRow[]>("SELECT * FROM orders WHERE id = $1 LIMIT 1", [id]);
  const row = rows[0];
  if (!row) return null;

  const items = await query<ItemRow[]>("SELECT * FROM order_items WHERE order_id = $1 ORDER BY id", [id]);
  return toOrder(row, items.map(toItem));
}

/**
 * Moves an order to a new status, stamping updated_at. Null if no such order,
 * or - when `from` is given - if the order is no longer in that status. A
 * customer's cancel is checked against "Processing" and then written; without
 * the condition, an admin marking it Shipped in between was overwritten.
 */
export async function setOrderStatus(
  id: string,
  status: OrderStatus,
  from?: OrderStatus
): Promise<Order | null> {
  // updated_at doubles as the delivery date while an order is Delivered (the
  // 7-day return window counts from it). Asking for a return, or having one
  // turned down, must not move it - or every rejected return would restart
  // the window.
  const keepsDate =
    (from === "Delivered" && status === "Return Requested") || (from === "Return Requested" && status === "Delivered");
  // The status change and the stock it gives back are saved together.
  const changed = await transaction(async (client) => {
    const result = from && keepsDate
      ? await client.query("UPDATE orders SET status = $1 WHERE id = $2 AND status = $3", [status, id, from])
      : from
      ? await client.query("UPDATE orders SET status = $1, updated_at = $2 WHERE id = $3 AND status = $4", [
          status,
          toSqlDate(new Date().toISOString()),
          id,
          from,
        ])
      : await client.query("UPDATE orders SET status = $1, updated_at = $2 WHERE id = $3", [
          status,
          toSqlDate(new Date().toISOString()),
          id,
        ]);
    if (!result.rowCount) return false;
    if (status === "Cancelled" || status === "Returned") await returnStock(client, id);
    return true;
  });
  const result = { affectedRows: changed ? 1 : 0 };
  if (result.affectedRows === 0) return null;

  const rows = await query<OrderRow[]>("SELECT * FROM orders WHERE id = $1 LIMIT 1", [id]);
  const row = rows[0];
  if (!row) return null;

  const items = await query<ItemRow[]>("SELECT * FROM order_items WHERE order_id = $1 ORDER BY id", [id]);

  return toOrder(row, items.map(toItem));
}

/**
 * Marks an online order paid. Null when it was not pending - already paid (the
 * webhook and the browser both report the same payment), or not online at all -
 * so the caller sends the confirmation email exactly once.
 */
export async function markOrderPaid(id: string, paymentRef: string | null): Promise<Order | null> {
  const result = await mutate(
    `UPDATE orders SET payment_status = 'paid', payment_ref = $2, paid_at = now()
     WHERE id = $1 AND payment_method = 'card' AND payment_status = 'pending' AND status = 'Processing'`,
    [id, paymentRef]
  );
  if (result.affectedRows === 0) return null;
  return getOrder(id);
}

/**
 * A payment that came through after its order was cancelled: recorded as paid
 * and refunded in one go (the caller has already refunded it at the gateway).
 */
export async function markLatePaymentRefunded(id: string, paymentRef: string | null): Promise<boolean> {
  const result = await mutate(
    `UPDATE orders SET payment_status = 'refunded', payment_ref = $2, paid_at = now()
     WHERE id = $1 AND payment_method = 'card' AND payment_status = 'pending' AND status = 'Cancelled'`,
    [id, paymentRef]
  );
  return result.affectedRows > 0;
}

export async function markOrderRefunded(id: string): Promise<void> {
  await mutate(`UPDATE orders SET payment_status = 'refunded' WHERE id = $1 AND payment_status = 'paid'`, [id]);
}

/** Removes an online order that was never paid, giving its stock back. */
export async function deleteUnpaidOrder(id: string): Promise<void> {
  await transaction(async (client) => {
    // Locked while its stock goes back, so a payment can't land in between.
    const found = await client.query(`SELECT id FROM orders WHERE id = $1 AND payment_status = 'pending' FOR UPDATE`, [id]);
    if (!found.rowCount) return;
    await returnStock(client, id);
    await client.query(`DELETE FROM orders WHERE id = $1 AND payment_status = 'pending'`, [id]);
  });
}

/**
 * Online orders left unpaid for over an hour (the shopper closed the tab in
 * the payment window) hold stock nobody is buying; they are removed and the
 * stock goes back. Only for Sutra Pay, which pays on the spot - a Cashfree
 * payment can still arrive much later.
 */
export async function releaseStaleUnpaidOrders(): Promise<void> {
  const stale = await query<{ id: string }[]>(
    `SELECT id FROM orders WHERE payment_status = 'pending' AND placed_at < now() - interval '1 hour' LIMIT 50`
  );
  for (const { id } of stale) await deleteUnpaidOrder(id);
}
