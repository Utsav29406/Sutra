import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { SITE_URL } from "@/lib/site";

/*
 * Cashfree Payment Gateway, server side. Online payment is on only when both
 * keys are set in the environment (Vercel: CASHFREE_APP_ID, CASHFREE_SECRET_KEY);
 * without them checkout offers Cash on Delivery alone.
 *
 * CASHFREE_ENV picks the account: "sandbox" (test mode, no real money, the
 * default) or "production". The secret never leaves the server.
 *
 * Without the keys, "Pay online" runs on Sutra Pay instead, the shop's own
 * dummy gateway: the same flow end to end, with no money and no account.
 */

const API_VERSION = "2023-08-01";

export type CashfreeMode = "sandbox" | "production";

export function cashfreeMode(): CashfreeMode {
  return process.env.CASHFREE_ENV?.trim() === "production" ? "production" : "sandbox";
}

export function cashfreeEnabled(): boolean {
  return !!process.env.CASHFREE_APP_ID?.trim() && !!process.env.CASHFREE_SECRET_KEY?.trim();
}

function baseUrl(): string {
  // CASHFREE_BASE_URL only points tests at a stand-in server.
  const override = process.env.CASHFREE_BASE_URL?.trim();
  if (override) return override.replace(/\/+$/, "");
  return cashfreeMode() === "production" ? "https://api.cashfree.com/pg" : "https://sandbox.cashfree.com/pg";
}

async function call<T>(method: "GET" | "POST", path: string, body?: unknown): Promise<T> {
  const res = await fetch(baseUrl() + path, {
    method,
    headers: {
      "content-type": "application/json",
      "x-api-version": API_VERSION,
      "x-client-id": process.env.CASHFREE_APP_ID!.trim(),
      "x-client-secret": process.env.CASHFREE_SECRET_KEY!.trim(),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
    signal: AbortSignal.timeout(15_000),
  });
  const data = (await res.json().catch(() => null)) as (T & { message?: string }) | null;
  if (!res.ok || !data) {
    throw new Error(`Cashfree ${method} ${path} failed (${res.status}): ${data?.message ?? "no body"}`);
  }
  return data;
}

export interface CashfreeOrder {
  order_id: string;
  order_amount: number;
  order_currency: string;
  order_status: "ACTIVE" | "PAID" | "EXPIRED" | "TERMINATED" | "TERMINATION_REQUESTED";
  payment_session_id?: string;
  cf_order_id?: string | number;
}

/** Ten digits, as Cashfree wants them; Indian numbers lose their +91. */
function tenDigits(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return digits.slice(-10);
}

/** Opens a Cashfree order for one of ours, with the same id. */
export function createCashfreeOrder(order: {
  id: string;
  total: number;
  email: string;
  phone?: string;
  customerName?: string;
}): Promise<CashfreeOrder> {
  const name = order.customerName?.trim();
  return call<CashfreeOrder>("POST", "/orders", {
    order_id: order.id,
    order_amount: Number(order.total.toFixed(2)),
    order_currency: "INR",
    customer_details: {
      // Stable per customer, and not the email itself.
      customer_id: "c" + createHash("sha256").update(order.email).digest("hex").slice(0, 24),
      customer_email: order.email,
      customer_phone: tenDigits(order.phone ?? ""),
      ...(name && name.length >= 3 ? { customer_name: name.slice(0, 100) } : {}),
    },
    order_meta: {
      // Used when the payment window can't open as a popup (in-app browsers).
      return_url: `${SITE_URL}/order/${encodeURIComponent(order.id)}?payment=check`,
      notify_url: `${SITE_URL}/api/payments/webhook`,
    },
    order_note: `Sutra order ${order.id}`,
  });
}

export function getCashfreeOrder(id: string): Promise<CashfreeOrder> {
  return call<CashfreeOrder>("GET", `/orders/${encodeURIComponent(id)}`);
}

/** Refunds a paid order in full, to wherever the money came from. */
export function refundCashfreeOrder(id: string, amount: number) {
  return call<{ refund_status: string; cf_refund_id?: string | number }>(
    "POST",
    `/orders/${encodeURIComponent(id)}/refunds`,
    {
      refund_amount: Number(amount.toFixed(2)),
      // One full refund per order, so a retry can never refund twice.
      refund_id: `R-${id}`.slice(0, 40),
      refund_note: "Order cancelled",
    }
  );
}

/** Cashfree signs timestamp + raw body with the secret key (HMAC-SHA256, base64). */
export function webhookIsGenuine(rawBody: string, timestamp: string | null, signature: string | null): boolean {
  if (!timestamp || !signature || !cashfreeEnabled()) return false;
  const expected = createHmac("sha256", process.env.CASHFREE_SECRET_KEY!.trim())
    .update(timestamp + rawBody)
    .digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * Which gateway "Pay online" uses: Cashfree when its keys are set, else Sutra
 * Pay, the shop's own dummy gateway (lib/sutrapay, api/payments/sutrapay).
 */
export type PaymentProvider = "cashfree" | "sutrapay";
export function paymentProvider(): PaymentProvider {
  return cashfreeEnabled() ? "cashfree" : "sutrapay";
}
