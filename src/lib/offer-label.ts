import { tierFromCode } from "@/lib/circle";

/*
 * How an order's stored offer reads on the account page, the order page, the
 * admin list, emails and invoices. Orders placed during the old festival
 * offers keep their festival's name.
 */
const PAST_OFFERS: Record<string, string> = {
  NAVRATRI: "Navratri",
  DIWALI: "Diwali",
};

export function offerLabel(code: string): string {
  const festival = PAST_OFFERS[code.trim().toUpperCase()];
  if (festival) return `${festival} offer`;
  const tier = tierFromCode(code);
  return tier ? `Sutra Gold · ${tier.name}` : `Coupon ${code}`;
}
