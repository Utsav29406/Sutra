export function formatPrice(value: number): string {
  return `₹${value.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function discountPercent(price: number, compareAtPrice: number | null | undefined): number | null {
  if (!compareAtPrice || compareAtPrice <= price) return null;
  return Math.round(((compareAtPrice - price) / compareAtPrice) * 100);
}

/**
 * Where to go after signing in: the page's own `?next=` when it is a path on
 * this site, else the fallback. A full URL there (`?next=https://…`) would
 * otherwise send a customer who just signed in to someone else's site.
 */
export function nextPath(search: string, fallback = "/account"): string {
  const next = new URLSearchParams(search).get("next");
  if (!next || !next.startsWith("/")) return fallback;
  // "/\\evil.com" or "/<tab>/evil.com" pass a "starts with one slash" test, but
  // URL parsing turns the backslash into a slash and drops the tab, which
  // leaves "//evil.com". Resolve it the way the browser will and keep it only
  // if it is still on this site.
  try {
    const base = "https://sutra.invalid";
    const url = new URL(next, base);
    return url.origin === base ? url.pathname + url.search + url.hash : fallback;
  } catch {
    return fallback;
  }
}
