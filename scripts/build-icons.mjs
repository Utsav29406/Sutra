/**
 * Renders the favicon set from assets/icon.svg, the master artwork.
 *
 *   node scripts/build-icons.mjs
 *
 * Outputs:
 *   src/app/icon.png        32x32, transparent  - the favicon Next links
 *   public/favicon.ico      32x32, transparent  - legacy /favicon.ico probe
 *   src/app/apple-icon.png  180x180, OPAQUE     - see the note below
 *
 * The master lives outside src/app deliberately: Next treats any icon.* in the
 * app directory as a route file and emits a link for only one of them, so the
 * SVG sitting beside the PNG was silently ignored. Keeping it in assets/ makes
 * it unambiguously a build input.
 *
 * Re-run after editing the SVG.
 */
import sharp from "sharp";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";

const svg = readFileSync(new URL("../assets/icon.svg", import.meta.url));
const out = (p) => new URL(`../${p}`, import.meta.url);

/** Wraps a PNG buffer in an ICO container (Vista+ reads PNG-compressed icons). */
function pngToIco(png, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type 1 = icon
  header.writeUInt16LE(1, 4); // one image

  const entry = Buffer.alloc(16);
  entry.writeUInt8(size >= 256 ? 0 : size, 0); // width  (0 means 256)
  entry.writeUInt8(size >= 256 ? 0 : size, 1); // height
  entry.writeUInt8(0, 2); // palette colours
  entry.writeUInt8(0, 3); // reserved
  entry.writeUInt16LE(1, 4); // colour planes
  entry.writeUInt16LE(32, 6); // bits per pixel
  entry.writeUInt32LE(png.length, 8);
  entry.writeUInt32LE(header.length + entry.length, 12); // offset to the data

  return Buffer.concat([header, entry, png]);
}

// Transparent PNG fallback, same artwork as the SVG.
const png32 = await sharp(svg, { density: 384 }).resize(32, 32).png().toBuffer();
writeFileSync(out("src/app/icon.png"), png32);
console.log("src/app/icon.png        32x32  transparent");

writeFileSync(out("public/favicon.ico"), pngToIco(png32, 32));
console.log("public/favicon.ico      32x32  transparent");

/*
 * iOS ignores alpha on home-screen icons and composites whatever is behind it,
 * which turns a transparent mark into a black tile. So this one keeps a solid
 * ground - the site's own Kajal (#1a1416) rather than the old cream, so it
 * matches the brand instead of fighting it.
 */
mkdirSync(out("src/app"), { recursive: true });
const apple = await sharp(svg, { density: 512 })
  .resize(160, 160)
  .extend({ top: 10, bottom: 10, left: 10, right: 10, background: "#1a1416" })
  .flatten({ background: "#1a1416" })
  .png()
  .toBuffer();
writeFileSync(out("src/app/apple-icon.png"), apple);
console.log("src/app/apple-icon.png  180x180 opaque (#1a1416 - iOS drops alpha)");
