"use client";

import { useMemo, useState } from "react";
import { m as motion } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { useHydrated } from "@/lib/useHydrated";
import {
  formatStart,
  isAlwaysOn,
  isLive,
  isUpcoming,
  offers,
  type Offer,
} from "@/lib/offers";

/**
 * The offers band under the hero. Replaces the old statistics counters.
 *
 * Dates are resolved after hydration rather than at render: the home page is
 * statically prerendered at build time, so an offer scheduled to begin next
 * month would otherwise stay invisible until someone happened to redeploy.
 * Undated offers render immediately, so the strip is never empty at rest.
 */
function OfferCard({ offer, upcoming }: { offer: Offer; upcoming?: boolean }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!offer.code) return;
    try {
      await navigator.clipboard.writeText(offer.code);
    } catch {
      // Clipboard can be blocked; the code is on screen either way.
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }

  return (
    <div
      className={`group relative flex items-center gap-3 rounded-[3px] border px-3.5 py-2.5 transition-colors ${
        upcoming
          ? "border-white/[0.09] bg-white/[0.015]"
          : "border-white/[0.13] bg-white/[0.03] hover:border-accent/45"
      }`}
    >
      {/* Ticket notches — a coupon, not another rounded card. */}
      <span
        aria-hidden="true"
        className="absolute -left-[5px] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-cream"
      />
      <span
        aria-hidden="true"
        className="absolute -right-[5px] top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-cream"
      />

      <div className="min-w-0 flex-1">
        <p
          className={`font-display text-[17px] leading-tight ${
            upcoming ? "text-accent-light" : "text-primary"
          }`}
        >
          {offer.headline}
        </p>
        <p className="mt-0.5 truncate text-[11px] text-foreground/45">
          {upcoming ? `From ${formatStart(offer)} · ${offer.fine ?? offer.description}` : offer.fine}
        </p>
      </div>

      {!offer.code ? (
        // A standing policy, not a coupon — nothing to copy, so say so rather
        // than show an empty chip.
        <span className="shrink-0 rounded-[3px] border border-accent/25 px-2.5 py-1.5 text-[10.5px] uppercase tracking-wider text-accent-light/70">
          No code
        </span>
      ) : upcoming ? (
        <span className="shrink-0 rounded-[3px] border border-dashed border-accent/35 px-2 py-1 font-mono text-[10.5px] tracking-wider text-accent-light/55">
          {offer.code}
        </span>
      ) : (
        <button
          type="button"
          onClick={copy}
          // Whole chip is the target: easy to hit on a phone.
          className="flex shrink-0 items-center gap-1.5 rounded-[3px] border border-dashed border-accent/55 bg-accent/10 px-2.5 py-1.5 font-mono text-[11px] tracking-wider text-accent-light transition-colors hover:bg-accent/20"
          aria-label={copied ? `Copied ${offer.code}` : `Copy code ${offer.code}`}
        >
          {offer.code}
          {copied ? (
            <Check size={11} className="text-accent-light" aria-hidden="true" />
          ) : (
            <Copy size={11} className="opacity-55" aria-hidden="true" />
          )}
        </button>
      )}
    </div>
  );
}

export default function OffersStrip() {
  const hydrated = useHydrated();

  // Before hydration only undated offers are known to be current; afterwards
  // the real date decides. See the note at the top of the file.
  const { live, upcoming } = useMemo(() => {
    if (!hydrated) return { live: offers.filter(isAlwaysOn), upcoming: [] as Offer[] };
    const now = new Date();
    return {
      live: offers.filter((o) => isLive(o, now)),
      upcoming: offers.filter((o) => isUpcoming(o, now)),
    };
  }, [hydrated]);

  if (live.length === 0 && upcoming.length === 0) return null;

  return (
    <section
      className="border-y border-white/10 bg-cream-dark/40"
      aria-label="Current offers"
    >
      <div className="mx-auto max-w-6xl px-6 py-7">
        {live.length > 0 && (
          <>
            <div className="mb-3.5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
              <h2 className="text-[11px] uppercase tracking-[0.22em] text-accent">Offers on now</h2>
              <p className="text-[11px] text-foreground/35">
                Use the code at checkout · most pieces already 16–26% off
              </p>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45 }}
              // grid-cols-1 (minmax 0) rather than the implicit column, which
              // grows to the cards' unwrapped small print and overflows a 320px phone.
              className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3"
            >
              {live.map((offer) => (
                // Headline, not code: a standing policy has no code to key on.
                <OfferCard key={offer.code ?? offer.headline} offer={offer} />
              ))}
            </motion.div>
          </>
        )}

        {upcoming.length > 0 && (
          <>
            <h2 className="mb-3 mt-6 text-[11px] uppercase tracking-[0.22em] text-foreground/35">
              Coming soon
            </h2>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
              {upcoming.map((offer) => (
                <OfferCard key={offer.code ?? offer.headline} offer={offer} upcoming />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
