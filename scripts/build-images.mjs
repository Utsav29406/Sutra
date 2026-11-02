/**
 * Makes small copies of every product and category photo, so phones download
 * a picture sized for their screen instead of the 100-340 KB original: AVIF
 * (smallest; iPhones from iOS 16, every current Android and desktop browser)
 * and WebP for older phones. The pages pick one through <picture> and srcset
 * (see src/components/Photo.tsx and src/lib/images.ts).
 *
 *   node scripts/build-images.mjs           makes any copies that are missing
 *   node scripts/build-images.mjs --force   remakes all of them
 *
 * Runs by itself before every `npm run build` (the "prebuild" script), so
 * adding a product photo is all it takes. If you replace a photo but keep its
 * file name, run it once with --force. The originals stay untouched in
 * public/images/products and public/images/categories.
 */
import sharp from "sharp";
import { existsSync, mkdirSync, readdirSync } from "node:fs";
import path from "node:path";

// Keep in step with WIDTHS in src/lib/images.ts.
const WIDTHS = [200, 400, 600, 800];
// Fabric weave is the detail that matters most; below these it starts to smear.
const FORMATS = [
  { ext: "avif", encode: (img) => img.avif({ quality: 50, effort: 4 }) },
  { ext: "webp", encode: (img) => img.webp({ quality: 70, effort: 5 }) },
];
const force = process.argv.includes("--force");
const FOLDERS = ["products", "categories"];
const root = path.join(process.cwd(), "public", "images");

let made = 0;
let kept = 0;
for (const folder of FOLDERS) {
  const dir = path.join(root, folder);
  for (const file of readdirSync(dir)) {
    if (!/\.(jpe?g|png)$/i.test(file)) continue;
    const source = path.join(dir, file);
    for (const width of WIDTHS) {
      for (const format of FORMATS) {
        const outDir = path.join(root, "opt", String(width), folder);
        const out = path.join(outDir, file.replace(/\.(jpe?g|png)$/i, `.${format.ext}`));
        if (!force && existsSync(out)) {
          kept++;
          continue;
        }
        mkdirSync(outDir, { recursive: true });
        await format.encode(sharp(source).resize({ width, withoutEnlargement: true })).toFile(out);
        made++;
      }
    }
  }
}
console.log(`[images] ${made} made, ${kept} already up to date`);
