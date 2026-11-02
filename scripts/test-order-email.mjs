/**
 * Sends a real order-confirmation email (with the PDF invoice attached) so the
 * whole path can be checked without placing an order.
 *
 *   node --conditions=react-server --env-file=.env.local \
 *        scripts/test-order-email.mjs you@example.com
 *
 * The react-server condition is needed because these modules import
 * "server-only", which throws under any other resolution condition.
 */
import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";
import { resolve as resolvePath } from "node:path";
import { existsSync } from "node:fs";

// The app's modules import each other through the "@/" alias from tsconfig,
// which Node knows nothing about. Map it to src/ and add the .ts extension.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (!specifier.startsWith("@/")) return nextResolve(specifier, context);
    const base = resolvePath(process.cwd(), "src", specifier.slice(2));
    const file = existsSync(base) ? base : `${base}.ts`;
    return nextResolve(pathToFileURL(file).href, context);
  },
});

const to = process.argv[2];
if (!to) {
  console.error("usage: node scripts/test-order-email.mjs <recipient@example.com>");
  process.exit(1);
}

const { sendOrderConfirmation, sendOrderStatusUpdate } = await import("../src/lib/server/email.ts");

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
  status: "Processing",
  email: to,
  customerName: "Utsav Mewada",
  phone: "9812345670",
};

console.log(`from : ${process.env.OTP_EMAIL_FROM}`);
console.log(`to   : ${to}`);
console.log(`items: ${order.items.map((i) => `${i.name} x${i.quantity}`).join(", ")}\n`);

const confirmation = await sendOrderConfirmation(order);
console.log("confirmation (no PDF) :", JSON.stringify(confirmation));

const shipped = await sendOrderStatusUpdate({ ...order, status: "Shipped" });
console.log("shipped      (no PDF) :", JSON.stringify(shipped));

const delivered = await sendOrderStatusUpdate({ ...order, status: "Delivered" });
console.log("delivered    (+ PDF)  :", JSON.stringify(delivered));
