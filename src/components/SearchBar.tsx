"use client";

import {
  Suspense,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type RefObject,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { products } from "@/lib/products";
import { queryForms, searchProducts } from "@/lib/search";
import { formatPrice } from "@/lib/utils";

/**
 * Navbar search, always on screen.
 *
 * From md it sits beside the icons at a fixed width. `compact` is the phone
 * variant: a full-width row under the links. Phone text is 16px because iOS
 * Safari zooms the whole page into any field set smaller than that.
 *
 * Typing opens a panel of matching pieces (photo, craft, price) and a line to
 * see them all in the shop. Arrow keys move through it, Enter opens the chosen
 * one, Esc closes it.
 *
 * The text follows the address: on /shop it shows the current `?q=` (which the
 * shop page's own search box also writes), and on other pages it is empty. As
 * two independent boxes they drifted apart, and a word could seem to vanish.
 */
type Props = { compact?: boolean };

const MAX_OPTIONS = 5;
const POPULAR = ["Saree", "Lehenga", "Sherwani", "Kurta", "Patola", "Bandhani", "Ajrakh", "Pashmina"];
// Typed out one by one in the empty bar, so shoppers see what they can ask for.
const HINTS = ["sarees", "sherwanis", "Patola silk", "lehengas", "Bandhani", "kurtas", "Ajrakh prints"];
const RESTING_HINT = "Search sarees, sherwanis…";

export default function SearchBar(props: Props) {
  // useSearchParams needs a Suspense boundary on statically rendered pages;
  // the fallback is the same field, empty, until the address is known.
  return (
    <Suspense fallback={<SearchField {...props} value="" setValue={() => {}} />}>
      <AddressSearchBar {...props} />
    </Suspense>
  );
}

function AddressSearchBar(props: Props) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const fromAddress = pathname === "/shop" ? (searchParams.get("q") ?? "") : "";

  const [value, setValue] = useState(fromAddress);
  // Follow the address when it changes (a search, a link, Back/Forward).
  const [seen, setSeen] = useState(fromAddress);
  if (fromAddress !== seen) {
    setSeen(fromAddress);
    setValue(fromAddress);
  }

  return <SearchField {...props} value={value} setValue={setValue} />;
}

function SearchField({
  compact = false,
  value,
  setValue,
}: Props & { value: string; setValue: (v: string) => void }) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1); // index into the options; the last one is "See all"

  const typed = value.trim();
  const matches = useMemo(() => (typed ? searchProducts(products, typed) : []), [typed]);
  const shown = matches.slice(0, MAX_OPTIONS);
  const optionCount = shown.length > 0 ? shown.length + 1 : 0;
  const allHref = typed ? `/shop?q=${encodeURIComponent(typed)}` : "/shop";
  const placeholder = useRotatingHint(rootRef, value !== "");

  // Close when the pointer goes down anywhere else on the page.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  function close() {
    setOpen(false);
    setActive(-1);
    inputRef.current?.blur();
  }

  // Opening one piece ends the search, so the bar empties. "See all" keeps the
  // word: the shop's address carries it back into the bar.
  function openPiece() {
    close();
    setValue("");
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const chosen = active >= 0 ? shown[active] : undefined;
    if (chosen) {
      openPiece();
      router.push(`/product/${chosen.slug}`);
    } else {
      close();
      router.push(allHref);
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      if (optionCount) setActive((a) => (a + 1) % optionCount);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (optionCount) setActive((a) => (a <= 0 ? optionCount - 1 : a - 1));
    } else if (e.key === "Escape") {
      e.preventDefault(); // a search field would otherwise clear itself
      setOpen(false);
      setActive(-1);
    }
  }

  function pick(text: string) {
    setValue(text);
    setActive(-1);
    setOpen(true);
    inputRef.current?.focus();
  }

  const optionId = (i: number) => `${listId}-${i}`;

  return (
    <div
      ref={rootRef}
      // 220px on tablets. From lg it takes the room left beside the centred
      // links, up to 320px, and gives way first when that side gets crowded
      // (the header pads it off the links). The right margin keeps it off the
      // icons beside it.
      className={`sutra-search relative ${compact ? "w-full" : "hidden min-w-0 md:mr-3 md:block md:w-[220px] lg:w-0 lg:min-w-[150px] lg:max-w-[320px] lg:flex-1"}`}
      data-open={open || undefined}
      data-active={open || typed !== "" || undefined}
    >
      <form role="search" onSubmit={handleSubmit} className="relative">
        {/* 30px tall on the bar, so it matches the icon buttons exactly and the
            row sits on one optical centre; taller on phones for a finger. */}
        <label
          className={`group flex w-full items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] transition-[border-color,background-color,box-shadow] duration-300 focus-within:border-accent-light/60 focus-within:bg-white/[0.07] focus-within:shadow-[0_0_0_4px_rgb(212_175_55/0.07)] ${
            compact ? "h-10 px-4" : "h-[30px] px-3.5"
          }`}
        >
          <Search
            size={compact ? 16 : 14}
            className="shrink-0 text-foreground/35 transition duration-300 group-focus-within:-rotate-12 group-focus-within:text-accent-light"
            aria-hidden="true"
          />
          <span className="sr-only">Search the collection</span>
          <input
            ref={inputRef}
            type="search"
            role="combobox"
            aria-expanded={open && typed !== ""}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
            autoComplete="off"
            placeholder={placeholder}
            className={`min-w-0 flex-1 bg-transparent text-foreground outline-none placeholder:text-foreground/40 [&::-webkit-search-cancel-button]:hidden ${
              compact ? "text-base" : "text-xs"
            }`}
            name="q"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setActive(-1);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
          />
          <button
            type="button"
            aria-label="Clear search"
            tabIndex={value ? 0 : -1}
            onClick={() => pick("")}
            className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full bg-white/[0.08] transition duration-200 hover:bg-white/[0.16] ${
              value ? "scale-100 opacity-100" : "pointer-events-none scale-50 opacity-0"
            }`}
          >
            <X size={10} strokeWidth={3} aria-hidden="true" />
          </button>
        </label>
        {/* The same gold thread as under the active menu link. */}
        <span className="sutra-searchthread" aria-hidden="true" />
      </form>

      <div
        className={`absolute top-[calc(100%+12px)] z-50 origin-top overflow-hidden rounded-2xl border border-accent-light/20 bg-cream-dark shadow-[0_24px_60px_-20px_rgba(0,0,0,0.85)] transition-[opacity,transform,visibility] duration-200 ease-out ${
          compact ? "inset-x-0" : "right-0 w-[400px] max-w-[calc(100vw-2rem)] origin-top-right"
        } ${open ? "visible translate-y-0 scale-100 opacity-100" : "invisible -translate-y-2 scale-[0.98] opacity-0"}`}
        // Keeps focus in the bar while choosing, so the panel stays open.
        onMouseDown={(e) => e.preventDefault()}
      >
        <div className={`overflow-y-auto overscroll-contain ${compact ? "max-h-[min(62vh,470px)]" : "max-h-[min(70vh,470px)]"}`}>
          {!typed ? (
            <>
              <GroupLabel>Popular searches</GroupLabel>
              <Chips words={POPULAR} onPick={pick} />
            </>
          ) : shown.length === 0 ? (
            <>
              <p className="px-4 pb-1 pt-4 text-[13px] text-foreground/60">
                Nothing matches &ldquo;{typed}&rdquo;. Try one of these:
              </p>
              <Chips words={POPULAR.slice(0, 6)} onPick={pick} />
            </>
          ) : (
            <>
              <GroupLabel note={`${matches.length} found`}>Pieces</GroupLabel>
              <ul id={listId} role="listbox" aria-label="Matching pieces" className="px-1.5 pb-1.5">
                {shown.map((p, i) => {
                  const meta = [p.craftName, p.state].filter(Boolean).join(" · ") || p.category.name;
                  return (
                    <li
                      key={p.id}
                      id={optionId(i)}
                      role="option"
                      aria-selected={active === i}
                      className="sutra-optin"
                      style={{ "--i": i } as React.CSSProperties}
                    >
                      <Link
                        href={`/product/${p.slug}`}
                        tabIndex={-1}
                        onClick={openPiece}
                        onMouseEnter={() => setActive(i)}
                        className={`grid grid-cols-[40px_minmax(0,1fr)_auto] items-center gap-3 rounded-[10px] px-2.5 py-[7px] transition-colors ${
                          active === i ? "bg-white/[0.06]" : ""
                        }`}
                      >
                        <Image
                          src={p.images[0]}
                          alt=""
                          width={40}
                          height={50}
                          sizes="40px"
                          className="h-[50px] w-10 rounded-md bg-cream object-cover"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-[13px] text-foreground/90">
                            <Highlighted text={p.name} query={typed} />
                          </span>
                          <span className="mt-0.5 block truncate text-[11.5px] text-foreground/40">{meta}</span>
                        </span>
                        <span className="text-right text-[13px] font-medium tabular-nums text-primary">
                          {formatPrice(p.price)}
                          {p.compareAtPrice && (
                            <s className="block text-[11px] font-normal text-foreground/40">{formatPrice(p.compareAtPrice)}</s>
                          )}
                        </span>
                      </Link>
                    </li>
                  );
                })}
                <li
                  id={optionId(shown.length)}
                  role="option"
                  aria-selected={active === shown.length}
                  className="-mx-1.5 -mb-1.5 mt-1.5 border-t border-white/10"
                >
                  <Link
                    href={allHref}
                    tabIndex={-1}
                    onClick={close}
                    onMouseEnter={() => setActive(shown.length)}
                    className={`flex items-center justify-between gap-3 px-4 py-3 text-[13px] transition-colors ${
                      active === shown.length ? "bg-primary/[0.12]" : ""
                    }`}
                  >
                    <span>
                      See all <b className="font-medium text-primary">{matches.length}</b>{" "}
                      {matches.length === 1 ? "piece" : "pieces"} for &ldquo;{typed}&rdquo;
                    </span>
                    <kbd className="hidden whitespace-nowrap rounded-[5px] md:inline border border-white/10 px-1.5 py-px font-sans text-[10.5px] text-foreground/40">
                      Enter ↵
                    </kbd>
                  </Link>
                </li>
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function GroupLabel({ children, note }: { children: React.ReactNode; note?: string }) {
  return (
    <p className="flex items-baseline justify-between px-4 pb-1.5 pt-3.5 text-[10.5px] font-medium uppercase tracking-[0.24em] text-accent">
      <span>{children}</span>
      {note && <span className="text-[11.5px] font-normal normal-case tracking-normal text-foreground/40">{note}</span>}
    </p>
  );
}

function Chips({ words, onPick }: { words: string[]; onPick: (word: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2 px-4 pb-4 pt-1">
      {words.map((word, i) => (
        <button
          key={word}
          type="button"
          onClick={() => onPick(word)}
          style={{ "--i": i } as React.CSSProperties}
          className="sutra-optin rounded-full border border-accent/35 px-3 py-1.5 text-[12.5px] text-foreground/75 transition hover:-translate-y-px hover:border-accent-light hover:bg-accent-light/[0.08] hover:text-foreground"
        >
          {word}
        </button>
      ))}
    </div>
  );
}

/** The name with the start of each matched word in gold. */
function Highlighted({ text, query }: { text: string; query: string }) {
  const tries = queryForms(query);
  return (
    <>
      {text.split(/(\s+)/).map((part, i) => {
        const lower = part.toLowerCase();
        const hit = tries.filter((t) => lower.startsWith(t)).sort((a, b) => b.length - a.length)[0];
        return hit ? (
          <span key={i}>
            <mark className="bg-transparent font-medium text-accent-light">{part.slice(0, hit.length)}</mark>
            {part.slice(hit.length)}
          </span>
        ) : (
          part
        );
      })}
    </>
  );
}

/**
 * The placeholder types out one hint after another while the bar is empty and
 * on screen. It rests on a fixed hint for anyone who prefers reduced motion.
 */
function useRotatingHint(rootRef: RefObject<HTMLDivElement | null>, paused: boolean) {
  const [hint, setHint] = useState(RESTING_HINT);
  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let word = 0;
    let letters = 0;
    let deleting = false;
    let timer: number;
    const tick = () => {
      // The desktop and phone bars both exist; only the one on screen animates.
      if (!rootRef.current?.offsetParent) {
        timer = window.setTimeout(tick, 1000);
        return;
      }
      const target = HINTS[word % HINTS.length];
      if (!deleting) {
        letters++;
        const done = letters === target.length;
        setHint(`Search ${target.slice(0, letters)}${done ? "…" : ""}`);
        deleting = done;
        timer = window.setTimeout(tick, done ? 1800 : 70);
      } else {
        letters--;
        setHint(`Search ${target.slice(0, letters)}`);
        if (letters === 0) {
          deleting = false;
          word++;
        }
        timer = window.setTimeout(tick, letters === 0 ? 300 : 35);
      }
    };
    timer = window.setTimeout(tick, 2000);
    return () => {
      window.clearTimeout(timer);
      setHint(RESTING_HINT); // so a half-typed hint never sits in the bar
    };
  }, [paused, rootRef]);
  return hint;
}
