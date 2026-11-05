import { NextRequest, NextResponse } from "next/server";
import { webhookIsGenuine } from "@/lib/server/cashfree";
import { settlePayment } from "@/lib/server/payments";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Cashfree's server-to-server notice (order_meta.notify_url). It covers the
 * shopper who pays and closes the tab before the browser can report back. The
 * body only says which order to look at: the status comes from Cashfree's API.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!webhookIsGenuine(raw, req.headers.get("x-webhook-timestamp"), req.headers.get("x-webhook-signature"))) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  let id: unknown;
  try {
    id = JSON.parse(raw)?.data?.order?.order_id;
  } catch {
    // fall through
  }
  if (typeof id !== "string" || !id) return NextResponse.json({ ok: true });

  try {
    await settlePayment(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    // A 5xx makes Cashfree try again later.
    console.error("[payments webhook]", error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
