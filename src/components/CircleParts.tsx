"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Sparkles } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";
import { useFestival, useMember } from "@/lib/useFestival";
import { findTier, memberPrice, nextTier, TIERS, type Tier } from "@/lib/circle";
import { formatPrice } from "@/lib/utils";

/*
 * Sutra Gold on the page (rules in lib/circle.ts): the line under a product's
 * price, the card on My Account and phone Home, and the join button.
 */

/** Joins straight away when signed in; otherwise sends to sign-up and back. */
export function JoinCircleButton({ className = "", label = "Join Sutra Gold, free" }: { className?: string; label?: string }) {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const joinCircle = useAuthStore((s) => s.joinCircle);
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      className={
        className ||
        "rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-[#1a120c] transition hover:bg-accent-light disabled:opacity-60"
      }
      onClick={async () => {
        if (!user) {
          router.push("/signup?next=/gold");
          return;
        }
        setBusy(true);
        const result = await joinCircle();
        setBusy(false);
        if (result.ok) toast.success("Welcome to Sutra Gold.");
        else toast.error(result.error);
      }}
    >
      {busy ? "Joining…" : label}
    </button>
  );
}

/** Progress to the next level, as a thread that fills. */
function Progress({ spend, tier }: { spend: number; tier: Tier }) {
  const next = nextTier(tier);
  const share = next ? Math.min(1, spend / next.minSpend) : 1;
  return (
    <div className="flex flex-col gap-2">
      <div
        className="h-1.5 overflow-hidden rounded-full bg-white/10"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(share * 100)}
        aria-label={next ? `Progress to ${next.name}` : "Top level reached"}
      >
        <div className="h-full rounded-full bg-gradient-to-r from-accent to-accent-light" style={{ width: `${share * 100}%` }} />
      </div>
      <p className="text-[13px] text-foreground/60">
        {next ? (
          <>
            <b className="font-medium text-foreground">{formatPrice(next.minSpend - spend)}</b> more in delivered orders to reach{" "}
            <b className="font-medium text-accent-light">{next.name}</b>: {next.perks[0].toLowerCase()}.
          </>
        ) : (
          "You're at the top level. Thank you for shopping with Sutra."
        )}
      </p>
    </div>
  );
}

/** My Account (desktop and phone): the member's level, or an invitation to join. */
export function CircleCard({ compact = false }: { compact?: boolean }) {
  const circle = useAuthStore((s) => s.circle);
  const tier = findTier(circle?.tier);
  return (
    <section
      aria-label="Sutra Gold"
      className="flex flex-col gap-4 rounded-2xl border border-accent/30 bg-gradient-to-br from-accent/[0.12] via-accent/[0.04] to-transparent p-6 max-md:gap-3 max-md:p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.28em] text-accent">Sutra Gold</p>
          <h2 className="mt-1 font-display text-2xl max-md:text-xl">
            {tier ? `You're a ${tier.name} member` : "Join free, save more"}
          </h2>
        </div>
        {tier && (
          <span className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-[#1a120c]">{tier.name}</span>
        )}
      </div>
      {tier && circle ? (
        <>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-foreground/60">Delivered in the last 12 months</span>
            <b className="font-semibold tabular-nums">{formatPrice(circle.spend)}</b>
          </div>
          <Progress spend={circle.spend} tier={tier} />
          {!compact && (
            <ul className="grid gap-1.5 text-sm text-foreground/75 sm:grid-cols-3">
              {tier.perks.map((perk) => (
                <li key={perk} className="flex gap-2">
                  <Sparkles size={14} className="mt-1 shrink-0 text-accent-light" aria-hidden="true" />
                  {perk}
                </li>
              ))}
            </ul>
          )}
          <Link href="/gold" className="self-start text-sm text-accent-light underline-offset-4 hover:underline">
            See all levels and perks
          </Link>
        </>
      ) : (
        <>
          <p className="text-sm leading-relaxed text-foreground/70">
            Free delivery from {formatPrice(TIERS[0].freeDeliveryFrom)}, festival prices a day early, and member prices as your
            delivered orders add up.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <JoinCircleButton />
            <Link href="/gold" className="text-sm text-accent-light underline-offset-4 hover:underline">
              How it works
            </Link>
          </div>
        </>
      )}
    </section>
  );
}

/** Product page, under the price: what Sutra Gold means for this piece. Hidden while a festival price applies. */
export function CircleLine({ price }: { price: number }) {
  const member = useMember();
  const festival = useFestival();
  const loaded = useAuthStore((s) => s.loaded);
  if (festival || !loaded) return null;
  const best = TIERS[TIERS.length - 1];
  return (
    <p className="mt-3 flex gap-2.5 rounded-[10px] border border-accent/30 bg-accent/[0.07] px-3 py-2.5 text-[13px] leading-relaxed text-foreground/75">
      <Sparkles size={15} className="mt-0.5 shrink-0 text-accent-light" aria-hidden="true" />
      <span>
        {!member ? (
          <>
            <b className="font-medium text-accent-light">Sutra Gold</b> members pay from{" "}
            <b className="font-medium text-foreground">{formatPrice(memberPrice(price, best))}</b>, with free delivery.{" "}
            <Link href="/gold" className="text-accent-light underline underline-offset-2">
              Join free
            </Link>
          </>
        ) : member.percentOff ? (
          <>
            <b className="font-medium text-accent-light">
              Your {member.name} price: {formatPrice(memberPrice(price, member))}
            </b>{" "}
            ({member.percentOff}% off, applied at checkout), with free delivery.
          </>
        ) : (
          <>
            <b className="font-medium text-accent-light">Sutra Gold · {member.name}</b>:{" "}
            {price >= member.freeDeliveryFrom
              ? "free delivery on this piece."
              : `free delivery from ${formatPrice(member.freeDeliveryFrom)}.`}{" "}
            Reach {nextTier(member)?.name} for {nextTier(member)?.percentOff}% off.
          </>
        )}
      </span>
    </p>
  );
}

/** Phone Home: a short card above "Shop by budget". Phones only. */
export function CircleHomeCard({ className = "" }: { className?: string }) {
  const circle = useAuthStore((s) => s.circle);
  const tier = findTier(circle?.tier);
  return (
    <section className={`md:hidden ${className}`}>
      <div className="flex flex-col gap-2.5 rounded-xl border border-accent/35 bg-gradient-to-br from-accent/[0.14] to-accent/[0.03] p-3.5">
        <p className="text-[10.5px] uppercase tracking-[0.24em] text-accent">Sutra Gold</p>
        {tier && circle ? (
          <>
            <h2 className="font-hero text-[22px] font-medium leading-tight">You&apos;re a {tier.name} member</h2>
            <Progress spend={circle.spend} tier={tier} />
            <Link href="/gold" className="rounded-[10px] border border-white/15 py-2 text-center text-sm font-medium">
              See your perks
            </Link>
          </>
        ) : (
          <>
            <h2 className="font-hero text-[22px] font-medium leading-tight">Join free, save more</h2>
            <p className="text-[13px] leading-relaxed text-foreground/65">
              Free delivery from {formatPrice(TIERS[0].freeDeliveryFrom)}, festival prices early, member prices as your orders
              add up.
            </p>
            <JoinCircleButton className="rounded-[10px] bg-accent py-2.5 text-sm font-semibold text-[#1a120c] disabled:opacity-60" />
          </>
        )}
      </div>
    </section>
  );
}
