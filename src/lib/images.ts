/**
 * Product and category photos in the size the screen needs. Every photo has
 * AVIF and WebP copies 200, 400, 600 and 800px wide (made by
 * scripts/build-images.mjs). The srcsets list them, and `sizes` tells the
 * browser how wide the picture is shown, so it downloads the smallest copy
 * that stays sharp on that screen. Use it through <Photo> (components/Photo).
 *
 * Anything else (the drawn SVG pieces, outside links) has no copies: null.
 */

// Keep in step with WIDTHS in scripts/build-images.mjs.
const WIDTHS = [200, 400, 600, 800];

export function photoSources(src: string): { avif: string; webp: string; fallback: string } | null {
  const match = /^\/images\/(products|categories)\/([^/]+)\.(?:jpe?g|png)$/i.exec(src);
  if (!match) return null;
  const [, folder, name] = match;
  const set = (ext: string) => WIDTHS.map((w) => `/images/opt/${w}/${folder}/${name}.${ext} ${w}w`).join(", ");
  return { avif: set("avif"), webp: set("webp"), fallback: `/images/opt/800/${folder}/${name}.webp` };
}

/** How wide a product card's photo is shown: two across on phones, three on tablets, four from lg. */
export const CARD_SIZES = "(max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw";
