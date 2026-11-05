import { useEffect, useState } from "react";
import { useHydrated } from "@/lib/useHydrated";
import { activeFestival, DAY_MS, type Festival } from "@/lib/festival";
import { findTier, type Tier } from "@/lib/circle";
import { useAuthStore } from "@/lib/store/auth";

/**
 * The time, refreshed every `everyMs`, or null before hydration. Pages are
 * prerendered at build time, so the date has to be read in the browser; the
 * refresh lets a page left open switch an offer off at midnight by itself.
 */
export function useNow(everyMs = 60_000): number | null {
  const hydrated = useHydrated();
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    setNow(Date.now());
    const timer = window.setInterval(() => setNow(Date.now()), everyMs);
    return () => window.clearInterval(timer);
  }, [everyMs]);
  return hydrated ? now : null;
}

/** The signed-in shopper's Sutra Gold level, or null. */
export function useMember(): Tier | null {
  const signedIn = useAuthStore((s) => !!s.user);
  const tier = useAuthStore((s) => s.circle?.tier);
  return signedIn ? findTier(tier) : null;
}

/**
 * The festival offer running now for this shopper, or null (also before
 * hydration). Sutra Gold members see it from their early-access day.
 */
export function useFestival(): Festival | null {
  const now = useNow();
  const member = useMember();
  return now === null ? null : activeFestival(now, member ? member.earlyDays * DAY_MS : 0);
}
