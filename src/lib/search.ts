import type { Product } from "@/lib/products";

/*
 * Collection search, shared by the shop page and the navbar.
 *
 * Every word typed must match the start of a word somewhere on the piece, in
 * any order: "banarasi saree" finds the Banarasi Silk Saree. Plurals and common
 * spellings fold into the catalogue's words, so "sarees", "kurtas" and "sari"
 * work. Matching word starts, not any substring, keeps "men" from finding
 * every "women" piece.
 */

const SPELLINGS: Record<string, string> = {
  sari: "saree",
  saris: "saree",
  lengha: "lehenga",
  lehnga: "lehenga",
  shervani: "sherwani",
  kurti: "kurta",
  mens: "men",
  womens: "women",
  ladies: "women",
};

function words(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // accents
    .replace(/['’]/g, "") // "women's" → "womens"
    .split(/[^a-z0-9₹]+/)
    .filter(Boolean);
}

/** The forms of a typed word to try: as typed, then without a plural ending. */
function forms(word: string) {
  const spelled = SPELLINGS[word] ?? word;
  const out = [spelled];
  if (spelled.length > 3 && spelled.endsWith("es")) out.push(spelled.slice(0, -2));
  if (spelled.length > 3 && spelled.endsWith("s")) out.push(spelled.slice(0, -1));
  return out;
}

// Where a match counts for more: a hit in the name beats one in the description.
const FIELDS: { weight: number; text: (p: Product) => string }[] = [
  { weight: 8, text: (p) => p.name },
  { weight: 4, text: (p) => `${p.craftName ?? ""} ${p.category.name}` },
  { weight: 2, text: (p) => `${p.fabric} ${p.state ?? ""}` },
  { weight: 1, text: (p) => p.description },
];

const indexCache = new WeakMap<Product, string[][]>();
function indexOf(p: Product) {
  let index = indexCache.get(p);
  if (!index) {
    index = FIELDS.map((f) => words(f.text(p)));
    indexCache.set(p, index);
  }
  return index;
}

/** How well a piece matches the query; 0 when some word matches nothing. */
export function searchScore(p: Product, query: string) {
  const typed = words(query);
  if (typed.length === 0) return 1;
  const index = indexOf(p);
  let score = 0;
  for (const word of typed) {
    const tries = forms(word);
    let best = 0;
    FIELDS.forEach((f, i) => {
      if (f.weight > best && index[i].some((w) => tries.some((t) => w.startsWith(t)))) best = f.weight;
    });
    if (best === 0) return 0;
    score += best;
  }
  return score;
}

/** Matching pieces, best match first; ties keep the catalogue's own order. */
export function searchProducts(list: Product[], query: string) {
  if (words(query).length === 0) return list;
  return list
    .map((p, i) => ({ p, i, score: searchScore(p, query) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .map((r) => r.p);
}

/** Every form of the typed words, for highlighting what matched. */
export function queryForms(query: string) {
  return words(query).flatMap(forms);
}
