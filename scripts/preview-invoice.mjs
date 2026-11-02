/**
 * Renders a sample invoice so the layout can be checked without placing a real
 * order.
 *
 *   node --conditions=react-server scripts/preview-invoice.mjs [out.pdf]
 *
 * The `react-server` condition is needed because invoice.ts imports
 * "server-only", which throws under any other resolution condition. Node strips
 * the TypeScript itself; the only type import in that module is erased.
 */
import { writeFileSync } from "node:fs";

const { renderInvoice } = await import("../src/lib/server/invoice.ts");

const order = {
  id: "SUT-EMAILTEST",
  placedAt: new Date().toISOString(),
  items: [
    { productId: "p9", slug: "gota-patti-bridal-lehenga", name: "Gota Patti Bridal Lehenga", size: "XL", quantity: 3, price: 24999 },
    { productId: "p4", slug: "bandhani-odhani-dupatta", name: "Bandhani Odhani Dupatta", size: "Free", quantity: 1, price: 1850 },
  ],
  total: 76847,
  paymentMethod: "card",
  address: "77 Ashram Road, Navrangpura, Ahmedabad, Gujarat 380009",
  status: "Delivered",
  email: "customer@example.com",
  customerName: "Utsav Mewada",
  phone: "9812345670",
};

const pdf = await renderInvoice(order);
const out = process.argv[2] ?? "invoice-preview.pdf";
writeFileSync(out, pdf);
console.log(`wrote ${out} (${(pdf.length / 1024).toFixed(1)} KB)`);
