"use client";

import { useState } from "react";
import { m as motion } from "framer-motion";
import { PenLine } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/lib/store/auth";
import { useRequireAccount } from "@/lib/useRequireAccount";
import { useHydrated } from "@/lib/useHydrated";
import { newReviewId } from "@/lib/review";
import { Stars, StarPicker } from "@/components/Stars";
import type { Product } from "@/lib/products";

export function ProductReviews({ product }: { product: Product }) {
  const user = useAuthStore((s) => s.user);
  const reviews = useAuthStore((s) => s.reviews);
  const addReview = useAuthStore((s) => s.addReview);
  const requireAccount = useRequireAccount();
  const hydrated = useHydrated();

  const [writing, setWriting] = useState(false);
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [posting, setPosting] = useState(false);

  const productReviews = hydrated ? reviews.filter((r) => r.productId === product.id) : [];

  return (
    <section className="mx-auto max-w-7xl px-6 py-12">
      <div className="border-t border-white/12 pt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-accent">What people say</p>
            <h2 className="mt-2 font-display text-3xl">Reviews</h2>
          </div>
          <div className="flex items-center gap-3">
            <Stars rating={product.rating} size={16} />
            <span className="text-sm text-foreground/60">
              <strong className="font-medium text-foreground/80">{product.rating.toFixed(1)}</strong>
              {product.reviewCount > 0 && ` from ${product.reviewCount} ratings`}
            </span>
          </div>
        </div>

        {!writing && (
          <button
            onClick={() => {
              // A review needs an author the shop can stand behind, so this is
              // gated where the wishlist is - at the point of acting, not at
              // the point of reading. Everyone can still read reviews.
              if (!requireAccount("write a review")) return;
              setWriting(true);
            }}
            className="mt-6 flex items-center gap-2 rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium transition hover:border-primary hover:text-primary"
          >
            <PenLine size={15} />
            Write a review
          </button>
        )}

        {writing && (
          <motion.form
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={async (e) => {
              e.preventDefault();
              if (posting) return;
              const author = (user?.name || "").trim();
              const trimmedBody = body.trim();
              if (trimmedBody.length < 10) {
                toast.error("Tell us a little more — at least ten characters.");
                return;
              }
              setPosting(true);
              const result = await addReview({
                id: newReviewId(),
                productId: product.id,
                author,
                rating,
                body: trimmedBody,
                writtenAt: new Date().toISOString(),
              });
              setPosting(false);
              if (!result.ok) {
                toast.error(result.error ?? "Could not post your review.");
                return;
              }
              setWriting(false);
              setBody("");
              setRating(5);
              toast.success("Thank you — your review is up.");
            }}
            className="mt-6 flex max-w-xl flex-col gap-4 rounded-2xl border border-white/12 bg-cream-dark/70 p-6"
          >
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              <span className="text-sm text-foreground/60">Your rating</span>
              <StarPicker value={rating} onChange={setRating} />
            </div>
            {/* Reviews are signed with the account's name by the server. */}
            <p className="text-sm text-foreground/55">
              Posting as <span className="text-foreground/80">{user?.name}</span>
            </p>
            <textarea
              maxLength={500}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder={`How is the ${product.fabric.toLowerCase()}? Did it fit as expected?`}
              rows={4}
              required
              minLength={10}
              className="resize-y rounded-xl border border-white/12 px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
            />
            <div className="flex flex-wrap gap-3">
              <button type="submit" disabled={posting} className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark disabled:opacity-60">
                {posting ? "Posting…" : "Post review"}
              </button>
              <button type="button" onClick={() => setWriting(false)} className="rounded-full px-5 py-2.5 text-sm text-foreground/60 transition hover:text-primary">
                Cancel
              </button>
            </div>
          </motion.form>
        )}

        {productReviews.length > 0 ? (
          <ul className="mt-8 flex flex-col gap-5">
            {productReviews.map((review) => (
              <motion.li
                key={review.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-2xl border border-white/10 bg-cream-dark/70 p-5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{review.author}</span>
                  <Stars rating={review.rating} />
                </div>
                {review.body && <p className="mt-2 text-sm leading-relaxed text-foreground/75">{review.body}</p>}
                <p className="mt-2 text-xs text-foreground/45">
                  {new Date(review.writtenAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </motion.li>
            ))}
          </ul>
        ) : (
          !writing && (
            <p className="mt-8 max-w-md text-sm text-foreground/55">
              No one has written about this piece yet. If you own it, yours would be the first.
            </p>
          )
        )}
      </div>
    </section>
  );
}
