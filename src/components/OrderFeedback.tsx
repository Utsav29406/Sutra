"use client";

import Link from "next/link";
import { useState } from "react";
import { m as motion } from "framer-motion";
import { BadgeCheck } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/lib/store/auth";
import { Stars, StarPicker } from "@/components/Stars";
import { newReviewId } from "@/lib/review";
import type { Order } from "@/lib/order";

export function OrderFeedback({ order }: { order: Order }) {
  const user = useAuthStore((s) => s.user);
  const reviews = useAuthStore((s) => s.reviews);
  const addReview = useAuthStore((s) => s.addReview);

  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [bodies, setBodies] = useState<Record<string, string>>({});
  const [sending, setSending] = useState(false);

  const uniqueItems = order.items.filter(
    (item, i) => item.productId && order.items.findIndex((o) => o.productId === item.productId) === i
  );

  function reviewFor(productId: string) {
    return reviews.find((r) => r.orderId === order.id && r.productId === productId);
  }

  const pending = uniqueItems.filter((item) => !reviewFor(item.productId));

  if (uniqueItems.length === 0) return null;

  const authorName =
    user?.name?.trim() ||
    order.email
      .split("@")[0]
      .split(/[._-]+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ") ||
    "Sutra customer";

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="mt-8 rounded-2xl border border-white/10 bg-cream-dark/70 p-6 shadow-sm"
    >
      <h2 className="font-display text-2xl text-primary">{pending.length > 0 ? "How did we do?" : "Thank you for the feedback"}</h2>
      <p className="mt-1 text-sm text-foreground/60">
        {pending.length > 0
          ? "Rate what you bought — it starts at five stars, so one tap is enough. A line about it helps the next person more."
          : "Your rating is on the piece's page for the next person to read."}
      </p>

      <ul className="mt-6 flex flex-col gap-5">
        {uniqueItems.map((item) => {
          const review = reviewFor(item.productId);
          return (
            <li key={item.productId} className="border-b border-white/10 pb-5 last:border-0 last:pb-0">
              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <Link href={`/product/${item.slug}`} className="text-sm font-medium transition-colors hover:text-primary">
                  {item.name}
                </Link>
                {review ? (
                  <span className="flex items-center gap-2">
                    <Stars rating={review.rating} size={16} />
                    <span className="inline-flex items-center gap-1 text-xs text-primary">
                      <BadgeCheck size={13} />
                      Rated
                    </span>
                  </span>
                ) : (
                  <StarPicker
                    value={ratings[item.productId] ?? 5}
                    onChange={(v) => setRatings((r) => ({ ...r, [item.productId]: v }))}
                    size={20}
                  />
                )}
              </div>
              {review ? (
                review.body && <p className="mt-2 text-sm leading-relaxed text-foreground/70">{review.body}</p>
              ) : (
                <input
                  type="text"
                  value={bodies[item.productId] ?? ""}
                  onChange={(e) => setBodies((b) => ({ ...b, [item.productId]: e.target.value }))}
                  placeholder="Anything you'd tell another buyer? (optional)"
                  maxLength={280}
                  className="mt-3 w-full rounded-xl border border-white/12 px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary"
                />
              )}
            </li>
          );
        })}
      </ul>

      {pending.length > 0 && (
        <button
          onClick={async () => {
            if (sending) return;
            setSending(true);
            const results = await Promise.all(
              pending.map((item) =>
                addReview({
                  id: newReviewId(),
                  productId: item.productId,
                  orderId: order.id,
                  author: authorName,
                  rating: ratings[item.productId] ?? 5,
                  body: (bodies[item.productId] ?? "").trim(),
                  writtenAt: new Date().toISOString(),
                })
              )
            );
            setSending(false);
            const failed = results.filter((r) => !r.ok);
            if (failed.length === results.length) {
              toast.error("Could not save your feedback. Please try again.");
              return;
            }
            if (failed.length > 0) toast.error(`${failed.length} rating(s) could not be saved.`);
            toast.success(pending.length === 1 ? "Thank you for the rating." : "Thank you for the ratings.");
          }}
          disabled={sending}
          className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-white transition hover:bg-primary-dark disabled:opacity-60"
        >
          {sending
            ? "Sending…"
            : pending.length === 1
              ? "Send feedback"
              : `Send ${pending.length} ratings`}
        </button>
      )}
      <p className="mt-4 text-xs leading-relaxed text-foreground/45">
        Reviews are signed with your name and shown on the piece&#39;s page.
      </p>
    </motion.section>
  );
}
