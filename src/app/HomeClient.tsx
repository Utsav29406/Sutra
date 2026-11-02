"use client";

import Link from "next/link";
import { m as motion } from "framer-motion";
import Hero from "@/components/Hero";
import PromiseRail from "@/components/PromiseRail";
import OffersStrip from "@/components/OffersStrip";
import FestivalBanner from "@/components/FestivalBanner";
import FestivalEdit from "@/components/FestivalEdit";
import PhoneFestivalHome from "@/sutra-mobile/festival/PhoneFestivalHome";
import { Embers, LampLine } from "@/components/DiwaliDecor";
import ProductCard from "@/components/ProductCard";
import HomeReviews from "@/components/HomeReviews";
import { products } from "@/lib/products";
import { CHIP_NAMES, STOPS, craftCount, stateCount } from "@/lib/story";

// 12 fills the grid's rows of 4 (desktop), 3 (tablet) and 2 (phone) exactly;
// every featured piece left a half-empty last row.
const FEATURED_COUNT = 12;
const featured = products.filter((p) => p.featured).slice(0, FEATURED_COUNT);

export default function HomeClient() {
  return (
    <div>
      <Embers />
      {/* Phones during a festival show its own Home instead of these. */}
      <div data-fest-hide className="contents">
        <Hero />
        <FestivalBanner />
        <PromiseRail />
        <OffersStrip />
        <FestivalEdit />
      </div>
      <PhoneFestivalHome />

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <LampLine />
            <p className="text-sm uppercase tracking-[0.3em] text-accent">Handpicked</p>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl">Featured Pieces</h2>
          </div>
          <Link
            className="hidden text-sm font-medium text-primary underline-offset-4 hover:underline sm:block"
            href="/shop"
          >
            View all →
          </Link>
        </div>
        <div className="sutra-cards grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {featured.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i % 4} />
          ))}
        </div>
      </section>

      <HomeReviews />

      {/* Our Story teaser, for visitors who never open the navbar. */}
      <section className="mx-auto max-w-7xl px-6 pt-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid items-center gap-8 rounded-[10px] border border-white/[0.06] bg-gradient-to-br from-primary-dark/30 via-transparent to-transparent px-6 py-10 sm:px-10 sm:py-14 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:gap-10"
        >
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-accent">Our Story</p>
            <h2 className="mt-2.5 font-hero text-[34px] font-medium leading-[1.08] sm:text-[46px]">
              Sutra means <em className="text-accent-light">thread</em>.
            </h2>
            <p className="mb-6 mt-3.5 max-w-[46ch] leading-relaxed text-foreground/65">
              {craftCount} crafts from {stateCount} states, each one named on its label, from Patola double ikat in
              Patan to Kolhapuri sandals stitched by hand.
            </p>
            <Link
              href="/our-story"
              className="inline-block rounded-full bg-primary px-7 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
            >
              Read our story →
            </Link>
          </div>
          <ul className="flex flex-wrap gap-2" aria-label="Some of the crafts">
            {STOPS.map((stop) => (
              <li
                key={stop.craft}
                className="whitespace-nowrap rounded-full border border-accent/35 px-3 py-1.5 text-[12.5px] text-foreground/65"
              >
                <b className="font-medium text-accent-light">{CHIP_NAMES[stop.craft] ?? stop.craft}</b> ·{" "}
                {stop.place.split(" · ")[0]}
              </li>
            ))}
            {craftCount > STOPS.length && (
              <li className="whitespace-nowrap rounded-full border border-accent/35 px-3 py-1.5 text-[12.5px] font-medium text-accent-light">
                +{craftCount - STOPS.length} more
              </li>
            )}
          </ul>
        </motion.div>
      </section>
    </div>
  );
}

