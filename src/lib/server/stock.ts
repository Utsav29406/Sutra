import "server-only";
import type { PoolClient } from "pg";
import { query, transaction } from "@/lib/db";
import { products } from "@/lib/products";

/**
 * Live stock, kept in product_stock (see sql/schema.sql). Every change runs
 * inside the caller's transaction, so an order and the stock it took are saved
 * together or not at all.
 */

/** Thrown when an order asks for more of a piece than is left. */
export class OutOfStock extends Error {
  constructor(
    readonly productName: string,
    readonly left: number
  ) {
    super(`${productName}: only ${left} left`);
  }
}

const catalogue = new Map(products.map((p) => [p.id, p]));

/** Gives pieces their catalogue figure the first time they're seen. */
async function ensureRows(client: PoolClient, ids: string[]): Promise<void> {
  const known = ids.filter((id) => catalogue.has(id));
  if (!known.length) return;
  await client.query(
    `INSERT INTO product_stock (product_id, stock)
     SELECT * FROM unnest($1::text[], $2::int[])
     ON CONFLICT (product_id) DO NOTHING`,
    [known, known.map((id) => Math.max(0, catalogue.get(id)!.stock))]
  );
}

/**
 * Takes stock for an order's items, or throws OutOfStock and takes nothing
 * (the caller's transaction rolls back). Each piece is one conditional UPDATE
 * - "only if at least this many are left" - so when two shoppers want the last
 * one, the database lets exactly one through. Pieces are taken in id order so
 * two orders never wait on each other's rows.
 */
export async function takeStock(client: PoolClient, items: { productId: string; quantity: number }[]): Promise<void> {
  const wanted = new Map<string, number>();
  for (const i of items) wanted.set(i.productId, (wanted.get(i.productId) ?? 0) + i.quantity);
  const ids = [...wanted.keys()].sort();
  await ensureRows(client, ids);
  for (const id of ids) {
    const qty = wanted.get(id)!;
    const taken = await client.query(
      `UPDATE product_stock SET stock = stock - $2, updated_at = now()
        WHERE product_id = $1 AND stock >= $2`,
      [id, qty]
    );
    if (taken.rowCount === 0) {
      const left = await client.query<{ stock: number }>("SELECT stock FROM product_stock WHERE product_id = $1", [id]);
      throw new OutOfStock(catalogue.get(id)?.name ?? "A piece in your bag", Number(left.rows[0]?.stock ?? 0));
    }
  }
}

/**
 * Puts an order's stock back, once: only if the order still holds it, and the
 * flag is cleared in the same statement, so a second call (or an order placed
 * before stock was tracked) gives nothing back.
 */
export async function returnStock(client: PoolClient, orderId: string): Promise<void> {
  const held = await client.query("UPDATE orders SET stock_taken = false WHERE id = $1 AND stock_taken RETURNING id", [orderId]);
  if (held.rowCount === 0) return;
  await client.query(
    `UPDATE product_stock s SET stock = s.stock + q.qty, updated_at = now()
       FROM (SELECT product_id, SUM(quantity)::int AS qty FROM order_items WHERE order_id = $1 GROUP BY product_id) q
      WHERE s.product_id = q.product_id`,
    [orderId]
  );
}

/**
 * The admin's restock (+) or write-off (-). Relative to what is there now, in
 * one statement, so an order placed at the same moment is never overwritten
 * the way "set stock to 12" would. Refuses to go below zero.
 */
export async function adjustStock(
  productId: string,
  change: number
): Promise<{ ok: true; stock: number } | { ok: false; error: string; stock?: number }> {
  return transaction(async (client) => {
    await ensureRows(client, [productId]);
    const updated = await client.query<{ stock: number }>(
      `UPDATE product_stock SET stock = stock + $2, updated_at = now()
        WHERE product_id = $1 AND stock + $2 >= 0 RETURNING stock`,
      [productId, change]
    );
    if (updated.rowCount) return { ok: true as const, stock: Number(updated.rows[0].stock) };
    const left = await client.query<{ stock: number }>("SELECT stock FROM product_stock WHERE product_id = $1", [productId]);
    const stock = Number(left.rows[0]?.stock ?? 0);
    return { ok: false as const, error: `Only ${stock} in stock, so ${-change} can't be removed.`, stock };
  });
}

/** What's left of every piece: the table's figure, or the catalogue's for a piece not yet tracked. */
export async function liveStock(): Promise<Record<string, number>> {
  const rows = await query<{ product_id: string; stock: number }[]>("SELECT product_id, stock FROM product_stock");
  const out: Record<string, number> = Object.fromEntries(products.map((p) => [p.id, Math.max(0, p.stock)]));
  for (const r of rows) if (r.product_id in out) out[r.product_id] = Number(r.stock);
  return out;
}
