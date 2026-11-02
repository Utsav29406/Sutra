import { products } from "@/lib/products";

/**
 * Content for the Our Story page and its home-page teaser.
 *
 * The counts are worked out from the catalogue rather than typed in, so "20
 * crafts from 7 states" stays true as pieces are added or removed.
 */
export const craftCount = new Set(products.map((p) => p.craftName).filter(Boolean)).size;
export const stateCount = new Set(products.map((p) => p.state).filter(Boolean)).size;

export type Stop = { place: string; craft: string; line: string };

/** Stops on the thread. Every craft here is sold on the site today. */
export const STOPS: Stop[] = [
  {
    place: "Patan · Gujarat",
    craft: "Patola",
    line: "Double ikat: both the warp and the weft are tie-dyed before weaving, so the pattern reads the same on both sides.",
  },
  {
    place: "Kutch · Gujarat",
    craft: "Ajrakh",
    line: "Printed with carved wooden blocks and a resist, then dyed in indigo and madder, stage after stage.",
  },
  {
    place: "Bagru · Rajasthan",
    craft: "Dabu",
    line: "A mud paste pressed on by hand holds back the indigo, leaving the pattern pale where it sat.",
  },
  {
    place: "Kota · Rajasthan",
    craft: "Kota Doria",
    line: "Cotton and silk woven together into a fine, airy square check called khat.",
  },
  {
    place: "Varanasi · Uttar Pradesh",
    craft: "Banarasi Brocade",
    line: "Silk woven with gold and silver zari, the saree most families bring out for a wedding.",
  },
  {
    place: "Lucknow · Uttar Pradesh",
    craft: "Chikankari",
    line: "Fine white-on-white hand embroidery, stitched close enough to read as texture.",
  },
  {
    place: "Kanchipuram · Tamil Nadu",
    craft: "Kanjivaram Silk",
    line: "Heavy mulberry silk with a border in a contrasting colour, woven to last generations.",
  },
  {
    place: "Assam",
    craft: "Eri Silk",
    line: "Often called peace silk: spun from cocoons the moth has already left.",
  },
  {
    place: "Kolhapur · Maharashtra",
    craft: "Kolhapuri",
    line: "Leather sandals cut and stitched by hand, softening to the foot with wear.",
  },
];

/** Short labels for the home-page chips: "Banarasi Brocade" reads as "Banarasi". */
export const CHIP_NAMES: Record<string, string> = {
  "Banarasi Brocade": "Banarasi",
  "Kanjivaram Silk": "Kanjivaram",
};
