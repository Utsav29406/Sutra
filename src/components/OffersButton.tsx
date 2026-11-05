"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, m as motion } from "framer-motion";
import { Check, Copy, Sparkles, Tag, Truck } from "lucide-react";
import { useHydrated } from "@/lib/useHydrated";
import { isLive, offers } from "@/lib/offers";
import { useFestival, useMember, useNow } from "@/lib/useFestival";
import { freeDeliveryFrom } from "@/lib/pricing";
import { nextTier, TIERS } from "@/lib/circle";
import { formatPrice } from "@/lib/utils";

/*
 * The "Offers" button: what saves this shopper money today, in one place. It
 * appears only while a festival offer is on (the owner's call, 2026-11-05), and
 * shows the festival price (checkout takes no codes then, see lib/pricing),
 * then free delivery and Sutra Gold for whoever is signed in. The code list
 * below is kept for when the button should also show outside festivals: drop
 * the `if (!festival)` early return to bring that back.
 */

function CodeRow({ code, headline, fine }: { code: string; headline: string; fine?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Clipboard can be blocked; the code is on screen either way.
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }
  return (
    <li className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{headline}</p>
        {fine && <p className="text-xs text-foreground/55">{fine}</p>}
      </div>
      <button
        type="button"
        onClick={copy}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-dashed border-accent/50 px-2 py-1 font-mono text-xs tracking-wider text-accent-light transition hover:bg-accent/10"
        aria-label={copied ? `${code} copied` : `Copy code ${code}`}
      >
        {code}
        {copied ? <Check size={12} aria-hidden="true" /> : <Copy size={12} aria-hidden="true" />}
      </button>
    </li>
  );
}

/**
 * `floating`: the laptop and desktop version, a button pinned to the bottom-left
 * corner (opposite the chat button) whose panel opens upward. It moved out of
 * the header so the search box keeps its width. Phones keep the small icon in
 * the header, where search has a row of its own.
 */
export default function OffersButton({ className = "", floating = false }: { className?: string; floating?: boolean }) {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const now = useNow();
  const festival = useFestival();
  const member = useMember();
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  // Same closing rules as the account menu: page change, a tap elsewhere, Escape.
  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const codes = now === null ? [] : offers.filter((o) => o.code && isLive(o, new Date(now)));
  const deliveryFrom = festival?.freeShipping ? 0 : freeDeliveryFrom(member);
  const next = member ? nextTier(member) : null;
  const best = TIERS[TIERS.length - 1];

  // Shown only while a festival offer runs (Diwali until Bhai Dooj; any
  // festival added to lib/festival.ts brings it back for its dates). The
  // standing codes stay on the home page's offers strip.
  if (!festival) return null;

  return (
    <div ref={box} className={`${floating ? "fixed bottom-7 left-3 z-40" : "relative shrink-0"} ${className}`}>
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        whileTap={{ scale: 0.96 }}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label="Offers"
        title="Offers"
        className={`sutra-offerpill ${floating ? "is-floating" : ""} ${hydrated ? "" : "opacity-0"}`}
      >
        <Tag size={14} aria-hidden="true" />
        <span className={floating ? "" : "max-[1439px]:hidden"}>Offers</span>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Offers today"
            initial={{ opacity: 0, y: floating ? 8 : -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: floating ? 8 : -8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-50 flex w-[22rem] flex-col gap-4 overflow-y-auto rounded-2xl border border-white/10 bg-cream-dark p-4 shadow-2xl ${
              floating
                ? "bottom-full left-0 mb-3 max-h-[calc(100dvh-7rem)] origin-bottom-left"
                : "right-0 mt-2 origin-top-right max-md:fixed max-md:inset-x-3 max-md:top-[calc(var(--sutra-header-h,64px)+6px)] max-md:mt-0 max-md:w-auto"
            }`}
          >
            <p className="text-[11px] uppercase tracking-[0.28em] text-accent">Offers today</p>

            {festival ? (
              <Link
                href="/festival"
                onClick={() => setOpen(false)}
                className="flex flex-col gap-1 rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 p-3.5 ring-1 ring-primary/40 transition hover:ring-primary/70"
              >
                <span className="font-display text-xl">
                  {festival.name} · {festival.percentOff}% off
                </span>
                <span className="text-sm text-foreground/75">
                  Every piece, no code needed. Till {festival.endsOn}.
                </span>
                <span className="mt-1 text-sm font-medium text-accent-light">Shop the {festival.name} store →</span>
              </Link>
            ) : codes.length > 0 ? (
              <ul className="flex flex-col gap-2">
                {codes.map((o) => (
                  <CodeRow key={o.code} code={o.code!} headline={o.headline} fine={o.fine} />
                ))}
              </ul>
            ) : null}
            {festival && codes.length > 0 && (
              <p className="-mt-2 text-xs text-foreground/50">Discount codes come back after {festival.name}.</p>
            )}

            <p className="flex items-start gap-2.5 text-sm text-foreground/75">
              <Truck size={16} className="mt-0.5 shrink-0 text-accent-light" aria-hidden="true" />
              {deliveryFrom === 0 ? (
                <span>
                  <b className="font-medium text-foreground">Free delivery</b> on every order
                  {festival?.freeShipping ? ` till ${festival.endsOn}` : ""}.
                </span>
              ) : (
                <span>
                  <b className="font-medium text-foreground">Free delivery</b> on orders from {formatPrice(deliveryFrom)}.
                </span>
              )}
            </p>

            <div className="flex items-start gap-2.5 rounded-xl border border-accent/30 bg-accent/[0.07] p-3 text-sm text-foreground/75">
              <Sparkles size={16} className="mt-0.5 shrink-0 text-accent-light" aria-hidden="true" />
              <span>
                {!member ? (
                  <>
                    <b className="font-medium text-accent-light">Sutra Gold</b>: join free for member prices up to{" "}
                    {best.percentOff}% off and festival prices early.
                  </>
                ) : member.percentOff ? (
                  <>
                    <b className="font-medium text-accent-light">Your {member.name} price</b>: {member.percentOff}% off every
                    piece{festival ? ` after ${festival.name}` : ""}, applied at checkout.
                  </>
                ) : (
                  <>
                    <b className="font-medium text-accent-light">Sutra Gold · {member.name}</b>: reach {next?.name} with{" "}
                    {formatPrice(next?.minSpend ?? 0)} of delivered orders for {next?.percentOff}% off.
                  </>
                )}{" "}
                <Link
                  href="/gold"
                  onClick={() => setOpen(false)}
                  className="whitespace-nowrap text-accent-light underline underline-offset-2"
                >
                  {member ? "See levels" : "Join free"}
                </Link>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
