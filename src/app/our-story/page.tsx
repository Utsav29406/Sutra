import type { Metadata } from "next";
import Link from "next/link";
import { CraftRoute } from "@/components/CraftRoute";
import { STOPS, craftCount, stateCount } from "@/lib/story";

export const metadata: Metadata = {
  title: "Our Story — Sutra",
  description: "Sutra means thread. The crafts behind every piece, and the places they come from.",
  alternates: { canonical: "/our-story" },
  openGraph: { title: "Our Story — Sutra", description: "Sutra means thread. The crafts behind every piece, and the places they come from.", url: "/our-story", images: ["/opengraph-image"] },
};

/*
 * Kept to what is true of the shop: the name, the mark, and the crafts and
 * places in the catalogue. No founder, founding year or maker visits, because
 * none exist.
 */

const KNOT_A = "M53.83 34.32 A23 23 0 1 1 45.62 28.67";
const KNOT_B = "M46.17 65.68 A23 23 0 1 1 54.38 71.33";

const STEPS = [
  {
    title: "Spun and dyed",
    body: "The thread is prepared first. For ikat and bandhani, the pattern is tied in before a single row is woven.",
  },
  {
    title: "Made by hand",
    body: "Woven, block printed or embroidered in the craft's home region, one piece at a time.",
  },
  {
    title: "Finished",
    body: "Hems, tassels and blouse pieces are finished, so the piece is ready to wear or to tailor.",
  },
  {
    title: "Sent to you",
    body: "Cash on delivery across 380+ cities, and 7-day returns on anything unworn.",
  },
];

const VALUES = [
  {
    title: "Rooted in a craft",
    body: "Handloom, hand block print, tie-dye and hand embroidery: every piece comes from a named Indian craft tradition.",
  },
  {
    title: "Named, not generic",
    body: "Every piece lists its fabric, its craft and where it comes from, so you know exactly what you are buying.",
  },
  {
    title: "Easy to buy",
    body: "Pay on delivery, and send it back within 7 days if it is not right. No questions over unworn pieces.",
  },
];

function Eyebrow({ children }: { children: string }) {
  return <p className="text-[11px] uppercase tracking-[0.28em] text-accent">{children}</p>;
}

function SectionTitle({ children }: { children: string }) {
  return <h2 className="mt-2 text-balance font-display text-[26px] leading-tight sm:text-4xl">{children}</h2>;
}

export default function OurStoryPage() {
  return (
    <article className="overflow-hidden">
      {/* Opening */}
      {/* No mandala of its own: the site backdrop already turns one behind
          this spot, and a second one here fought it. */}
      <section className="relative grid justify-items-center gap-5 px-6 pb-20 pt-20 text-center sm:pt-24">
        <svg viewBox="0 0 100 100" className="h-16 w-16 text-accent-light" aria-hidden="true">
          <g className="sutra-knot-draw" fill="none" stroke="currentColor" strokeWidth={7} strokeLinecap="round">
            <path pathLength={100} d={KNOT_A} />
            <path pathLength={100} d={KNOT_B} />
          </g>
        </svg>
        <Eyebrow>Our Story</Eyebrow>
        <h1 className="max-w-[16ch] text-balance font-hero text-[40px] font-medium leading-[1.05] sm:text-[64px]">
          Every piece is held together by a <em className="text-accent-light">thread</em>.
        </h1>
        <span className="font-hero text-lg italic text-accent">sūtra (सूत्र) · Sanskrit for thread</span>
        <p className="max-w-[56ch] text-base leading-relaxed text-foreground/65">
          Before a saree is a saree, it is a single strand: spun, dyed, woven or printed, and passed from one pair
          of hands to the next. Sutra is named for that strand, and built around the crafts that still work it by
          hand.
        </p>
      </section>

      {/* The name and the mark */}
      <section className="border-t border-white/[0.06] px-6 py-16">
        <div className="mx-auto grid max-w-5xl items-center gap-8 sm:grid-cols-[200px_minmax(0,1fr)] sm:gap-10">
          <svg viewBox="0 0 100 100" className="h-36 w-36 sm:h-44 sm:w-44" aria-hidden="true">
            <g fill="none" strokeWidth={7} strokeLinecap="round">
              <path className="text-accent-light" stroke="currentColor" d={KNOT_A} />
              <path className="text-primary" stroke="currentColor" d={KNOT_B} />
            </g>
          </svg>
          <div>
            <Eyebrow>The name and the mark</Eyebrow>
            <SectionTitle>Two strands, one pulled through the other.</SectionTitle>
            <p className="mt-3 max-w-[60ch] leading-relaxed text-foreground/65">
              The Sutra knot is two loops that only hold because each passes through the other. That is the shop
              in one shape: the people who make a piece, and the person who wears it.
            </p>
            <ul className="mt-5 flex flex-col gap-2.5 text-sm text-foreground/65">
              <li className="flex items-center gap-3">
                <span className="h-[3px] w-[22px] shrink-0 rounded-full bg-accent-light" />
                The maker: the weaver, printer, dyer or embroiderer
              </li>
              <li className="flex items-center gap-3">
                <span className="h-[3px] w-[22px] shrink-0 rounded-full bg-primary" />
                The wearer: you, at a wedding, a garba night, or a Tuesday
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Where the thread runs */}
      <section className="border-t border-white/[0.06] px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <Eyebrow>Where the thread runs</Eyebrow>
          <SectionTitle>Named crafts, from the places that made them famous.</SectionTitle>
          <p className="mt-3 max-w-[60ch] leading-relaxed text-foreground/65">
            Every piece on Sutra says which craft it is and where that craft comes from. These are the stops on
            the thread today.
          </p>
          <dl className="mt-7 flex flex-wrap gap-x-10 gap-y-6">
            {[
              [craftCount, "Named crafts"],
              [stateCount, "States"],
              [2, "Collections"],
            ].map(([n, label]) => (
              <div key={label} className="flex flex-col-reverse">
                <dt className="mt-1.5 text-xs uppercase tracking-[0.14em] text-foreground/45">{label}</dt>
                <dd className="font-display text-[44px] font-semibold leading-none tabular-nums text-accent-light">
                  {n}
                </dd>
              </div>
            ))}
          </dl>
          <CraftRoute stops={STOPS} />
        </div>
      </section>

      {/* From loom to your door: a real sequence, so it is numbered. */}
      <section className="border-t border-white/[0.06] px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <Eyebrow>From loom to your door</Eyebrow>
          <SectionTitle>How a piece reaches you.</SectionTitle>
          <ol className="mt-8 grid gap-6 sm:grid-cols-4 sm:gap-0">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex flex-col gap-2 sm:pr-5">
                <span className="border-b border-accent/35 pb-3 text-[13px] font-medium tracking-[0.1em] text-accent">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <b className="font-display text-lg font-medium">{step.title}</b>
                <p className="text-sm leading-relaxed text-foreground/60">{step.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* What we hold to: the double gold hairline of the sign-in card. */}
      <section className="border-t border-white/[0.06] px-6 py-16">
        <div className="mx-auto max-w-5xl">
          <Eyebrow>What we hold to</Eyebrow>
          <SectionTitle>Three promises on every label.</SectionTitle>
          <div className="mt-7 grid gap-4 sm:grid-cols-3">
            {VALUES.map((value) => (
              <div key={value.title} className="rounded-[6px] border border-accent/30 p-1.5">
                <div className="flex h-full flex-col gap-2 rounded-[3px] border border-accent/15 p-5">
                  <b className="font-display text-lg font-medium">{value.title}</b>
                  <p className="text-sm leading-relaxed text-foreground/60">{value.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Close */}
      <section className="grid justify-items-center gap-4 border-t border-white/[0.06] px-6 pb-8 pt-20 text-center">
        <Eyebrow>Find your thread</Eyebrow>
        <h2 className="text-balance font-hero text-[34px] font-medium leading-tight sm:text-5xl">
          {`${craftCount} crafts. One of them is yours.`}
        </h2>
        <div className="mt-2 flex flex-wrap justify-center gap-3">
          <Link
            href="/shop?category=women"
            className="rounded-full bg-primary px-7 py-3 text-sm font-medium text-white transition-colors hover:bg-primary-dark"
          >
            Shop women
          </Link>
          <Link
            href="/shop?category=men"
            className="rounded-full border border-foreground/25 px-7 py-3 text-sm font-medium transition-colors hover:border-primary hover:text-primary"
          >
            Shop men
          </Link>
        </div>
      </section>
    </article>
  );
}
