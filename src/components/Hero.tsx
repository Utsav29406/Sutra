"use client";

import Link from "next/link";
import { m as motion } from "framer-motion";
import DaysToGo from "@/components/DaysToGo";
import { Diya, HeroNight } from "@/components/DiwaliDecor";
import { DAY_MS, festivalEnd, festivalOpensLabel, findFestival } from "@/lib/festival";

/*
 * Diwali's words for the hero. Both versions are in the HTML; CSS shows the
 * Diwali ones (data-diwali) while the theme runs, and of those the "before" or
 * "during" line by whether the offer has opened (data-festival, set by
 * FESTIVAL_GATE). After the offer ends the everyday hero is back by itself.
 */
const DIWALI = findFestival("DIWALI");
const DIWALI_OPENS = DIWALI ? festivalOpensLabel(DIWALI) : "";
const DIWALI_LAST = DIWALI
  ? new Date(festivalEnd(DIWALI) - DAY_MS).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      timeZone: "Asia/Kolkata",
    })
  : "";

const HEADLINE = [
  ["Timeless", "Threads,"],
  ["Woven", "for", "Today."],
];
/** The word Diwali swaps in for "Today.". */
const DIWALI_WORD = "Diwali.";

const FLAG_COLORS = [
  "rgb(var(--color-accent-light))",
  "#ffffff",
  "rgb(var(--color-accent))",
];

/** Toran-style bunting strung across the top of the hero. */
function Bunting() {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex justify-between px-2 sm:px-6">
      <div className="absolute inset-x-0 top-0 h-px bg-white/30" />
      {Array.from({ length: 22 }, (_, i) => (
        <motion.div
          key={i}
          className="flex flex-col items-center"
          style={{ transformOrigin: "top center" }}
          animate={{ rotate: [-3, 3, -3] }}
          transition={{
            duration: 4 + ((i % 5) * 0.3),
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 0.08,
          }}
        >
          <div className="h-3 w-px bg-white/40" />
          <svg viewBox="0 0 20 24" width="16" height="19">
            <path
              d="M0 0 H20 L10 24 Z"
              fill={FLAG_COLORS[i % FLAG_COLORS.length]}
              opacity="0.9"
            />
            <circle
              cx="10"
              cy="7"
              r="2"
              fill="rgb(var(--color-primary))"
              opacity="0.6"
            />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}


export default function Hero() {
  return (
    <section className="relative flex min-h-[85vh] items-center overflow-hidden">
      {/* The sparkles, mandalas and glow now live in SiteBackdrop, fixed behind
          every page. Only the bunting is specific to the hero. */}
      <div data-diwali-off className="contents">
        <Bunting />
      </div>
      {DIWALI && <HeroNight />}

      {/* w-full matters: as a flex item this div would otherwise shrink to its
          content, so max-w-7xl never engages and mx-auto centres the block
          mid-screen instead of pinning it to the page's left margin. */}
      <div className="sutra-hero-copy relative z-10 mx-auto w-full max-w-[88rem] px-6">
        <div className="max-w-xl text-white">
          <motion.div
            className="mb-6 flex flex-col items-start gap-2.5"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img data-diwali-off src="/images/namaste-icon.png" alt="Namaste" className="h-16 w-16" />
            {DIWALI && (
              <span data-diwali className="contents">
                <Diya className="sutra-fest-heroicon" />
              </span>
            )}
            {/* Flush left with the headline below it — the rule that used to
                lead this line indented it past everything else. */}
            <div className="flex items-center gap-3">
              <span className="font-hero-ui text-[11px] font-normal uppercase tracking-[0.34em] text-accent-light">
                <span data-diwali-off>Welcome to Sutra</span>
                {DIWALI && <span data-diwali>Diwali at Sutra</span>}
              </span>
              <span className="h-px w-7 bg-accent-light/55" />
            </div>
          </motion.div>

          <motion.p
            className="mb-4 font-hero-ui text-[11px] font-normal uppercase tracking-[0.34em] text-white/50"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <span data-diwali-off>Indian Traditional Wear</span>
            {DIWALI && (
              <span data-diwali className="text-[#f8c23a]">
                <span data-diwali-before>
                  {DIWALI.percentOff}% off from {DIWALI_OPENS}
                  <DaysToGo festival={DIWALI} />
                </span>
                <span data-diwali-during>
                  {DIWALI.percentOff}% off until {DIWALI.endsOn}, {DIWALI_LAST}
                </span>
              </span>
            )}
          </motion.p>

          <h1 className="font-hero text-[3rem] font-light leading-[1.06] tracking-[-0.005em] sm:text-[3.625rem]">
            {HEADLINE.map((line, lineIndex) => (
              <span key={lineIndex} className={lineIndex === 1 ? "sutra-hero-em italic" : undefined}>
                {line.map((word, wordIndex) => (
                  <motion.span
                    key={word}
                    className="mr-3 inline-block"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.6,
                      delay: 0.3 + (lineIndex * 2 + wordIndex) * 0.1,
                      ease: "easeOut",
                    }}
                  >
                    {DIWALI && word === "Today." ? (
                      <>
                        <span data-diwali-off>{word}</span>
                        <span data-diwali>{DIWALI_WORD}</span>
                      </>
                    ) : (
                      word
                    )}
                  </motion.span>
                ))}
                {lineIndex === 0 && <br />}
              </span>
            ))}
          </h1>

          <motion.p
            className="mt-6 max-w-md font-hero-ui text-[15px] font-light text-white/85"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.9 }}
          >
            <span data-diwali-off>
              Handpicked sarees, lehengas, kurtas and sherwanis — crafted by master
              weavers across India, delivered to your doorstep.
            </span>
            {DIWALI && (
              <span data-diwali>
                Silk sarees, bridal lehengas and sherwanis, handwoven across India.{" "}
                <span data-diwali-before>
                  From {DIWALI_OPENS} to {DIWALI.endsOn} every piece is {DIWALI.percentOff}% off
                  {DIWALI.freeShipping ? " with free delivery" : ""}. No code needed.
                </span>
                <span data-diwali-during>
                  Every piece is {DIWALI.percentOff}% off{DIWALI.freeShipping ? " with free delivery" : ""} until{" "}
                  {DIWALI.endsOn}. No code needed: the prices have already dropped.
                </span>
              </span>
            )}
          </motion.p>

          <motion.div
            className="mt-8 flex gap-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.05 }}
          >
            <Link
              href="/shop"
              data-diwali-off
              className="btn-shimmer rounded-full bg-white px-7 py-3 font-hero-ui text-sm font-medium text-primary transition hover:bg-accent-light"
            >
              Shop the Collection
            </Link>
            {DIWALI && (
              <Link
                href="#festival-edit"
                data-diwali
                className="sutra-fest-cta btn-shimmer rounded-full px-7 py-3 font-hero-ui text-sm font-medium"
              >
                Shop the {DIWALI.name} Edit
              </Link>
            )}
            <Link
              href="/shop?q=bridal"
              className="btn-shimmer rounded-full border border-white/50 px-7 py-3 font-hero-ui text-sm font-medium text-white transition hover:bg-white/10"
            >
              Bridal Edit
            </Link>
          </motion.div>
        </div>
      </div>

      <motion.div
        data-diwali-off
        className="absolute bottom-8 left-1/2 -translate-x-1/2 text-white/70"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
      >
        <div className="h-9 w-5 rounded-full border border-white/50 p-1">
          <motion.div
            className="h-1.5 w-1.5 rounded-full bg-white"
            animate={{ y: [0, 14, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      </motion.div>
    </section>
  );
}
