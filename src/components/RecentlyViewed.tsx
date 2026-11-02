"use client";

import { useEffect } from "react";
import { useRecentlyViewedStore } from "@/lib/store/recentlyViewed";
import { useHydrated } from "@/lib/useHydrated";
import { products } from "@/lib/products";
import ProductCard from "@/components/ProductCard";

export function RecentlyViewed({ currentId }: { currentId: string }) {
  const ids = useRecentlyViewedStore((s) => s.ids);
  const record = useRecentlyViewedStore((s) => s.record);
  const hydrated = useHydrated();

  useEffect(() => {
    record(currentId);
  }, [currentId, record]);

  if (!hydrated) return null;

  const items = ids
    .filter((id) => id !== currentId)
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is NonNullable<typeof p> => Boolean(p));

  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-6 pb-16">
      <div className="border-t border-white/12 pt-10">
        <p className="text-sm uppercase tracking-[0.3em] text-accent">Where you&#39;ve been</p>
        <h2 className="mt-2 font-display text-3xl">Recently Viewed</h2>
        <div className="mt-8 sutra-cards grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {items.slice(0, 4).map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
