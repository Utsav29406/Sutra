/**
 * Delivery charges — one definition, used by both checkout and the home page
 * offers strip.
 *
 * These were previously a pair of constants inside the checkout page. The strip
 * now advertises the threshold to every visitor, so the advertised figure and
 * the enforced figure have to be the same value rather than two numbers that
 * agree until someone edits one of them.
 */
// ₹9,999 since 2026-10-21. At ₹2,999 two thirds of the catalogue cleared it on a
// single piece, so delivery was free on nearly every order. Now it is an offer
// for bridal pieces and fuller bags; most single-piece orders pay SHIPPING_FEE.
export const FREE_SHIPPING_THRESHOLD = 9999;
export const SHIPPING_FEE = 149;

/** "₹2,999" — Indian digit grouping, for copy that quotes the threshold. */
export function formatThreshold(): string {
  return `₹${FREE_SHIPPING_THRESHOLD.toLocaleString("en-IN")}`;
}
