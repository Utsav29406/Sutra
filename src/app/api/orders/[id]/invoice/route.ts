import { NextResponse } from "next/server";
import { getOrder } from "@/lib/server/orders";
import { getSession } from "@/lib/server/session";
import { renderInvoice } from "@/lib/server/invoice";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Serves the same PDF the customer receives by email.
 *
 * The order page used to offer "Print invoice" as `window.print()`, which
 * printed the confirmation screen — thank-you heading, tracking timeline,
 * browser header and footer — and no invoice at all. Rendering the real
 * document means the printed copy and the emailed copy are the same file,
 * rather than two things that drift apart.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  // An invoice carries the customer's name, phone and home address, so it is
  // for the person who placed the order and the shop - nobody else.
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ ok: false, error: "Please sign in to view this invoice." }, { status: 401 });
  }

  const { id } = await ctx.params;

  try {
    const order = await getOrder(id);
    // Another customer's order answers exactly like a missing one, so order ids
    // cannot be probed for.
    if (!order || (session.role !== "ADMIN" && order.email !== session.email)) {
      return NextResponse.json({ ok: false, error: "No such order." }, { status: 404 });
    }

    const pdf = await renderInvoice(order);

    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        // inline so the browser opens its own PDF viewer, where the customer
        // can read it first and print or save from there.
        "Content-Disposition": `inline; filename="Sutra-Invoice-${order.id}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    // Unlike the email path, nothing is salvageable here — the response IS the
    // invoice — so the failure is reported rather than swallowed.
    console.error("[orders invoice]", error);
    return NextResponse.json(
      { ok: false, error: "Could not produce that invoice." },
      { status: 500 }
    );
  }
}
