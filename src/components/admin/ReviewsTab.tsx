"use client";

import Link from "next/link";
import { useMemo } from "react";
import { BadgeCheck, MessageSquare } from "lucide-react";
import { products } from "@/lib/products";
import { Stars } from "@/components/Stars";
import type { Review } from "@/lib/store/auth";

export function ReviewsTab({ reviews }: { reviews: Review[] }) {
  const productById = useMemo(() => new Map(products.map((p) => [p.id, p])), []);
  const average = useMemo(
    () => (reviews.length === 0 ? 0 : reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length),
    [reviews]
  );

  if (reviews.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/12 py-20 text-center">
        <MessageSquare size={36} strokeWidth={1.2} className="text-foreground/40" />
        <p className="font-medium">No reviews yet.</p>
        <p className="max-w-sm text-sm text-foreground/60">
          Ratings left after an order, and reviews written on a piece&#39;s page, will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 rounded-2xl border border-white/10 bg-cream-dark/70 px-5 py-4">
        <div className="flex items-center gap-3">
          <Stars rating={average} size={16} />
          <span className="text-sm">
            <strong className="font-medium">{average.toFixed(1)}</strong>
            <span className="text-foreground/55"> across {reviews.length} review{reviews.length === 1 ? "" : "s"}</span>
          </span>
        </div>
        <span className="text-xs text-foreground/50">
          {reviews.filter((r) => r.orderId).length} from a confirmed order
        </span>
      </div>

      <ul className="mt-4 flex flex-col gap-3">
        {reviews.map((review) => {
          const product = productById.get(review.productId);
          return (
            <li key={review.id} className="rounded-2xl border border-white/10 bg-cream-dark/70 p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                {product ? (
                  <Link href={`/product/${product.slug}`} className="text-sm font-medium transition-colors hover:text-primary">
                    {product.name}
                  </Link>
                ) : (
                  <span className="text-sm font-medium text-foreground/50">Piece no longer in the catalogue</span>
                )}
                <Stars rating={review.rating} />
              </div>
              <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-foreground/55">
                <span>{review.author}</span>
                {review.orderId && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.1em] text-primary">
                    <BadgeCheck size={11} />
                    {review.orderId}
                  </span>
                )}
                <span>{new Date(review.writtenAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</span>
              </p>
              {review.body && <p className="mt-2 text-sm leading-relaxed text-foreground/75">{review.body}</p>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
