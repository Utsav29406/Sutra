/**
 * The site's public address. Google, the sitemap and link previews (WhatsApp,
 * LinkedIn) need full URLs, not paths. Set NEXT_PUBLIC_SITE_URL in Vercel if
 * the site moves to its own domain.
 */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://wearsutra.vercel.app").replace(/\/+$/, "");

/**
 * The name Google shows above Sutra's search results. Without it Google falls
 * back to the host and shows "Vercel". The alternates match the address
 * (wearsutra), which helps Google trust the short name.
 */
export const SITE_NAME = "Sutra";
export const SITE_ALT_NAMES = ["Wear Sutra", "wearsutra", "Sutra — Indian Traditional Wear"];

/** A path ("/images/…") as a full URL. */
export function absoluteUrl(path: string): string {
  return path.startsWith("http") ? path : `${SITE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

/**
 * JSON-LD for a <script type="application/ld+json">. "<" is escaped so text
 * inside (a product description) can never close the script tag early.
 */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
