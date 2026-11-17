"use client";

import Link from "next/link";
import { m as motion } from "framer-motion";

const HEADLINE = [
  ["Timeless", "Threads,"],
  ["Woven", "for", "Today."],
];

export default function Hero() {
  return (
    <section className="relative flex min-h-[85vh] items-center overflow-hidden">
      {/* The sparkles, mandalas and glow live in SiteBackdrop, fixed behind
          every page. */}

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
            <img src="/images/namaste-icon.png" alt="Namaste" className="h-16 w-16" />
            {/* Flush left with the headline below it — the rule that used to
                lead this line indented it past everything else. */}
            <div className="flex items-center gap-3">
              <span className="font-hero-ui text-[11px] font-normal uppercase tracking-[0.34em] text-accent-light">
                Welcome to Sutra
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
            Indian Traditional Wear
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
                    {word}
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
            Handpicked sarees, lehengas, kurtas and sherwanis — crafted by master
              weavers across India, delivered to your doorstep.
          </motion.p>

          <motion.div
            className="mt-8 flex gap-4"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.05 }}
          >
            <Link
              href="/shop"
              className="btn-shimmer rounded-full bg-white px-7 py-3 font-hero-ui text-sm font-medium text-primary transition hover:bg-accent-light"
            >
              Shop the Collection
            </Link>
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
