"use client";

import { RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { formatThreshold } from "@/lib/shipping";
import { useFestival } from "@/lib/useFestival";

const promises = [
  { icon: Truck, lead: "Free shipping", rest: `over ${formatThreshold()}` },
  { icon: ShieldCheck, lead: "Handloom marked", rest: "at source" },
  { icon: RotateCcw, lead: "7-day returns", rest: "no questions" },
];

/** Sits between the hero and the stats bar, where the search band used to be. */
export default function PromiseRail() {
  // During a festival with free delivery, say so rather than quote the threshold.
  const festival = useFestival();
  const shown = festival?.freeShipping
    ? [{ ...promises[0], rest: `on every order till ${festival.endsOn}` }, ...promises.slice(1)]
    : promises;
  return (
    <section className="grid grid-cols-1 border-y border-white/10 bg-cream-dark/45 sm:grid-cols-3">
      {shown.map(({ icon: Icon, lead, rest }) => (
        <div
          key={lead}
          className="flex items-center justify-center gap-2.5 border-t border-white/10 px-4 py-3.5 text-xs text-foreground/70 first:border-t-0 sm:border-l sm:border-t-0 sm:first:border-l-0"
        >
          <Icon size={15} strokeWidth={1.6} className="shrink-0 text-accent-light" aria-hidden="true" />
          <span>
            <b className="font-medium text-foreground">{lead}</b> {rest}
          </span>
        </div>
      ))}
    </section>
  );
}
