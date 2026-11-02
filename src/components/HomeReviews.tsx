"use client";

import Link from "next/link";
import { m as motion } from "framer-motion";
import { useAuthStore } from "@/lib/store/auth";
import { getProductBySlug, products } from "@/lib/products";
import { Stars } from "@/components/Stars";

/*
 * Real customer reviews on the home page. Only what shoppers actually wrote:
 * no seeded quotes. The strip stays hidden until there are enough good ones to
 * fill it, so a new shop doesn't show an empty or one-card section.
 */

const MIN_TO_SHOW = 3;
const MAX_SHOWN = 6;

export default function HomeReviews() {
  const reviews = useAuthStore((s) => s.reviews);

  const picked = reviews
    .filter((r) => r.rating >= 4 && r.body.trim().length >= 20)
    .sort((a, b) => b.writtenAt.localeCompare(a.writtenAt))
    .slice(0, MAX_SHOWN);

  if (picked.length < MIN_TO_SHOW) return null;

  return (
    <section className="mx-auto max-w-7xl px-6 pt-16">
      <div className="mb-8">
        <p className="text-sm uppercase tracking-[0.3em] text-accent">From our customers</p>
        <h2 className="mt-2 font-display text-3xl sm:text-4xl">Worn and Loved</h2>
      </div>

      {/* Phones swipe through; wider screens get a grid. */}
      <ul className="-mx-6 flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-3">
        {picked.map((review, i) => {
          const product = products.find((p) => p.id === review.productId) ?? getProductBySlug(review.productId);
          return (
            <motion.li
              key={review.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: (i % 3) * 0.08 }}
              className="flex w-[82%] shrink-0 snap-start flex-col rounded-2xl border border-white/[0.07] bg-cream-dark/60 p-6 sm:w-auto"
            >
              <Stars rating={review.rating} />
              <p className="mt-4 line-clamp-5 flex-1 leading-relaxed text-foreground/80">&ldquo;{review.body.trim()}&rdquo;</p>
              <p className="mt-5 text-sm">
                <span className="font-medium">{review.author.split(" ")[0]}</span>
                {product && (
                  <>
                    <span className="text-foreground/45"> on </span>
                    <Link href={`/product/${product.slug}`} className="text-accent-light hover:underline">
                      {product.name}
                    </Link>
                  </>
                )}
              </p>
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}
