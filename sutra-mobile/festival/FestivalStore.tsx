"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import AddressParams from "@/lib/AddressParams";
import { Tag } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { Toran } from "@/sutra-mobile/festival/FestivalParts";
import { DAY_MS, DRAWN_FESTIVALS, FESTIVALS, festivalEnd, festivalOpensLabel, festivalPrice, festivalStart, type Festival } from "@/lib/festival";
import { getProductBySlug, type Product } from "@/lib/products";
import { useNow } from "@/lib/useFestival";

/**
 * The festival's own store: its edit, with quick filters. Phones reach it from
 * the middle tab; it works at every width. Rendered for each festival and
 * shown by the before-paint gate; outside a festival, a note and a way back.
 * ?preview=DIWALI opens a festival's store before its offer starts (from its
 * "coming soon" popup), at today's prices.
 */
export default function FestivalStore() {
  // ?for=her|him (Home's For her / For him tiles), once the browser has read
  // the address; the prerendered page shows everything until then.
  const [audience, setAudience] = useState<string | null>(null);
  const [previewId, setPreviewId] = useState<string | null>(null);
  const readAudience = useCallback((params: URLSearchParams) => {
    setAudience(params.get("for"));
    setPreviewId(params.get("preview")?.toUpperCase() ?? null);
  }, []);
  const now = useNow();
  const upcoming =
    previewId && now !== null ? FESTIVALS.find((f) => f.id === previewId && now < festivalStart(f)) : undefined;

  if (upcoming) {
    return (
      <>
        <AddressParams onChange={readAudience} />
        {/* The gate only colours a running festival; a preview takes the festival's own accent. */}
        <div style={{ "--night": upcoming.phone.accent, "--on-night": "#1a1416" } as React.CSSProperties}>
          <Store festival={upcoming} audience={audience} upcoming />
        </div>
      </>
    );
  }
  return (
    <>
      <AddressParams onChange={readAudience} />
      {DRAWN_FESTIVALS.map((f) => (
        <div key={f.id} data-fest-show={f.id}>
          <Store festival={f} audience={audience} />
        </div>
      ))}
      <div data-fest-none className="mx-auto max-w-xl px-6 py-24 text-center">
        <h1 className="font-display text-3xl">No festival store open right now</h1>
        <p className="mt-3 text-foreground/65">The next festival&apos;s picks will appear here when its offer starts.</p>
        <Link href="/shop" className="mt-6 inline-block rounded-full bg-primary px-7 py-3 text-sm font-medium text-white">
          Browse the shop
        </Link>
      </div>
    </>
  );
}

const UNDER = 3500;

function Store({ festival, audience, upcoming = false }: { festival: Festival; audience: string | null; upcoming?: boolean }) {
  // Before the offer opens, prices are today's: the "Under" chip counts those.
  const priceNow = (p: Product) => (upcoming ? p.price : festivalPrice(p.price, festival));
  const filters: { label: string; keep: (p: Product) => boolean }[] = [
    { label: "All", keep: () => true },
    { label: "For her", keep: (p) => p.category.slug === "women" },
    { label: "For him", keep: (p) => p.category.slug === "men" },
    ...festival.phone.chips.map((c) => ({ label: c.label, keep: (p: Product) => c.match.test(p.name) })),
    { label: `Under ₹${UNDER.toLocaleString("en-IN")}`, keep: (p: Product) => priceNow(p) < UNDER },
  ];
  const [active, setActive] = useState(0);
  useEffect(() => {
    if (audience === "her") setActive(1);
    if (audience === "him") setActive(2);
  }, [audience]);
  const all = festival.edit.slugs.map(getProductBySlug).filter((p): p is Product => !!p);
  const shown = all.filter(filters[active].keep);

  return (
    <div className="pb-6">
      <div className="md:hidden">
        <Toran diwali />
      </div>
      <div className="mx-auto max-w-7xl px-4 pt-4 md:px-6 md:pt-12">
        <h1 className="font-hero text-[30px] font-medium leading-tight md:text-5xl">{festival.phone.storeTitle}</h1>
        <p className="mt-1 text-xs text-foreground/65 md:mt-3 md:text-base">{festival.phone.storeIntro}</p>
      </div>

      <OfferBar festival={festival} upcoming={upcoming} />

      <div className="mx-auto max-w-7xl">
        <div className="flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none] md:px-6 md:py-5" role="group" aria-label="Filter">
          {filters.map((f, i) => (
            <button
              key={f.label}
              type="button"
              aria-pressed={i === active}
              onClick={() => setActive(i)}
              className={`h-8 shrink-0 rounded-full border px-3.5 text-xs transition-colors ${
                i === active
                  ? "border-[var(--night)] bg-[var(--night)] text-[var(--on-night)]"
                  : "border-white/15 text-foreground/70 hover:border-white/30"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        <p className="px-4 pb-2.5 text-[11.5px] text-foreground/45 md:px-6">
          {shown.length} {shown.length === 1 ? "piece" : "pieces"}
        </p>
        <div className="px-6">
          <div className="sutra-cards grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
            {shown.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i % 4} eager={i < 4} />
            ))}
          </div>
        </div>
        <p className="px-4 pt-6 text-center text-[11px] text-foreground/45">
          {upcoming
            ? `${festival.name} prices start ${festivalOpensLabel(festival)}: ${festival.percentOff}% off everything here, by itself.`
            : `Prices shown already include the ${festival.name} ${festival.percentOff}%.`}
        </p>
      </div>
    </div>
  );
}

/** Sticks under the header: the offer and how long is left. */
function OfferBar({ festival, upcoming }: { festival: Festival; upcoming: boolean }) {
  const now = useNow(60_000);
  const left = now === null ? null : Math.max(0, festivalEnd(festival) - now);
  return (
    <div className="sticky top-[var(--sutra-header-h,6.5rem)] z-30 mt-3 border-y border-[color-mix(in_srgb,var(--night)_40%,transparent)] bg-[color-mix(in_srgb,var(--night)_22%,rgb(var(--color-cream)))] md:static md:mt-6">
      <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-2.5 text-xs md:px-6 md:text-sm">
        <Tag size={15} className="shrink-0 text-accent-light" aria-hidden="true" />
        <b className="font-semibold text-accent-light">
          {festival.percentOff}% off{festival.freeShipping ? " + free delivery" : ""}
        </b>
        {upcoming ? (
          <span className="ml-auto whitespace-nowrap text-foreground/65">Opens {festivalOpensLabel(festival)}</span>
        ) : festival.countdown === false ? (
          <span className="ml-auto whitespace-nowrap text-foreground/65">
            Till {festival.endsOn},{" "}
            {new Date(festivalEnd(festival) - 1).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" })}
          </span>
        ) : left !== null && (
          <span className="ml-auto whitespace-nowrap tabular-nums text-foreground/65">
            Ends in {Math.floor(left / DAY_MS)}d {String(Math.floor(left / 3_600_000) % 24).padStart(2, "0")}h
          </span>
        )}
      </div>
    </div>
  );
}
