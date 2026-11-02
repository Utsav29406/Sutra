"use client";

import Link from "next/link";
import { useState } from "react";
import { Banknote, HandHeart, Truck } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import { FestivalIcon, MiniCard, Toran } from "@/sutra-mobile/festival/FestivalParts";
import { DAY_MS, DRAWN_FESTIVALS, festivalDay, festivalEnd, type Festival } from "@/lib/festival";
import { getProductBySlug, type Product } from "@/lib/products";
import { useNow } from "@/lib/useFestival";
import Photo from "@/components/Photo";

/**
 * Home on phones while a festival runs, in place of the everyday hero, banner
 * and offer strips (those carry data-fest-hide). Rendered once per festival
 * and shown by the before-paint gate, so it is there from the first paint.
 * Anything that changes by the day is rendered for every day (data-night-show)
 * for the same reason; only the countdown and the "today" ring wait for React.
 */
export default function PhoneFestivalHome() {
  return DRAWN_FESTIVALS.map((f) => (
    <div key={f.id} data-fest-show={f.id}>
      <div className="md:hidden">
        <FestivalHome festival={f} />
      </div>
    </div>
  ));
}

const pieces = (slugs: string[]) => slugs.map(getProductBySlug).filter((p): p is Product => !!p);

// Price bands match the shop's own price filter (?price=).
const BANDS = [
  { small: "Under", big: "₹3,000", href: "/shop?price=u3", tone: "var(--color-accent-light)" },
  { small: "₹3,000 to", big: "₹6,000", href: "/shop?price=3-6", tone: "var(--night)" },
  { small: "₹6,000 to", big: "₹12,000", href: "/shop?price=6-12", tone: "rgb(var(--color-primary))" },
  { small: "Bridal", big: "Picks", href: "/shop?q=bridal", tone: "rgb(var(--color-accent))" },
];

function FestivalHome({ festival }: { festival: Festival }) {
  const now = useNow(60_000);
  const days = festival.days ?? [];
  const today = now === null ? null : festivalDay(festival, now);
  // A night someone tapped in the row; until then, today's (from the gate).
  const [picked, setPicked] = useState<number | null>(null);
  const edit = pieces(festival.edit.slugs);
  const her = getProductBySlug(festival.phone.forHer.slug);
  const him = getProductBySlug(festival.phone.forHim.slug);

  return (
    <>
      <Toran diwali />

      {/* Category circles, as stories. */}
      <div className="flex gap-3.5 overflow-x-auto px-4 pb-1 pt-3.5 [scrollbar-width:none]">
        {festival.phone.categories.map((c) => {
          const p = getProductBySlug(c.slug);
          return (
            <Link key={c.label} href={`/shop?q=${encodeURIComponent(c.q)}`} className="grid w-16 shrink-0 justify-items-center gap-1.5 text-center text-[11px] leading-tight text-foreground/70">
              <span className="sutra-story-ring block h-[62px] w-[62px] rounded-full p-[2.5px]">
                {p && <Photo src={p.images[0]} sizes="62px" alt="" className="h-full w-full rounded-full border-2 border-cream object-cover" />}
              </span>
              {c.label}
            </Link>
          );
        })}
      </div>

      {/* Tonight. */}
      <section className="sutra-tonight relative mx-4 mt-3.5 overflow-hidden rounded-2xl px-4 pb-4 pt-[18px]">
        <span className="sutra-rangoli" aria-hidden="true" />
        <span className="absolute right-3.5 top-4 text-white/85" aria-hidden="true">
          <FestivalIcon icon={festival.phone.icon} size={52} />
        </span>
        {days.length > 0 ? (
          [...days, null].map((d, i) => (
            <div key={i} data-night-show={i + 1}>
              <p className="font-hero-ui text-[10.5px] uppercase tracking-[0.3em] text-white/75">
                {d ? `${festival.name} · Night ${i + 1} of ${days.length}` : `${festival.name} · last day`}
              </p>
              <h2 className="mt-1.5 max-w-[80%] font-hero text-[34px] font-medium italic leading-[1.05]">
                {d ? d.goddess : `Happy ${festival.endsOn}`}
              </h2>
              {d && (
                <p className="mb-3.5 mt-2 flex items-center gap-2 text-[13px] text-white/85">
                  <i className="h-[18px] w-[18px] rounded-full border-2 border-white/70" style={{ background: d.hex }} />
                  <span>
                    Tonight&apos;s colour is <b className="font-semibold">{d.colour}</b>
                  </span>
                </p>
              )}
              {!d && <p className="mb-3.5 mt-2 text-[13px] text-white/85">{festival.closingGreeting}. The offer ends tonight.</p>}
            </div>
          ))
        ) : (
          <>
            <p className="font-hero-ui text-[10.5px] uppercase tracking-[0.3em] text-white/75">{festival.name} offer</p>
            <h2 className="mb-3.5 mt-1.5 max-w-[80%] font-hero text-[34px] font-medium italic leading-[1.05]">{festival.tagline}</h2>
          </>
        )}
        <div className="grid gap-0.5 rounded-[10px] border border-dashed border-accent-light/55 bg-black/30 px-3 py-2.5">
          <b className="text-[15px] font-semibold text-accent-light">{festival.percentOff}% off everything</b>
          <span className="text-xs text-white/75">
            {festival.freeShipping ? "+ free delivery · " : ""}already in the prices, no code
          </span>
        </div>
        <Countdown festival={festival} />
        <Link
          href="/festival"
          className="mt-3.5 flex h-11 items-center justify-center gap-2 rounded-[10px] bg-accent-light text-sm font-semibold text-[#1a1416] active:bg-accent"
        >
          <FestivalIcon icon={festival.phone.icon} size={20} />
          Shop the {festival.phone.storeTitle}
        </Link>
      </section>

      {days.length > 0 && (
        <>
          <section className="px-4 pt-6">
            <h2 className="mb-3 font-hero text-[23px] font-medium leading-tight">
              {days.length === 9 ? "Nine nights, nine colours" : `${days.length} days, ${days.length} colours`}
            </h2>
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(0, 1fr))` }}>
              {days.map((d, i) => {
                const k = i + 1;
                const isToday = today === k;
                const past = today !== null && k < today;
                const on = (picked ?? today) === k;
                return (
                  <button
                    key={d.colour}
                    type="button"
                    onClick={() => setPicked(k)}
                    aria-pressed={on}
                    aria-label={`Night ${k}, ${d.colour}, ${d.goddess}`}
                    className={`grid justify-items-center gap-1 text-[10px] ${on ? "text-foreground" : "text-foreground/45"}`}
                  >
                    <i
                      className={`relative grid h-[30px] w-[30px] place-items-center rounded-full border border-white/20 text-[11px] font-semibold not-italic transition-transform ${
                        on ? "scale-110" : ""
                      } ${isToday ? "shadow-[0_0_0_2px_rgb(var(--color-cream)),0_0_0_4px_rgb(var(--color-accent-light))]" : ""} ${past ? "opacity-55" : ""}`}
                      style={{ background: d.hex, color: d.hex === "#f2efe9" || d.hex === "#f2c230" ? "#1a1416" : "#fff" }}
                    >
                      {k}
                    </i>
                    {isToday ? "Today" : d.colour.split(" ")[0]}
                  </button>
                );
              })}
            </div>
            <p className="mt-3 rounded-[10px] bg-cream-dark px-3 py-2.5 text-xs leading-relaxed text-foreground/65">
              {picked !== null ? (
                <NightNote festival={festival} night={picked} today={today} />
              ) : (
                <>
                  {days.map((_, i) => (
                    <span key={i} data-night-show={i + 1}>
                      <NightNote festival={festival} night={i + 1} today={i + 1} />
                    </span>
                  ))}
                  <span data-night-show={days.length + 1}>
                    <b className="font-medium text-foreground">{festival.endsOn} today.</b> Tap any night to see its colour.
                  </span>
                </>
              )}
            </p>
          </section>

          {/* Wear tonight's colour (or the night tapped above). */}
          <section className="px-4 pt-6">
            {picked !== null ? (
              <ColourRow festival={festival} night={picked} today={today} />
            ) : (
              days.map((_, i) => (
                <div key={i} data-night-show={i + 1}>
                  <ColourRow festival={festival} night={i + 1} today={i + 1} />
                </div>
              ))
            )}
          </section>
        </>
      )}

      <section className="px-4 pt-6">
        <h2 className="mb-3 font-hero text-[23px] font-medium leading-tight">Shop by budget</h2>
        <div className="grid grid-cols-2 gap-2">
          {BANDS.map((b) => (
            <Link key={b.href} href={b.href} className="relative grid gap-0.5 overflow-hidden rounded-xl border border-white/10 bg-cream-dark p-3">
              <small className="text-[10.5px] uppercase tracking-[0.12em] text-foreground/45">{b.small}</small>
              <b className="text-lg font-semibold">{b.big}</b>
              <span className="absolute -bottom-4 -right-4 h-14 w-14 rounded-full opacity-50" style={{ background: b.tone }} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </section>

      <section className="pt-6">
        <div className="mb-3 flex items-baseline justify-between px-4">
          <h2 className="font-hero text-[23px] font-medium leading-tight">{festival.edit.title}</h2>
          <Link href="/festival" className="text-xs text-accent-light">
            See all {edit.length}
          </Link>
        </div>
        <div className="px-6">
          <div className="sutra-cards grid grid-cols-2">
            {edit.slice(0, 6).map((p, i) => (
              <ProductCard key={p.id} product={p} index={i % 2} />
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2 px-4 pt-6">
        {[
          { title: "For her", tile: festival.phone.forHer, p: her, href: "/festival?for=her" },
          { title: "For him", tile: festival.phone.forHim, p: him, href: "/festival?for=him" },
        ].map(({ title, tile, p, href }) => (
          <Link key={title} href={href} className="relative aspect-[3/4] overflow-hidden rounded-xl bg-cream-dark">
            {p && <Photo src={p.images[0]} sizes="50vw" alt="" loading="lazy" className="h-full w-full object-cover" />}
            <span className="absolute inset-x-0 bottom-0 bg-gradient-to-b from-transparent to-black/85 px-3 pb-3 pt-8 font-hero text-[22px] font-medium leading-tight">
              {title}
              <small className="block font-sans text-[11px] text-white/75">{tile.sub}</small>
            </span>
          </Link>
        ))}
      </section>

      <ul className="mx-4 mt-6 grid gap-2.5 rounded-xl bg-cream-dark p-3.5 text-[12.5px] text-foreground/65">
        {festival.freeShipping && (
          <li className="flex items-center gap-2.5">
            <Truck size={18} strokeWidth={1.6} className="shrink-0 text-accent-light" aria-hidden="true" />
            Free delivery on every order till {festival.endsOn}
          </li>
        )}
        <li className="flex items-center gap-2.5">
          <Banknote size={18} strokeWidth={1.6} className="shrink-0 text-accent-light" aria-hidden="true" />
          Cash on delivery
        </li>
        <li className="flex items-center gap-2.5">
          <HandHeart size={18} strokeWidth={1.6} className="shrink-0 text-accent-light" aria-hidden="true" />
          Handwoven, with the craft named on every label
        </li>
      </ul>
    </>
  );
}

function NightNote({ festival, night, today }: { festival: Festival; night: number; today: number | null }) {
  const d = festival.days![night - 1];
  const when =
    today === null || night === today
      ? "Tonight. Tap any night to see its colour."
      : night < today
        ? "Already celebrated."
        : `Coming up in ${night - today} ${night - today === 1 ? "day" : "days"}.`;
  return (
    <>
      <b className="font-medium text-foreground">
        Night {night}, {d.goddess}.
      </b>{" "}
      {when}
    </>
  );
}

function ColourRow({ festival, night, today }: { festival: Festival; night: number; today: number | null }) {
  const d = festival.days![night - 1];
  const list = pieces(d.slugs);
  const colour = d.colour.toLowerCase();
  return (
    <>
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 className="font-hero text-[23px] font-medium leading-tight">
          Wear {colour}
          {night === today ? " tonight" : ` on night ${night}`}
        </h2>
        <Link href="/festival" className="shrink-0 text-xs text-accent-light">
          See all
        </Link>
      </div>
      {list.length > 0 ? (
        <div className="-mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
          {list.map((p) => (
            <MiniCard key={p.id} product={p} festival={festival} />
          ))}
        </div>
      ) : (
        <p className="rounded-[10px] border border-dashed border-white/15 p-3.5 text-xs leading-relaxed text-foreground/60">
          Nothing in {colour} yet. The {festival.edit.title} is ready for every night.
        </p>
      )}
    </>
  );
}

function Countdown({ festival }: { festival: Festival }) {
  if (festival.countdown === false) {
    const date = new Date(festivalEnd(festival) - 1).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
    return (
      <p className="mt-3.5 text-[12.5px] leading-snug text-white/80">
        On till <b className="font-semibold text-white">{festival.endsOn}</b>, {date}
      </p>
    );
  }
  return <Ticking festival={festival} />;
}

function Ticking({ festival }: { festival: Festival }) {
  const now = useNow(1000);
  const left = now === null ? null : Math.max(0, festivalEnd(festival) - now);
  const pad = (v: number) => String(v).padStart(2, "0");
  const units =
    left === null
      ? ["–", "–", "–", "–"]
      : [String(Math.floor(left / DAY_MS)), pad(Math.floor(left / 3_600_000) % 24), pad(Math.floor(left / 60_000) % 60), pad(Math.floor(left / 1000) % 60)];
  const last = new Date(festivalEnd(festival) - 1).toLocaleDateString("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
  return (
    <div className="mt-3.5 flex items-end gap-1.5" role="timer" aria-label={`Offer ends ${festival.endsOn}, ${last}`}>
      {units.map((v, i) => (
        <div key={i} className="grid min-w-[46px] justify-items-center rounded-lg bg-white/[0.08] pb-[5px] pt-1.5">
          <b className="text-lg font-semibold leading-tight tabular-nums">{v}</b>
          <small className="text-[9.5px] uppercase tracking-[0.08em] text-white/60">{["days", "hrs", "min", "sec"][i]}</small>
        </div>
      ))}
      <p className="mb-1 ml-1 text-[11.5px] leading-snug text-white/70">
        till {festival.endsOn},
        <br />
        {last}
      </p>
    </div>
  );
}
