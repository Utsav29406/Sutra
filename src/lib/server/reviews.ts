import "server-only";
import { query, mutate, isUniqueViolation, toSqlDate, fromSqlDate } from "@/lib/db";
import type { Review } from "@/lib/review";
import { randomUUID } from "crypto";
import { products } from "@/lib/products";
import { getOrder } from "@/lib/server/orders";

interface ReviewRow {
  id: string;
  product_id: string;
  order_id: string | null;
  author: string;
  rating: number;
  body: string;
  written_at: Date;
}

function toReview(row: ReviewRow): Review {
  return {
    id: row.id,
    productId: row.product_id,
    ...(row.order_id ? { orderId: row.order_id } : {}),
    author: row.author,
    rating: row.rating,
    body: row.body,
    writtenAt: fromSqlDate(row.written_at),
  };
}

/** All reviews, newest first. */
export async function listReviews(): Promise<Review[]> {
  const rows = await query<ReviewRow[]>("SELECT * FROM reviews ORDER BY written_at DESC");
  return rows.map(toReview);
}

/**
 * Saves a new review from the signed-in customer.
 *
 * Everything that says who and when is decided here, not by the request: the
 * id (a client-chosen id used to upsert, so anyone could overwrite anyone's
 * review by sending its id), the author (the account's name, so no one posts
 * as someone else), the date, and the "from a confirmed order" link, which is
 * kept only when that order is the customer's own, delivered, and has the piece.
 */
export async function createReview(
  review: Partial<Review>,
  session: { name: string; email: string }
): Promise<{ ok: true; review: Review } | { ok: false; error: string }> {
  const productId = typeof review.productId === "string" ? review.productId : "";
  const rating = Math.round(Number(review.rating));
  const body = typeof review.body === "string" ? review.body.trim() : "";
  const author = session.name.trim().slice(0, 120) || "Sutra customer";

  if (!products.some((p) => p.id === productId)) return { ok: false, error: "That review is missing a product." };
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    return { ok: false, error: "Pick a rating between one and five stars." };
  }
  if (body.length > 500) return { ok: false, error: "Keep your review under 500 characters." };

  let orderId: string | undefined;
  let id = `rev-${randomUUID()}`;
  if (review.orderId != null) {
    const order = typeof review.orderId === "string" ? await getOrder(review.orderId) : null;
    if (!order || order.email !== session.email || !order.items.some((i) => i.productId === productId)) {
      return { ok: false, error: "That order can't be reviewed from this account." };
    }
    if (order.status !== "Delivered" && order.status !== "Returned" && order.status !== "Return Requested") {
      return { ok: false, error: "You can rate this once your order has been delivered." };
    }
    orderId = order.id;
    // One rating per piece per order: a second attempt hits the primary key.
    id = `rev-${order.id}-${productId}`.slice(0, 64);
  }

  const stored: Review = {
    id,
    productId,
    ...(orderId ? { orderId } : {}),
    author,
    rating,
    body,
    writtenAt: new Date().toISOString(),
  };

  try {
    await mutate(
      `INSERT INTO reviews (id, product_id, order_id, author, rating, body, written_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [stored.id, stored.productId, orderId ?? null, stored.author, stored.rating, stored.body, toSqlDate(stored.writtenAt)]
    );
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { ok: false, error: "You've already rated this piece from this order." };
    }
    throw error;
  }

  return { ok: true, review: stored };
}
