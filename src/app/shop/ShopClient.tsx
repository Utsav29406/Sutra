"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import AddressParams from "@/lib/AddressParams";
import { AnimatePresence, m as motion } from "framer-motion";
import { ArrowUpDown, Check, ChevronDown, Search, SlidersHorizontal, X } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { products, type Product } from "@/lib/products";
import { searchProducts } from "@/lib/search";

type Filter = "all" | "men" | "women";

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "women", label: "Women" },
  { value: "men", label: "Men" },
];

// Ranges chosen so the collection splits roughly evenly across them.
const PRICE_RANGES = [
  { value: "all", label: "All prices", min: 0, max: Infinity },
  { value: "u3", label: "Under ₹3,000", min: 0, max: 3000 },
  { value: "3-6", label: "₹3,000 – ₹6,000", min: 3000, max: 6000 },
  { value: "6-12", label: "₹6,000 – ₹12,000", min: 6000, max: 12000 },
  { value: "12+", label: "₹12,000 and above", min: 12000, max: Infinity },
] as const;
type PriceRange = (typeof PRICE_RANGES)[number]["value"];

const discountOf = (p: Product) => (p.compareAtPrice ? 1 - p.price / p.compareAtPrice : 0);

const SORTS = [
  { value: "featured", label: "Featured", compare: null },
  { value: "price-asc", label: "Lowest price", compare: (a: Product, b: Product) => a.price - b.price },
  { value: "price-desc", label: "Highest price", compare: (a: Product, b: Product) => b.price - a.price },
  { value: "discount", label: "Best discount", compare: (a: Product, b: Product) => discountOf(b) - discountOf(a) },
  { value: "rating", label: "Top rated", compare: (a: Product, b: Product) => b.rating - a.rating },
] as const;
type Sort = (typeof SORTS)[number]["value"];

const inCategory = (p: Product, filter: Filter) => filter === "all" || p.category.slug === filter;
const inRange = (p: Product, price: PriceRange) => {
  const range = PRICE_RANGES.find((r) => r.value === price)!;
  return p.price >= range.min && p.price < range.max;
};

/** The address for a category and search, as the shop and the navbar search read it. */
function shopParams(filter: Filter, text: string) {
  const params = new URLSearchParams();
  if (filter !== "all") params.set("category", filter);
  if (text.trim()) params.set("q", text.trim());
  return params.toString();
}

// Long enough not to rewrite the address on every keystroke.
const ADDRESS_DELAY_MS = 350;

export default function ShopClient() {
  // The address's ?category=, ?q= and ?price=, once the browser has read it
  // (see AddressParams). Until then the whole shop, unfiltered: what the
  // prerendered page shows.
  const [searchParams, setSearchParams] = useState(() => new URLSearchParams());
  const router = useRouter();
  const initialCategory = searchParams.get("category");
  const initialQuery = searchParams.get("q") ?? "";

  const normalizedInitial: Filter =
    initialCategory === "men" || initialCategory === "women"
      ? initialCategory
      : "all";

  const [filter, setFilter] = useState<Filter>(normalizedInitial);
  const [query, setQuery] = useState(initialQuery);
  const [price, setPrice] = useState<PriceRange>("all");
  const [sort, setSort] = useState<Sort>("featured");
  const [panelOpen, setPanelOpen] = useState(false);
  // Phones: Sort opens a sheet from the bottom, as on Flipkart.
  const [sortOpen, setSortOpen] = useState(false);

  // Category and search live in the address too (?category=, ?q=), so Back,
  // a refresh and a shared link keep them, and the navbar search shows the
  // same word as the box here.
  //
  // The navbar search and the footer's Women/Men links can change the address
  // while this page is already open. It doesn't remount then, so adopt the new
  // values. But skip addresses this page wrote itself: one can land after more
  // typing, and adopting it would wipe the newer letters.
  const paramsKey = searchParams.toString();
  const pendingWrites = useRef<string[]>([]); // asked for, not yet landed; oldest first
  const landedKey = useRef(paramsKey);
  useEffect(() => {
    landedKey.current = paramsKey;
    const own = pendingWrites.current.indexOf(paramsKey);
    if (own >= 0) {
      pendingWrites.current = pendingWrites.current.slice(own + 1);
      return;
    }
    pendingWrites.current = [];
    setFilter(normalizedInitial);
    setQuery(initialQuery);
    // ?price= only ever comes from a link (Home's budget tiles); the shop
    // doesn't write it, so a range picked here is kept unless a link sets one.
    const range = PRICE_RANGES.find((r) => r.value === searchParams.get("price"))?.value;
    if (range) setPrice(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramsKey, normalizedInitial, initialQuery]);

  const addressTimer = useRef<number | undefined>(undefined);
  useEffect(() => () => window.clearTimeout(addressTimer.current), []);

  function writeAddress(nextFilter: Filter, text: string) {
    window.clearTimeout(addressTimer.current);
    const next = shopParams(nextFilter, text);
    // Compare with where the address is heading, not where it was when the
    // keystroke happened: an earlier write may have landed since.
    const heading = pendingWrites.current.at(-1) ?? landedKey.current;
    if (next === heading) return;
    pendingWrites.current.push(next);
    router.replace(next ? `/shop?${next}` : "/shop", { scroll: false });
  }

  function chooseCategory(next: Filter) {
    setFilter(next);
    writeAddress(next, query);
  }

  function typeQuery(text: string) {
    setQuery(text); // results update at once; the address follows a moment later
    window.clearTimeout(addressTimer.current);
    addressTimer.current = window.setTimeout(() => writeAddress(filter, text), ADDRESS_DELAY_MS);
  }

  const q = query.trim().toLowerCase();
  // Best match first while searching; otherwise the curated order.
  const searched = useMemo(() => searchProducts(products, q), [q]);

  const results = useMemo(() => {
    const kept = searched.filter((p) => inCategory(p, filter) && inRange(p, price));
    const compare = SORTS.find((s) => s.value === sort)!.compare;
    // "Featured" keeps the searched order; sort a copy for the rest.
    return compare ? [...kept].sort(compare) : kept;
  }, [searched, filter, price, sort]);

  // Each option's count is what you'd get by picking it, with the other filters kept.
  const priceCount = (r: PriceRange) => searched.filter((p) => inCategory(p, filter) && inRange(p, r)).length;

  // Category has its own buttons above the grid; the panel badge counts what's in the panel.
  const activeCount = price !== "all" ? 1 : 0;
  const filtersActive = filter !== "all" || activeCount > 0 || q !== "";

  function clearFilters() {
    setFilter("all");
    setQuery("");
    setPrice("all");
    writeAddress("all", "");
  }

  // The phone panel and sort sheet: close on Escape, and stop the page
  // scrolling behind them.
  const sheetOpen = panelOpen || sortOpen;
  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setPanelOpen(false);
      setSortOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
    };
  }, [sheetOpen]);

  const groups = (
    <FilterGroups price={price} setPrice={setPrice} priceCount={priceCount} />
  );

  return (
    <div>
      <AddressParams onChange={setSearchParams} />
      <section className="border-b border-white/10 bg-cream-dark/40">
        <div className="mx-auto max-w-7xl px-6 py-12 text-center max-md:py-5">
          <p className="text-sm uppercase tracking-[0.3em] text-accent max-md:text-[11px]">The Collection</p>
          <h1 className="mt-2 font-display text-4xl sm:text-5xl max-md:mt-1 max-md:text-[1.75rem]">All Products</h1>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-10 lg:grid lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-10 max-md:pt-4">
        {/* Desktop: the filters live down the left, and stay in view while scrolling. */}
        <aside className="hidden lg:sticky lg:top-24 lg:block lg:self-start" aria-label="Filters">
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="font-display text-xl">Filters</h2>
            {filtersActive && (
              <button type="button" onClick={clearFilters} className="text-xs text-primary hover:underline">
                Clear all
              </button>
            )}
          </div>
          {groups}
          <div className="mt-8">
            <GroupTitle>Sort by</GroupTitle>
            <SortSelect sort={sort} setSort={setSort} />
          </div>
        </aside>

        <div className="min-w-0">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between max-md:mb-3">
            <div className="flex items-center gap-2">
              {filters.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => chooseCategory(f.value)}
                  aria-pressed={filter === f.value}
                  className={`rounded-full border px-4 py-2 text-sm transition ${
                    filter === f.value
                      ? "border-primary bg-primary text-white"
                      : "border-white/15 hover:border-primary"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-72 max-md:hidden">
              <Search
                size={16}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40"
                aria-hidden="true"
              />
              <input
                type="search"
                placeholder="Search pieces, crafts, regions…"
                value={query}
                onChange={(e) => typeQuery(e.target.value)}
                className="w-full rounded-xl border border-white/12 py-2.5 pl-10 pr-4 text-base outline-none transition-colors focus:border-primary sm:text-sm"
              />
            </div>
          </div>

          <p className="mb-6 text-sm text-foreground/60 max-md:mb-3 max-md:text-xs">
            {results.length} {results.length === 1 ? "piece" : "pieces"}
          </p>

          {/* Phones and tablets: a Filters button opens the same panel from the left. */}
          <div className="mb-6 flex gap-3 lg:hidden max-md:hidden">
            <button
              type="button"
              onClick={() => setPanelOpen(true)}
              className="flex flex-1 items-center justify-center gap-2 rounded-full border border-white/15 bg-cream-dark py-2 text-base transition-colors hover:border-primary sm:flex-none sm:px-6 sm:text-sm"
            >
              <SlidersHorizontal size={16} aria-hidden="true" />
              Filters
              {activeCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-white">
                  {activeCount}
                </span>
              )}
            </button>
            <div className="flex-1 sm:flex-none">
              <SortSelect sort={sort} setSort={setSort} />
            </div>
          </div>

          {/* Phones: Flipkart's Sort | Filter bar, held under the header while
              the list scrolls. */}
          <div className="sticky top-[var(--sutra-header-h,6.5rem)] z-30 -mx-6 grid grid-cols-2 border-y border-white/10 bg-cream/95 backdrop-blur-xl transition-[top] duration-300 md:hidden">
            <button
              type="button"
              onClick={() => setSortOpen(true)}
              className="flex items-center justify-center gap-2 border-r border-white/10 py-3 text-[14px] active:bg-white/5"
            >
              <ArrowUpDown size={16} aria-hidden="true" />
              <span>
                Sort
                {sort !== "featured" && (
                  <span className="ml-1.5 text-[11px] text-accent-light">· {SORTS.find((x) => x.value === sort)?.label}</span>
                )}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setPanelOpen(true)}
              className="flex items-center justify-center gap-2 py-3 text-[14px] active:bg-white/5"
            >
              <SlidersHorizontal size={16} aria-hidden="true" />
              Filter
              {activeCount > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-white">
                  {activeCount}
                </span>
              )}
            </button>
          </div>

          {results.length === 0 ? (
            <div className="py-20 text-center text-foreground/60">
              <p>No pieces match these filters.</p>
              {filtersActive && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-4 rounded-full border border-white/15 px-5 py-2 text-sm text-foreground transition-colors hover:border-primary"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="sutra-cards grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3">
              {results.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i % 6} eager={i < 4} />
              ))}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {panelOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setPanelOpen(false)}
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Filters"
              className="fixed left-0 top-0 z-50 flex h-full w-[85%] max-w-sm flex-col bg-cream shadow-2xl lg:hidden max-md:w-full max-md:max-w-none"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 300 }}
            >
              <div className="flex items-center justify-between border-b border-white/12 px-6 py-5">
                <h2 className="font-display text-xl text-primary">Filters</h2>
                <button
                  type="button"
                  onClick={() => setPanelOpen(false)}
                  className="rounded-full p-2 transition hover:bg-white/5"
                  aria-label="Close filters"
                  autoFocus
                >
                  <X size={20} />
                </button>
              </div>
              <div className="scrollbar-thin flex-1 overflow-y-auto px-6 py-6 max-md:overscroll-contain">{groups}</div>
              <div className="flex gap-3 border-t border-white/12 px-6 py-4">
                {activeCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setPrice("all")}
                    className="rounded-full border border-white/15 px-5 py-3 text-sm transition-colors hover:border-primary"
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setPanelOpen(false)}
                  className="flex-1 rounded-full bg-primary py-3 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
                >
                  Show {results.length} {results.length === 1 ? "piece" : "pieces"}
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {sortOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/50 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSortOpen(false)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Sort by"
              className="fixed inset-x-0 bottom-0 z-50 rounded-t-2xl border-t border-white/10 bg-cream pb-[env(safe-area-inset-bottom)] shadow-2xl md:hidden"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 34, stiffness: 320 }}
            >
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/55">Sort by</p>
                <button type="button" onClick={() => setSortOpen(false)} aria-label="Close" autoFocus className="rounded-full p-1.5 active:bg-white/10">
                  <X size={19} />
                </button>
              </div>
              <ul className="py-1">
                {SORTS.map((option) => (
                  <li key={option.value}>
                    <button
                      type="button"
                      aria-pressed={sort === option.value}
                      onClick={() => {
                        setSort(option.value);
                        setSortOpen(false);
                      }}
                      className={`flex w-full items-center justify-between px-5 py-3.5 text-left text-[15px] active:bg-white/5 ${
                        sort === option.value ? "text-accent-light" : "text-foreground/85"
                      }`}
                    >
                      {option.label}
                      {sort === option.value && <Check size={17} aria-hidden="true" />}
                    </button>
                  </li>
                ))}
              </ul>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function GroupTitle({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.28em] text-accent">{children}</p>;
}

/** Price, as a radio list with counts. Shared by the sidebar and the phone panel. */
function FilterGroups({
  price,
  setPrice,
  priceCount,
}: {
  price: PriceRange;
  setPrice: (p: PriceRange) => void;
  priceCount: (p: PriceRange) => number;
}) {
  return (
    <fieldset>
      <legend className="contents">
        <GroupTitle>Price</GroupTitle>
      </legend>
      {PRICE_RANGES.map((r) => (
        <Option
          key={r.value}
          name="price"
          checked={price === r.value}
          onChange={() => setPrice(r.value)}
          label={r.label}
          count={priceCount(r.value)}
        />
      ))}
    </fieldset>
  );
}

function Option({
  name,
  checked,
  onChange,
  label,
  count,
}: {
  name: string;
  checked: boolean;
  onChange: () => void;
  label: string;
  count: number;
}) {
  return (
    <label className="group flex cursor-pointer items-center gap-3 rounded-lg py-2 text-base sm:text-sm">
      <input type="radio" name={name} checked={checked} onChange={onChange} className="peer sr-only" />
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-accent-light ${
          checked ? "border-primary" : "border-white/30 group-hover:border-primary"
        }`}
        aria-hidden="true"
      >
        {checked && <span className="h-2 w-2 rounded-full bg-primary" />}
      </span>
      <span className={`flex-1 transition-colors ${checked ? "text-foreground" : "text-foreground/70 group-hover:text-foreground"}`}>
        {label}
      </span>
      <span className="text-xs tabular-nums text-foreground/40">{count}</span>
    </label>
  );
}

/** A native select, so phones get their own picker. 16px text on phones: iOS zooms into anything smaller. */
function SortSelect({ sort, setSort }: { sort: Sort; setSort: (s: Sort) => void }) {
  return (
    <label className="relative block">
      <span className="sr-only">Sort by</span>
      <select
        value={sort}
        onChange={(e) => setSort(e.target.value as Sort)}
        className="w-full cursor-pointer appearance-none rounded-full border border-white/15 bg-cream-dark py-2 pl-4 pr-9 text-base text-foreground outline-none transition-colors hover:border-primary focus:border-primary sm:text-sm"
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={15}
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-foreground/50"
        aria-hidden="true"
      />
    </label>
  );
}
