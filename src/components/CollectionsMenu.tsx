"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FocusEvent, type KeyboardEvent } from "react";
import { AnimatePresence, m as motion } from "framer-motion";
import Photo from "@/components/Photo";
import { products } from "@/lib/products";
import { searchProducts } from "@/lib/search";
import { formatThreshold } from "@/lib/shipping";

/*
 * The Collections panel that drops down under the navbar's "Shop" link
 * (desktop only): Women and Men as photo cards, then crafts, pieces and
 * regions, and a featured edit whose picture follows whatever link is hovered.
 *
 * Every link opens the shop filtered or searched for it, and the counts are
 * what that search finds, worked out from the catalogue, so a link never
 * leads to an empty page and the numbers can't go stale.
 */

type Entry = { label: string; q: string; image: string; eyebrow: string; title: [string, string] };

const COLUMNS: { heading: string; entries: Entry[] }[] = [
  {
    heading: "By craft",
    entries: [
      { label: "Bandhani", q: "bandhani", image: "bandhani-silk-saree-madder-red", eyebrow: "Bandhani · Gujarat & Rajasthan", title: ["Tied dot by dot,", "by hand"] },
      { label: "Patola", q: "patola", image: "patan-patola-double-ikat-saree", eyebrow: "Patola · Patan & Rajkot", title: ["The double ikat of", "Patan"] },
      { label: "Chikankari", q: "chikankari", image: "lucknowi-chikan-cotton-kurta", eyebrow: "Chikankari · Lucknow", title: ["White on white,", "shadow-stitched"] },
      { label: "Ajrakh", q: "ajrakh", image: "ajrakh-block-print-cotton-saree", eyebrow: "Ajrakh · Kutch", title: ["Indigo and madder,", "block by block"] },
      { label: "Banarasi", q: "banarasi", image: "banarasi-silk-saree", eyebrow: "Banarasi · Varanasi", title: ["Real zari,", "woven in silk"] },
      { label: "Kanjivaram", q: "kanjivaram", image: "kanjivaram-bridal-silk-saree", eyebrow: "Kanjivaram · Kanchipuram", title: ["The temple-border", "bridal silk"] },
    ],
  },
  {
    heading: "By piece",
    entries: [
      { label: "Sarees", q: "saree", image: "baluchari-silk-saree", eyebrow: "Sarees", title: ["Woven across", "India"] },
      { label: "Kurtas", q: "kurta", image: "kurta-churidar-with-nehru-jacket", eyebrow: "Kurtas", title: ["Khadi, chikan and", "eri silk"] },
      { label: "Shawls", q: "shawl", image: "kashmiri-pashmina-shawl", eyebrow: "Shawls", title: ["Pashmina to", "Bhujodi wool"] },
      { label: "Dupattas", q: "dupatta", image: "phulkari-hand-embroidered-dupatta", eyebrow: "Dupattas", title: ["Phulkari, patola,", "bandhani"] },
      { label: "Sherwanis", q: "sherwani", image: "ivory-wedding-sherwani", eyebrow: "Sherwanis", title: ["For the baraat,", "with safa"] },
      { label: "Lehengas", q: "lehenga", image: "gota-patti-bridal-lehenga", eyebrow: "Lehengas", title: ["Gota patti and", "zardozi"] },
    ],
  },
  {
    heading: "By region",
    entries: [
      { label: "Gujarat", q: "gujarat", image: "rajkot-patola-silk-saree", eyebrow: "Gujarat", title: ["Patola, bandhani and", "Kutch wool"] },
      { label: "Rajasthan", q: "rajasthan", image: "gota-patti-bridal-lehenga", eyebrow: "Rajasthan", title: ["Leheriya, gota and", "block print"] },
      { label: "Uttar Pradesh", q: "uttar pradesh", image: "lucknowi-chikankari-saree", eyebrow: "Uttar Pradesh", title: ["Banarasi and", "Lucknowi chikan"] },
      { label: "Assam", q: "assam", image: "muga-silk-mekhela-sador", eyebrow: "Assam", title: ["Muga gold and", "eri silk"] },
      { label: "Bengal", q: "bengal", image: "baluchari-silk-saree", eyebrow: "Bengal", title: ["Baluchari, tant and", "jamdani"] },
      { label: "Kashmir", q: "kashmir", image: "kashmiri-wool-pheran", eyebrow: "Kashmir", title: ["Pashmina and", "sozni"] },
    ],
  },
];

const FEATURED: Entry = {
  label: "the edit",
  q: "wedding",
  image: "zardozi-velvet-bridal-lehenga",
  eyebrow: "The Wedding Edit",
  title: ["Zardozi, gota and", "Kanjivaram"],
};

const CATEGORIES = [
  { label: "Women", slug: "women", image: "chaniya-choli-garba-set", focus: "50% 20%" },
  { label: "Men", slug: "men", image: "jodhpuri-bandhgala-suit", focus: "50% 30%" },
];

const count = (q: string) => searchProducts(products, q).length;
const inCategory = (slug: string) => products.filter((p) => p.category.slug === slug).length;
const searchHref = (q: string) => `/shop?q=${encodeURIComponent(q)}`;
const photo = (name: string) => `/images/products/${name}.jpg`;
const pieces = (n: number) => `${n} piece${n === 1 ? "" : "s"}`;

// Opening waits a moment, so the panel doesn't flash when the mouse only
// crosses "Shop" on its way somewhere else; closing waits a little too, so the
// gap between the link and the panel doesn't close it.
const OPEN_DELAY_MS = 120;
const CLOSE_DELAY_MS = 160;

/** Open state and the handlers for "Shop" (the trigger) and the panel. */
export function useCollectionsMenu(pathname: string) {
  const [open, setOpen] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  const later = useCallback((next: boolean, ms: number) => {
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setOpen(next), ms);
  }, []);
  const close = useCallback(() => {
    window.clearTimeout(timer.current);
    setOpen(false);
  }, []);

  useEffect(() => close, [close]);
  useEffect(close, [pathname, close]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  const hover = {
    onMouseEnter: () => later(true, open ? 0 : OPEN_DELAY_MS),
    onMouseLeave: () => later(false, CLOSE_DELAY_MS),
  };
  // Keyboard: the down arrow on "Shop" opens the panel and moves into it, and
  // tabbing out of the panel closes it.
  const triggerKeys = (e: KeyboardEvent<HTMLElement>) => {
    if (e.key !== "ArrowDown") return;
    e.preventDefault();
    window.clearTimeout(timer.current);
    setOpen(true);
    window.setTimeout(() => document.querySelector<HTMLElement>("#sutra-collections a")?.focus(), 30);
  };
  const panelBlur = (e: FocusEvent<HTMLElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) close();
  };

  return { open, close, hover, triggerKeys, panelBlur };
}

export function CollectionsPanel({
  open,
  close,
  hover,
  panelBlur,
}: Pick<ReturnType<typeof useCollectionsMenu>, "open" | "close" | "hover" | "panelBlur">) {
  const [hot, setHot] = useState<Entry | null>(null);
  useEffect(() => {
    if (!open) setHot(null);
  }, [open]);
  const shown = hot ?? FEATURED;

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Dims the page under the panel. Not clickable, so moving onto it
              counts as leaving the menu. */}
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="pointer-events-none absolute inset-x-0 top-full h-screen bg-[#0a0708]/55 max-lg:hidden"
          />
          <motion.nav
            id="sutra-collections"
            aria-label="Collections"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            {...hover}
            onBlur={panelBlur}
            onClick={(e) => {
              if ((e.target as HTMLElement).closest("a")) close();
            }}
            className="sutra-collections absolute inset-x-0 top-full max-lg:hidden"
          >
            <div className="mx-auto grid max-w-[88rem] grid-cols-[repeat(2,minmax(0,170px))_repeat(3,minmax(0,1fr))] gap-x-6 px-8 pt-7 xl:grid-cols-[repeat(2,196px)_repeat(3,minmax(0,1fr))_268px] xl:gap-x-[30px] xl:px-10">
              {CATEGORIES.map((c) => (
                <Link key={c.slug} href={`/shop?category=${c.slug}`} className="sutra-collections-cat group">
                  <Photo
                    src={photo(c.image)}
                    alt=""
                    sizes="200px"
                    style={{ objectPosition: c.focus }}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <span className="absolute inset-x-4 bottom-3.5 z-[1] grid gap-0.5">
                    <b className="font-hero text-[30px] font-normal leading-none">{c.label}</b>
                    <small className="text-[11.5px] text-foreground/70">
                      {pieces(inCategory(c.slug))}
                      <span className="max-xl:hidden"> · Shop {c.label}</span> →
                    </small>
                  </span>
                </Link>
              ))}

              {COLUMNS.map((col) => (
                <div key={col.heading} className="min-w-0">
                  <h3 className="mb-3 mt-1 text-[10.5px] font-medium uppercase tracking-[0.26em] text-accent-light">
                    {col.heading}
                  </h3>
                  <ul className="grid gap-px">
                    {col.entries.map((entry) => (
                      <li key={entry.q}>
                        <Link
                          href={searchHref(entry.q)}
                          onMouseEnter={() => setHot(entry)}
                          onFocus={() => setHot(entry)}
                          data-hot={hot === entry || undefined}
                          className="sutra-collections-link"
                        >
                          <i aria-hidden="true">✦</i>
                          <span>{entry.label}</span>
                          <small>{count(entry.q)}</small>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}

              <Link
                href={searchHref(shown.q)}
                onMouseEnter={() => setHot(null)}
                className="sutra-collections-feature max-xl:hidden"
              >
                <Photo key={shown.image} src={photo(shown.image)} alt="" sizes="270px" className="sutra-collections-fade absolute inset-0 h-full w-full object-cover" />
                <span className="absolute inset-x-[18px] bottom-4 z-[1] grid gap-1.5">
                  <span className="text-[10px] uppercase tracking-[0.26em] text-accent-light">{shown.eyebrow}</span>
                  <span className="font-hero text-[26px] leading-[1.05]">
                    {shown.title[0]} <em className="text-[#f3dc8a]">{shown.title[1]}</em>
                  </span>
                  <span className="text-xs text-foreground/80">
                    {pieces(count(shown.q))} · Shop {shown.label} →
                  </span>
                </span>
              </Link>
            </div>

            <div className="mx-8 mt-6 flex items-center gap-6 border-t border-accent-light/15 pb-4 pt-3.5 text-xs text-foreground/55 xl:mx-10">
              <span className="sutra-collections-note">Every craft named on its label</span>
              <span className="sutra-collections-note">Free delivery over {formatThreshold()}</span>
              <span className="sutra-collections-note">7-day returns</span>
              <Link href="/shop" className="ml-auto font-medium tracking-[0.02em] text-foreground transition-colors hover:text-accent-light">
                View all {products.length} pieces →
              </Link>
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
