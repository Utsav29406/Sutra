"use client";

import { Sparkles } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";
import { useHydrated } from "@/lib/useHydrated";
import { TIERS, findTier } from "@/lib/circle";
import { formatPrice } from "@/lib/utils";
import { CircleCard } from "@/components/CircleParts";

const RULES = [
  {
    title: "Join free",
    body: "Tick the box when you sign up, or join from here or My Account. There is nothing to pay, ever.",
  },
  {
    title: "Move up as you shop",
    body: "Your level follows what you spent on delivered orders in the last 12 months. Cancelled and returned orders don't count.",
  },
  {
    title: "One saving per order",
    body: "Your member price, a discount code or a festival price: whichever saves you more is applied. They don't combine.",
  },
  {
    title: "Festival prices early",
    body: "When a festival offer such as Diwali opens, members get its prices one to three days before everyone else.",
  },
];

export default function CircleClient() {
  const hydrated = useHydrated();
  const user = useAuthStore((s) => s.user);
  const circle = useAuthStore((s) => s.circle);
  const mine = hydrated ? findTier(circle?.tier) : null;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-14 px-6 pb-24 pt-14 max-md:gap-10 max-md:px-4 max-md:pt-8">
      <header className="flex max-w-2xl flex-col gap-3">
        <p className="text-[11px] uppercase tracking-[0.3em] text-accent">Free membership</p>
        <h1 className="font-display text-5xl max-md:text-4xl">
          Sutra <em className="text-accent-light">Gold</em>
        </h1>
        <p className="leading-relaxed text-foreground/70">
          Join free with one tap. Get free delivery from {formatPrice(TIERS[0].freeDeliveryFrom)} straight away, then member
          prices of up to {TIERS[TIERS.length - 1].percentOff}% off as your delivered orders add up.
        </p>
      </header>

      {hydrated && user && <CircleCard />}

      <section aria-labelledby="levels" className="flex flex-col gap-5">
        <h2 id="levels" className="font-display text-3xl max-md:text-2xl">
          The three levels
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {TIERS.map((tier) => (
            <article
              key={tier.id}
              className={`flex flex-col gap-3 rounded-2xl border p-6 max-md:p-5 ${
                mine?.id === tier.id ? "border-accent bg-accent/[0.08]" : "border-white/10 bg-cream-dark/60"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className="font-display text-2xl">{tier.name}</h3>
                {mine?.id === tier.id && (
                  <span className="rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#1a120c]">
                    Your level
                  </span>
                )}
              </div>
              <p className="text-sm text-foreground/55">
                {tier.minSpend === 0
                  ? "Free · join with one tap"
                  : `${formatPrice(tier.minSpend)} delivered in 12 months`}
              </p>
              <ul className="flex flex-col gap-2 text-sm text-foreground/80">
                {tier.perks.map((perk) => (
                  <li key={perk} className="flex gap-2">
                    <Sparkles size={14} className="mt-1 shrink-0 text-accent-light" aria-hidden="true" />
                    {perk}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section aria-labelledby="how" className="flex flex-col gap-5">
        <h2 id="how" className="font-display text-3xl max-md:text-2xl">
          How it works
        </h2>
        <dl className="grid gap-x-10 gap-y-6 md:grid-cols-2">
          {RULES.map((rule) => (
            <div key={rule.title} className="flex flex-col gap-1.5">
              <dt className="font-medium text-accent-light">{rule.title}</dt>
              <dd className="leading-relaxed text-foreground/70">{rule.body}</dd>
            </div>
          ))}
        </dl>
      </section>

      {hydrated && !user && <CircleCard />}
    </div>
  );
}
