/*
 * Sutra Gold: free membership with three levels. Joining is free; the level
 * follows what the member spent on delivered orders over the last 12 months.
 * Shared by the browser (to show prices) and the server (lib/server/circle.ts
 * reads the level from the database; lib/pricing.ts applies it).
 */

export type TierId = "thread" | "weave" | "loom";

export interface Tier {
  id: TierId;
  name: string;
  /** Delivered spend over 12 months needed to reach this level. */
  minSpend: number;
  /** Member price: this much off every piece. 0 = none. */
  percentOff: number;
  /** Free delivery from this subtotal. 0 = every order. */
  freeDeliveryFrom: number;
  /** A festival's prices open this many days early. */
  earlyDays: number;
  perks: string[];
}

export const TIERS: Tier[] = [
  {
    id: "thread",
    name: "Thread",
    minSpend: 0,
    percentOff: 0,
    freeDeliveryFrom: 2999,
    earlyDays: 1,
    perks: ["Free delivery from ₹2,999", "Festival prices 1 day early", "All discount codes still work"],
  },
  {
    id: "weave",
    name: "Weave",
    minSpend: 10000,
    percentOff: 5,
    freeDeliveryFrom: 0,
    earlyDays: 2,
    perks: ["5% member price on every piece", "Free delivery on every order", "Festival prices 2 days early"],
  },
  {
    id: "loom",
    name: "Loom",
    minSpend: 25000,
    percentOff: 10,
    freeDeliveryFrom: 0,
    earlyDays: 3,
    perks: ["10% member price on every piece", "Free delivery on every order", "Festival prices 3 days early"],
  },
];

/** What the browser is told about the signed-in member. */
export interface CircleStatus {
  tier: TierId;
  /** Delivered spend over the last 12 months, in rupees. */
  spend: number;
  joinedAt: string;
}

export function findTier(id: string | null | undefined): Tier | null {
  return TIERS.find((t) => t.id === id) ?? null;
}

/** The level a member's 12-month delivered spend earns. */
export function tierFor(spend: number): Tier {
  return [...TIERS].reverse().find((t) => spend >= t.minSpend) ?? TIERS[0];
}

export function nextTier(tier: Tier): Tier | null {
  return TIERS[TIERS.indexOf(tier) + 1] ?? null;
}

/** What a piece costs at a member price. */
export function memberPrice(price: number, tier: Tier): number {
  return price - Math.round((price * tier.percentOff) / 100);
}

/** Stored as an order's offer when the member price was used, e.g. "CIRCLE-WEAVE". */
export function circleCode(tier: Tier): string {
  return `CIRCLE-${tier.id.toUpperCase()}`;
}

export function tierFromCode(code: string | null | undefined): Tier | null {
  const match = /^CIRCLE-([A-Z]+)$/.exec(code ?? "");
  return match ? findTier(match[1].toLowerCase()) : null;
}
