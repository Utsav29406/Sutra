"use client";

import ProductCard from "@/components/ProductCard";
import { LampLine } from "@/components/DiwaliDecor";
import { getProductBySlug, type Product } from "@/lib/products";
import { activeFestival, festivalOpensLabel, themeFestival } from "@/lib/festival";
import { useNow } from "@/lib/useFestival";

/**
 * The festival's picked pieces on the home page, while its offer runs. A
 * festival with a theme (Diwali) shows them from its theme's first day, at
 * everyday prices until the offer opens.
 */
export default function FestivalEdit() {
  const now = useNow();
  if (now === null) return null;
  const active = activeFestival(now);
  const festival = active ?? themeFestival(now);
  if (!festival) return null;
  const pieces = festival.edit.slugs.map(getProductBySlug).filter((p): p is Product => !!p);
  if (pieces.length === 0) return null;

  const diwali = festival.id === "DIWALI";
  // "The Diwali Edit", with the festival's name set apart.
  const [before, after] = festival.edit.title.split(festival.name);
  const named = after !== undefined;

  return (
    <div className={diwali ? "sutra-fest-band" : undefined}>
      <section id="festival-edit" className="mx-auto max-w-7xl scroll-mt-28 px-6 pt-14">
        <div className="mb-10">
          {diwali && <LampLine />}
          <p className="text-sm uppercase tracking-[0.3em] text-accent">{festival.edit.eyebrow}</p>
          <h2 className="mt-2 font-display text-3xl sm:text-4xl">
            {diwali && named ? (
              <>
                {before}
                <em className="sutra-fest-name">{festival.name}</em>
                {after}
              </>
            ) : (
              festival.edit.title
            )}
          </h2>
          {diwali && (
            <p className="mt-2 text-sm text-foreground/60">
              {active
                ? `Picked for the five days, all ${festival.percentOff}% off until ${festival.endsOn}.`
                : `Picked for the five days. Prices drop by ${festival.percentOff}% on ${festivalOpensLabel(festival)}.`}
            </p>
          )}
        </div>
        <div className="sutra-cards grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {pieces.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i % 4} />
          ))}
        </div>
      </section>
    </div>
  );
}
