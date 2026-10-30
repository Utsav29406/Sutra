"use client";

import Link from "next/link";
import { DRAWN_FESTIVALS, festivalPrice, type Festival } from "@/lib/festival";
import type { Product } from "@/lib/products";
import { formatPrice } from "@/lib/utils";
import Photo from "@/components/Photo";
import { Swag } from "@/components/DiwaliDecor";

/*
 * Small pieces of the festival look on phones, shared by Home, the store page,
 * product cards and product pages. Anything that depends on which festival is
 * running is rendered once per festival inside data-fest-show, and the
 * before-paint gate (FESTIVAL_GATE) shows the one running now.
 */

export function FestivalIcon({ icon, size = 24 }: { icon: Festival["phone"]["icon"]; size?: number }) {
  if (icon === "diya") {
    return (
      <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
        <path d="M12 3c2 2.5 2 4.5 0 6-2-1.5-2-3.5 0-6z" fill="#f3b23a" stroke="none" />
        <path d="M3 13h18c-1 4-4.5 6-9 6s-8-2-9-6z" />
      </svg>
    );
  }
  // Two dandiya sticks, crossed, with lacquered bands in gold.
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" strokeLinecap="round">
      <path d="M5 19L19 5M5 5l14 14" stroke="currentColor" strokeWidth={2.6} />
      <path d="M8 16l1 1M15 7l1 1M8 8l1-1M15 17l1-1" stroke="#d4af37" strokeWidth={2.6} />
    </svg>
  );
}

/** What the festival takes off, measured from the MRP when there is one. */
export function festivalDeal(product: Product, festival: Festival) {
  const pay = festivalPrice(product.price, festival);
  const from = product.compareAtPrice ?? product.price;
  return { pay, from, off: Math.round((1 - pay / from) * 100) };
}

/**
 * Phones, during a festival: the price you actually pay comes first, with the
 * MRP struck through and the total saving. Replaces the everyday price row,
 * which carries data-fest-hide.
 */
export function PhoneFestivalPrice({ product, large = false }: { product: Product; large?: boolean }) {
  return DRAWN_FESTIVALS.map((f) => {
    const { pay, from, off } = festivalDeal(product, f);
    return (
      <span key={f.id} data-fest-show={f.id}>
        <span className={`flex flex-wrap items-baseline md:hidden ${large ? "mt-3 gap-x-2.5" : "mt-1 gap-x-1.5"}`}>
          {large && <span className="text-lg font-semibold text-emerald-400">↓{off}%</span>}
          {large && <span className="text-base text-foreground/40 line-through">{formatPrice(from)}</span>}
          <span className={`font-semibold text-foreground ${large ? "text-2xl" : "text-[15px]"}`}>{formatPrice(pay)}</span>
          {!large && <span className="text-xs text-foreground/40 line-through">{formatPrice(from)}</span>}
          {!large && <span className="text-xs font-semibold text-emerald-400">{off}% off</span>}
        </span>
      </span>
    );
  });
}

/** Phones, during a festival: a "Navratri price" tag on the photo, in tonight's colour. */
export function PhoneFestivalTag({ className = "bottom-2 text-[10px]" }: { className?: string }) {
  return DRAWN_FESTIVALS.map((f) => (
    <span key={f.id} data-fest-show={f.id}>
      <span
        className={`absolute left-0 rounded-r-full bg-[var(--night)] py-[3px] pl-1.5 pr-2.5 font-semibold tracking-[0.02em] text-[var(--on-night)] md:hidden ${className}`}
      >
        {f.name} price
      </span>
    </span>
  ));
}

/** A small card for sideways rows (tonight's colour, complete the look). */
export function MiniCard({ product, festival }: { product: Product; festival: Festival }) {
  const { pay } = festivalDeal(product, festival);
  return (
    <Link href={`/product/${product.slug}`} className="w-32 shrink-0 snap-start">
      <Photo
        src={product.images[0]}
        sizes="128px"
        alt={product.name}
        loading="lazy"
        className="aspect-[4/5] w-full rounded-lg bg-white/5 object-cover"
      />
      <p className="mt-1.5 truncate text-[12.5px] text-foreground/90">{product.name}</p>
      <p className="text-[13px] font-semibold">
        {formatPrice(pay)}
        {product.compareAtPrice && (
          <span className="ml-1 text-[11px] font-normal text-foreground/40 line-through">{formatPrice(product.compareAtPrice)}</span>
        )}
      </p>
    </Link>
  );
}

/**
 * A marigold garland with mango leaves, hung under the header. With `diwali`,
 * the Diwali theme swaps in the swagged toran the home page and opening screen
 * wear (DiwaliDecor), so phones match them.
 */
export function Toran({ diwali = false }: { diwali?: boolean }) {
  const plain = (
    <div className="sutra-toran" aria-hidden="true">
      {Array.from({ length: 26 }, (_, i) => (
        <b key={i} />
      ))}
    </div>
  );
  if (!diwali) return plain;
  return (
    <>
      <div data-diwali-off>{plain}</div>
      <div data-diwali className="sutra-fest-phonetoran" aria-hidden="true">
        {Array.from({ length: 8 }, (_, i) => (
          <Swag key={i} strand={1} sag={50} />
        ))}
      </div>
    </>
  );
}
