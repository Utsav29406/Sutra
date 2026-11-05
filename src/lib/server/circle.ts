import "server-only";
import { mutate, query, fromSqlDate, normalizeEmail } from "@/lib/db";
import { tierFor, type CircleStatus } from "@/lib/circle";

/**
 * A member's Sutra Gold status, worked out from the database: whether they
 * joined, and what they spent on delivered orders placed in the last 12
 * months. Null for anyone who hasn't joined. Cancelled and returned orders
 * never count, and nothing the browser sends can change the answer.
 */
export async function getCircle(email: string): Promise<CircleStatus | null> {
  const [row] = await query<{ joined_at: Date | null; spend: number }[]>(
    `SELECT u.circle_joined_at AS joined_at,
            COALESCE((SELECT SUM(o.total) FROM orders o
                       WHERE o.email = u.email AND o.status = 'Delivered'
                         AND o.placed_at > now() - interval '365 days'), 0)::float8 AS spend
       FROM users u WHERE u.email = $1 LIMIT 1`,
    [normalizeEmail(email)]
  );
  if (!row?.joined_at) return null;
  const spend = Math.round(Number(row.spend) || 0);
  return { tier: tierFor(spend).id, spend, joinedAt: fromSqlDate(row.joined_at) };
}

/** Joins the account to Sutra Gold. Joining twice keeps the first date. */
export async function joinCircle(email: string): Promise<CircleStatus | null> {
  await mutate("UPDATE users SET circle_joined_at = COALESCE(circle_joined_at, now()) WHERE email = $1", [
    normalizeEmail(email),
  ]);
  return getCircle(email);
}
