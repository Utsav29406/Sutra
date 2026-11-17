import { NextResponse } from "next/server";
import { liveStock } from "@/lib/server/stock";

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
