import { NextRequest, NextResponse } from "next/server";
import { adjustStock, liveStock } from "@/lib/server/stock";
import { getSession } from "@/lib/server/session";
import { rejectNonJson } from "@/lib/server/json-only";
import { products } from "@/lib/products";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** How many of each piece are left, for "Sold out" and the quantity limits. */
export async function GET() {
  try {
    return NextResponse.json({ ok: true, stock: await liveStock() }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("[stock]", error);
    return NextResponse.json({ ok: false, error: "Could not read stock." }, { status: 503 });
  }
}

/** Admin only: add stock (restock) or remove it (damaged, sold elsewhere). */
export async function PATCH(req: NextRequest) {
  const notJson = rejectNonJson(req);
  if (notJson) return notJson;
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: "Please sign in first." }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ ok: false, error: "Only the shop can change stock." }, { status: 403 });

  const body = await req.json().catch(() => null);
  const productId = typeof body?.productId === "string" ? body.productId : "";
  const change = Number(body?.change);
  if (!products.some((p) => p.id === productId)) {
    return NextResponse.json({ ok: false, error: "No such piece." }, { status: 404 });
  }
  if (!Number.isInteger(change) || change === 0 || Math.abs(change) > 1000) {
    return NextResponse.json({ ok: false, error: "Enter a whole number from 1 to 1000." }, { status: 400 });
  }
  try {
    const result = await adjustStock(productId, change);
    return NextResponse.json(result, { status: result.ok ? 200 : 409 });
  } catch (error) {
    console.error("[stock PATCH]", error);
    return NextResponse.json({ ok: false, error: "Could not change stock. Please try again." }, { status: 500 });
  }
}
