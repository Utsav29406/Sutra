import "server-only";
import type { Order } from "@/lib/order";
import { products } from "@/lib/products";
import { quote } from "@/lib/pricing";

/*
 * A checkout that loaded just before an offer ended may arrive just after.
 * Its total is honoured for this long; anything later is asked to review.
 */
const OFFER_GRACE_MS = 15 * 60 * 1000;

/** Most of one piece a single order can take, whatever the stock says. */
const MAX_PER_LINE = 10;

/**
 * Rewrites each line from the catalogue: its name and slug come from the
 * product, not the request, and its size and quantity must be ones the piece
 * is actually offered in. A request used to be able to name an item anything
 * (that text went into the customer's email and invoice), pick a size the
 * piece doesn't come in, or ask for 50 of a piece with 3 in stock.
 */
export function checkItems(order: Order): string | null {
  if (order.items.length > 30) return "That's more pieces than one order can hold.";
  for (const item of order.items) {
    const product = products.find((p) => p.id === item?.productId);
    if (!product) return "Something in your bag is no longer in the collection. Please remove it.";
    if (typeof item.size !== "string" || !product.sizes.includes(item.size)) {
      return `Choose a size for ${product.name} again: that one isn't available.`;
    }
    const most = Math.min(product.stock, MAX_PER_LINE);
    if (!Number.isInteger(item.quantity) || item.quantity < 1) return "An item quantity is not valid.";
    if (item.quantity > most) {
      return most < 1
        ? `${product.name} is sold out. Please remove it from your bag.`
        : `Only ${most} of ${product.name} can be ordered at once.`;
    }
    item.name = product.name;
    item.slug = product.slug;
  }
  return null;
}

/**
 * Prices the order again from the catalogue, with the same quote() checkout
 * uses, and returns the figures to store - or why it can't be placed. The
 * browser's own total was stored as sent until now, so an edited request could
 * claim any price or discount.
 */
export function checkTotals(
  order: Order,
  now: number = Date.now()
): { discount: number; total: number; couponCode: string | null } | string {
  const lines = [];
  for (const item of order.items) {
    const product = products.find((p) => p.id === item.productId);
    if (!product) return `${item.name} is no longer in the collection. Please remove it from your bag.`;
    // Prices change rarely, but a bag kept from before a change must not be
    // charged the old price without the customer seeing the new one.
    if (product.price !== item.price) {
      return "Some prices in your bag have changed. Please review your bag and try again.";
    }
    lines.push({ price: product.price, quantity: item.quantity });
  }

  const asked = order.couponCode ?? null;
  for (const at of [now, now - OFFER_GRACE_MS]) {
    // During a festival quote() applies its offer whatever code is sent.
    const priced = quote(lines, asked, at);
    if (Math.abs(priced.total - order.total) <= 1 && Math.abs(priced.discount - (order.discount ?? 0)) <= 1) {
      const couponCode = priced.discount > 0 ? priced.offerCode : null;
      return { discount: priced.discount, total: priced.total, couponCode };
    }
  }
  return "Your total has changed (an offer may have just ended). Please review your order and place it again.";
}
