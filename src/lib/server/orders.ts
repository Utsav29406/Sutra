import "server-only";
import { query, mutate, transaction, toSqlDate, fromSqlDate, normalizeEmail } from "@/lib/db";
import type { Order, OrderItem, OrderStatus } from "@/lib/order";

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
 */
export async function listOrders(email?: string): Promise<Order[]> {
  const rows =
    email === undefined
      ? await query<OrderRow[]>("SELECT * FROM orders ORDER BY placed_at DESC")
      : await query<OrderRow[]>("SELECT * FROM orders WHERE email = $1 ORDER BY placed_at DESC", [
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
    await client.query(
      `INSERT INTO orders
         (id, email, placed_at, updated_at, total, discount, coupon_code,
          payment_method, address, customer_name, phone, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
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
  const result = from
    ? await mutate("UPDATE orders SET status = $1, updated_at = $2 WHERE id = $3 AND status = $4", [
        status,
        toSqlDate(new Date().toISOString()),
        id,
        from,
      ])
    : await mutate("UPDATE orders SET status = $1, updated_at = $2 WHERE id = $3", [
        status,
        toSqlDate(new Date().toISOString()),
        id,
      ]);
  if (result.affectedRows === 0) return null;

  const rows = await query<OrderRow[]>("SELECT * FROM orders WHERE id = $1 LIMIT 1", [id]);
  const row = rows[0];
  if (!row) return null;

  const items = await query<ItemRow[]>("SELECT * FROM order_items WHERE order_id = $1 ORDER BY id", [id]);

  return toOrder(row, items.map(toItem));
}
