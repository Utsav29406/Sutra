/**
 * Offers shown on the home page strip.
 *
 * The three below are the coupons checkout already accepts — see COUPONS in
 * src/lib/pricing.ts. Keep the two lists in step: an offer advertised
 * here that checkout rejects is worse than no offer at all.
 *
 * ---------------------------------------------------------------------------
 * Adding a seasonal offer
 * ---------------------------------------------------------------------------
 * Give it `startsAt` and/or `endsAt` as plain YYYY-MM-DD and the strip sorts
 * itself out: before the start it appears under "Coming soon" with the date,
 * between the two it moves up to the live row with a copyable code, and after
 * `endsAt` it disappears on its own. Nothing has to be deleted by hand.
 *
 *   {
 *     code: "DIWALI26",
 *     headline: "Diwali",
 *     description: "Silks and zari across the collection.",
 *     fine: "20% off, no minimum.",
 *     startsAt: "2026-11-08",
 *     endsAt: "2026-11-15",
 *   }
 *
 * A dated offer must ALSO be added to COUPONS in src/lib/pricing.ts, or the code
 * will not work when its start date arrives. For a no-code festival offer that
 * applies by itself, add it to src/lib/festival.ts instead.
 */
import { formatThreshold } from "@/lib/shipping";

export interface Offer {
  /**
   * The coupon code, exactly as checkout expects it. Omit for a standing policy
   * that needs no code — the card then says so instead of offering a copy
   * button that would put nothing useful on the clipboard.
   */
  code?: string;
  /** The large line — "10% off", "Free delivery", "Diwali". */
  headline: string;
  /** One short sentence. */
  description: string;
  /** Conditions, in small print. */
  fine?: string;
  /** Inclusive YYYY-MM-DD. Omit for an offer that is already running. */
  startsAt?: string;
  /** Inclusive YYYY-MM-DD. Omit for an offer with no end date. */
  endsAt?: string;
}

export const offers: Offer[] = [
  {
    code: "SUTRA10",
    headline: "10% off",
    description: "Ten per cent off your whole order.",
    fine: "Up to ₹2,000 off.",
  },
  {
    code: "FIRSTWEAVE",
    headline: "₹500 off",
    description: "Five hundred rupees off a larger order.",
    fine: "On orders over ₹4,999.",
  },
  /*
   * Not a coupon: the standing threshold, stated plainly. It asks for a larger
   * basket instead of rewarding a smaller one, and quotes the same constant
   * checkout enforces so the two can never disagree.
   */
  {
    headline: "Free delivery",
    description: `Free delivery on every order over ${formatThreshold()}.`,
    fine: `On orders over ${formatThreshold()}. No code needed.`,
  },
];

/** Midnight-to-midnight comparison, so an end date counts its whole day. */
function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function parse(day: string): number {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(y, m - 1, d).getTime();
}

/** An offer with no dates at all — safe to render before hydration. */
export function isAlwaysOn(offer: Offer): boolean {
  return !offer.startsAt && !offer.endsAt;
}

export function isLive(offer: Offer, now: Date): boolean {
  const today = startOfDay(now);
  if (offer.startsAt && today < parse(offer.startsAt)) return false;
  if (offer.endsAt && today > parse(offer.endsAt)) return false;
  return true;
}

export function isUpcoming(offer: Offer, now: Date): boolean {
  return !!offer.startsAt && startOfDay(now) < parse(offer.startsAt);
}

/** "11 Oct" — short, and in the reader's locale-independent order. */
export function formatStart(offer: Offer): string {
  if (!offer.startsAt) return "";
  const [y, m, d] = offer.startsAt.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}
