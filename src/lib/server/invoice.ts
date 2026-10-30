import "server-only";
import PDFDocument from "pdfkit";
import type { Order } from "@/lib/order";
import { offerLabel } from "@/lib/festival";

/**
 * Amounts are written as "Rs." rather than the rupee sign. PDFKit's built-in
 * fonts use WinAnsi encoding, which has no glyph for U+20B9, so a bare Rs.
 * symbol would render as a blank box. Swapping to a font that carries the
 * glyph means vendoring a TTF and adding it to outputFileTracingIncludes so
 * Vercel bundles it. Worth doing if the symbol is wanted; "Rs." is standard on
 * Indian invoices meanwhile.
 */
function money(value: number): string {
  return `Rs. ${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// The brand palette, as used on the site.
const MAROON = "#7f1d1d";
const GOLD = "#b8860b";
const INK = "#1a1416";
const MUTED = "#6b625f";

/** Renders a one-page A4 invoice for an order and resolves to the PDF bytes. */
export function renderInvoice(order: Order): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 48 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const left = doc.page.margins.left;
    const right = doc.page.width - doc.page.margins.right;
    const width = right - left;

    // Masthead: the knot and wordmark from components/Logo.tsx, centred as one
    // group. The knot's visible extent in its 100-unit viewBox is x 9.5-90.5,
    // y 22.5-77.5, so it is placed by that box rather than the full viewBox.
    const MARK_SCALE = 0.46;
    const markW = 81 * MARK_SCALE;
    const markH = 55 * MARK_SCALE;
    const markGap = 9;
    doc.font("Helvetica-Bold").fontSize(26);
    const wordW = doc.widthOfString("sutRa");
    const groupX = left + (width - (markW + markGap + wordW)) / 2;
    const mastY = 44;

    doc.save();
    doc.translate(groupX - 9.5 * MARK_SCALE, mastY - 22.5 * MARK_SCALE).scale(MARK_SCALE);
    doc.lineWidth(10).strokeColor(MAROON);
    doc.path("M53.83 34.32 A23 23 0 1 1 45.62 28.67").stroke();
    doc.path("M46.17 65.68 A23 23 0 1 1 54.38 71.33").stroke();
    doc.restore();

    doc.fillColor(MAROON).text("sutRa", groupX + markW + markGap, mastY + (markH - 19) / 2, { lineBreak: false });
    doc
      .font("Helvetica")
      .fontSize(7.5)
      .fillColor(MUTED)
      .text("INDIAN TRADITIONAL WEAR", left, mastY + markH + 8, { width, align: "center", characterSpacing: 2 });

    // Gold rule, then the document title centred beneath it
    let y = mastY + markH + 30;
    doc.moveTo(left, y).lineTo(right, y).lineWidth(1).strokeColor(GOLD).stroke();
    y += 16;
    doc
      .font("Helvetica-Bold")
      .fontSize(17)
      .fillColor(INK)
      .text("INVOICE", left, y, { width, align: "center", characterSpacing: 5 });
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor(MUTED)
      .text(`No. ${order.id}`, left, doc.y + 3, { width, align: "center" });
    y = doc.y + 14;
    doc.moveTo(left, y).lineTo(right, y).lineWidth(0.5).strokeColor("#e6ded4").stroke();
    y += 22;

    // Billing details, two columns
    const colWidth = width / 2 - 10;
    doc.font("Helvetica-Bold").fontSize(8).fillColor(MUTED).text("BILLED TO", left, y);
    doc.font("Helvetica-Bold").fontSize(8).fillColor(MUTED).text("ORDER DETAILS", left + colWidth + 20, y);
    y += 14;

    const billed = [
      order.customerName ?? "Customer",
      order.email,
      ...(order.phone ? [order.phone] : []),
      order.address,
    ];
    doc.font("Helvetica").fontSize(9.5).fillColor(INK).text(billed.join("\n"), left, y, {
      width: colWidth,
      lineGap: 2,
    });
    const billedBottom = doc.y;

    const details = [
      `Date: ${formatDate(order.placedAt)}`,
      `Payment: ${order.paymentMethod === "cod" ? "Cash on Delivery" : "Card / UPI"}`,
      `Status: ${order.status}`,
      ...(order.couponCode ? [offerLabel(order.couponCode).replace(/^Coupon /, "Coupon: ")] : []),
    ];
    doc.font("Helvetica").fontSize(9.5).fillColor(INK).text(details.join("\n"), left + colWidth + 20, y, {
      width: colWidth,
      lineGap: 2,
    });

    // Start below whichever column ran longer. Using doc.y alone measured only
    // the order-details column, so a long address ran into the item table.
    y = Math.max(billedBottom, doc.y) + 40;

    // Line-item table. Columns are laid out from the right so the money
    // columns stay aligned regardless of how long an item name runs.
    const amountX = right - 80;
    const priceX = amountX - 80;
    const qtyX = priceX - 46;
    const itemWidth = qtyX - left - 12;

    doc.rect(left, y - 6, width, 22).fillColor("#f6f1ea").fill();
    doc.font("Helvetica-Bold").fontSize(8).fillColor(MUTED);
    doc.text("ITEM", left + 8, y);
    doc.text("QTY", qtyX, y, { width: 40, align: "right" });
    doc.text("PRICE", priceX, y, { width: 72, align: "right" });
    doc.text("AMOUNT", amountX, y, { width: 72, align: "right" });
    y += 24;

    doc.font("Helvetica").fontSize(9.5).fillColor(INK);
    for (const item of order.items) {
      const label = item.size ? `${item.name}\nSize ${item.size}` : item.name;
      const height = doc.heightOfString(label, { width: itemWidth, lineGap: 1 });

      doc.fillColor(INK).text(label, left + 8, y, { width: itemWidth, lineGap: 1 });
      doc.text(String(item.quantity), qtyX, y, { width: 40, align: "right" });
      doc.text(money(item.price), priceX, y, { width: 72, align: "right" });
      doc.text(money(item.price * item.quantity), amountX, y, { width: 72, align: "right" });

      y += Math.max(height, 12) + 10;
      doc.moveTo(left, y - 5).lineTo(right, y - 5).lineWidth(0.5).strokeColor("#e6ded4").stroke();
    }

    // Totals
    y += 10;
    const subtotal = order.items.reduce((sum, i) => sum + i.price * i.quantity, 0);
    const rows: Array<[string, string, boolean]> = [["Subtotal", money(subtotal), false]];
    if (order.discount) {
      rows.push([`Discount${order.couponCode ? ` (${offerLabel(order.couponCode)})` : ""}`, `-${money(order.discount)}`, false]);
    }
    const shipping = order.total - (subtotal - (order.discount ?? 0));
    if (shipping > 0) rows.push(["Shipping", money(shipping), false]);
    else rows.push(["Shipping", "Free", false]);
    rows.push(["Total", money(order.total), true]);

    for (const [label, value, bold] of rows) {
      doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(bold ? 12 : 9.5);
      doc.fillColor(bold ? MAROON : MUTED).text(label, priceX - 60, y, { width: 132, align: "right" });
      doc.fillColor(bold ? MAROON : INK).text(value, amountX, y, { width: 72, align: "right" });
      y += bold ? 20 : 16;
      if (!bold && rows[rows.length - 1][0] === "Total" && label === "Shipping") {
        doc.moveTo(priceX - 60, y - 4).lineTo(right, y - 4).lineWidth(0.5).strokeColor("#e6ded4").stroke();
        y += 4;
      }
    }

    // Footer
    const footerY = doc.page.height - doc.page.margins.bottom - 40;
    doc.moveTo(left, footerY).lineTo(right, footerY).lineWidth(0.5).strokeColor("#e6ded4").stroke();
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor(MUTED)
      .text(
        "Thank you for shopping with Sutra. Questions about this order? Reply to this email and we will help.",
        left,
        footerY + 10,
        { width, align: "center" }
      );

    doc.end();
  });
}
