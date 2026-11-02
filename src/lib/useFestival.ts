import { useEffect, useState } from "react";
import { useHydrated } from "@/lib/useHydrated";
import { activeFestival, type Festival } from "@/lib/festival";

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

/** The festival offer running now, or null (also before hydration). */
export function useFestival(): Festival | null {
  const now = useNow();
  return now === null ? null : activeFestival(now);
}
