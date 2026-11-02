"use client";

import Link from "next/link";
import { m as motion } from "framer-motion";
import { DAY_MS, activeFestival, festivalDay, festivalEnd, type Festival } from "@/lib/festival";
import { useNow } from "@/lib/useFestival";

/**
 * The home page banner for a running festival offer: what it is, a countdown to
 * the moment it stops, and (for Navratri) the colour of each night. It reads
 * the time in the browser every second, so it appears on the first day and
 * takes itself down at midnight after the last one with nobody redeploying.
 */
export default function FestivalBanner() {
  const now = useNow(1000);
  const festival = now === null ? null : activeFestival(now);
  if (now === null || !festival) return null;

  const day = festivalDay(festival, now);
  const nights = festival.days ?? [];
  const closingDay = nights.length > 0 && day > nights.length;
  const tonight = nights[day - 1];

  const left = Math.max(0, festivalEnd(festival) - now);
  const units = [
    { label: "Days", value: String(Math.floor(left / DAY_MS)) },
    { label: "Hours", value: String(Math.floor(left / 3_600_000) % 24).padStart(2, "0") },
    { label: "Mins", value: String(Math.floor(left / 60_000) % 60).padStart(2, "0") },
    { label: "Secs", value: String(Math.floor(left / 1000) % 60).padStart(2, "0") },
  ];

  return (
    <section
      aria-label={`${festival.name} offer`}
      className="sutra-festival relative overflow-hidden border-y border-accent-light/30"
    >
      {/* Toran: a row of pennants in the nine colours. */}
      {nights.length > 0 && (
        <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-around" aria-hidden="true">
          {Array.from({ length: 28 }, (_, i) => (
            <i key={i} className="sutra-pennant" style={{ background: nights[i % nights.length].hex }} />
          ))}
        </div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1] }}
        className="relative mx-auto grid max-w-7xl items-center gap-x-12 gap-y-8 px-6 pb-9 pt-11 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]"
      >
        <div>
          <p className="flex flex-wrap items-center gap-2.5 text-[11px] uppercase tracking-[0.28em] text-accent-light">
            <span className="relative flex h-1.5 w-1.5" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-light opacity-60 motion-reduce:animate-none" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent-light" />
            </span>
            {closingDay
              ? `Happy ${festival.endsOn} · last day`
              : nights.length > 0
                ? `${festival.name} Utsav · Day ${day} of ${nights.length}`
                : `${festival.name} offer`}
          </p>
          <h2 className="mt-3 text-balance font-hero text-[36px] font-medium leading-[1.04] sm:text-[52px]">
            {closingDay ? "Last day for " : `${festival.tagline} `}
            <em className="text-accent-light">{festival.percentOff}% off</em>
          </h2>
          <p className="mt-3 max-w-[46ch] leading-relaxed text-foreground/70">
            <strong className="font-medium text-foreground">
              {festival.percentOff}% off every piece, women&apos;s and men&apos;s
            </strong>
            {festival.freeShipping ? ", with free delivery on every order" : ""}. No code needed: the price drops at
            checkout. Ends on {festival.endsOn}.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a
              href="#festival-edit"
              className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-primary transition-colors hover:bg-white"
            >
              Shop {festival.edit.title.replace(/^The /, "the ")} →
            </a>
            <Link
              href="/shop"
              className="rounded-full border border-white/25 px-6 py-3 text-sm font-medium transition-colors hover:border-accent-light"
            >
              Shop everything
            </Link>
          </div>
        </div>

        <div className="w-full max-w-[420px] lg:justify-self-end">
          {festival.countdown === false ? (
            <EndsOn festival={festival} />
          ) : (
          <>
          <p className="mb-3 text-[13px] text-foreground/65">
            {closingDay ? (
              <>
                Ends <strong className="font-medium text-foreground">tonight at midnight</strong>
              </>
            ) : (
              <>
                Offer ends on{" "}
                <strong className="font-medium text-foreground">
                  {festival.endsOn},{" "}
                  {new Date(festivalEnd(festival) - 1).toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                    timeZone: "Asia/Kolkata",
                  })}
                </strong>{" "}
                at midnight
              </>
            )}
          </p>
          <div className="grid grid-cols-4 gap-2" role="timer" aria-label="Time left in the offer">
            {units.map((u) => (
              <div key={u.label} className="rounded-lg border border-accent-light/25 bg-black/25 px-1.5 pb-2.5 pt-3 text-center">
                <motion.b
                  key={u.value}
                  initial={{ y: -6, opacity: 0.2 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ duration: 0.35 }}
                  className="block font-display text-[28px] font-normal tabular-nums leading-none sm:text-[34px]"
                >
                  {u.value}
                </motion.b>
                <span className="mt-1.5 block text-[10.5px] uppercase tracking-[0.18em] text-foreground/45">{u.label}</span>
              </div>
            ))}
          </div>
          </>
          )}
        </div>

        {nights.length > 0 && (
          <div className="lg:col-span-2">
            <ol className="grid grid-cols-9 items-end gap-1.5" aria-label={`The ${nights.length} colours of ${festival.name}`}>
              {nights.map((n, i) => {
                const state = i + 1 < day ? "past" : i + 1 === day ? "now" : "soon";
                return (
                  <li
                    key={n.colour}
                    title={`Day ${i + 1}: ${n.colour}`}
                    className={`grid justify-items-center gap-1.5 text-[10.5px] ${
                      state === "now" ? "font-medium text-foreground" : "text-foreground/40"
                    }`}
                  >
                    <i
                      className={`block w-full rounded-full transition-all ${
                        state === "now" ? "h-2.5 opacity-100" : state === "past" ? "h-1.5 opacity-20" : "h-1.5 opacity-50"
                      }`}
                      style={{ background: n.hex, boxShadow: state === "now" ? `0 0 14px ${n.hex}` : undefined }}
                    />
                    {i + 1}
                  </li>
                );
              })}
            </ol>
            <p className="mt-3 text-[13px] text-foreground/65">
              {closingDay || !tonight ? (
                <>
                  The nine nights are done. <strong className="font-medium text-foreground">{festival.closingGreeting}.</strong>
                </>
              ) : (
                <>
                  <span
                    className="mr-1.5 inline-block h-2.5 w-2.5 rounded-full align-[-1px] ring-1 ring-white/25"
                    style={{ background: tonight.hex }}
                    aria-hidden="true"
                  />
                  Today&apos;s colour: <strong className="font-medium text-foreground">{tonight.colour}</strong> ·{" "}
                  {tonight.goddess}
                </>
              )}
            </p>
          </div>
        )}
      </motion.div>
    </section>
  );
}

/** In place of the countdown, for festivals without one: just when it ends. */
function EndsOn({ festival }: { festival: Festival }) {
  const date = new Date(festivalEnd(festival) - 1).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  });
  return (
    <div className="rounded-lg border border-accent-light/25 bg-black/25 px-5 pb-4 pt-3.5">
      <span className="block text-[10.5px] uppercase tracking-[0.18em] text-foreground/45">On till</span>
      <b className="mt-1 block font-display text-[30px] font-normal leading-tight sm:text-[36px]">{festival.endsOn}</b>
      <span className="mt-0.5 block text-[13px] text-foreground/65">{date}, until midnight</span>
    </div>
  );
}
