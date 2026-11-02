import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/shipping";
import { activeFestival, festivalPrice, type Festival } from "@/lib/festival";

/**
 * What an order costs: one calculation, run by checkout to show the total and
 * by the server to check it. Until now only the browser worked the total out,
 * and the server stored whatever it was sent, so an edited request could set
 * any discount it liked.
 */

export interface Coupon {
  code: string;
  description: string;
  percentOff?: number;
  maxDiscount?: number;
  amountOff?: number;
  minSpend?: number;
  freeShipping?: boolean;
}

/*
 * There is no free-delivery code. Free delivery applies by itself over
 * FREE_SHIPPING_THRESHOLD, which the home page, the bag and checkout all
 * advertise ("add ₹X more for free delivery"): it asks for a bigger basket
 * rather than rewarding a smaller one.
 *
 * Keep in step with the offers strip (src/lib/offers.ts).
 */
export const COUPONS: Coupon[] = [
  { code: "SUTRA10", description: "10% off your order", percentOff: 10, maxDiscount: 2000 },
  { code: "FIRSTWEAVE", description: "₹500 off orders over ₹4,999", amountOff: 500, minSpend: 4999 },
];

export interface Line {
  price: number;
  quantity: number;
}

export type Quote = {
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  /** The festival running now, if any. Coupons are not taken while it is. */
  festival: Festival | null;
  /** What to store as the order's offer: a festival id or a coupon code. */
  offerCode: string | null;
  /** Set when a coupon was asked for and can't be used. */
  couponError: string | null;
};

export function findCoupon(code: string): Coupon | null {
  const normalized = code.trim().toUpperCase();
  return COUPONS.find((c) => c.code === normalized) ?? null;
}

export function quote(lines: Line[], couponCode: string | null, now: number = Date.now()): Quote {
  const subtotal = lines.reduce((sum, l) => sum + l.price * l.quantity, 0);
  const festival = activeFestival(now);

  let discount = 0;
  let freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  let offerCode: string | null = null;
  let couponError: string | null = null;

  if (festival) {
    // Worked out piece by piece, so the total matches the festival price shown
    // on every product card to the rupee.
    discount = lines.reduce((sum, l) => sum + (l.price - festivalPrice(l.price, festival)) * l.quantity, 0);
    freeShipping ||= festival.freeShipping;
    offerCode = festival.id;
    if (couponCode) couponError = `Codes can't be added to the ${festival.name} offer, which is already applied.`;
  } else if (couponCode) {
    const coupon = findCoupon(couponCode);
    if (!coupon) couponError = "That code isn't one of ours.";
    else if (coupon.minSpend && subtotal < coupon.minSpend) {
      couponError = `Spend ₹${coupon.minSpend.toLocaleString("en-IN")} to use ${coupon.code}.`;
    } else {
      if (coupon.percentOff) {
        discount = Math.round((subtotal * coupon.percentOff) / 100);
        if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
      } else if (coupon.amountOff) {
        discount = coupon.amountOff;
      }
      /*
       * Free delivery qualifies on the subtotal, not on what is left after a
       * coupon. Testing the discounted figure meant a ₹3,200 basket with
       * SUTRA10 fell to ₹2,880, lost its free delivery, and handed ₹149 of the
       * discount straight back — which reads as the discount not working.
       */
      freeShipping ||= !!coupon.freeShipping;
      offerCode = coupon.code;
    }
  }

  discount = Math.min(discount, subtotal);
  const shipping = subtotal === 0 || freeShipping ? 0 : SHIPPING_FEE;
  return { subtotal, discount, shipping, total: subtotal - discount + shipping, festival, offerCode, couponError };
}
