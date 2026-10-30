import { useSyncExternalStore } from "react";

/** Below Tailwind's md breakpoint: the phone layout. */
const QUERY = "(max-width: 767.98px)";

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

/**
 * True on phone-width screens. False during server rendering and on tablets
 * and desktop, so anything keyed off it leaves the larger layouts as they are.
 */
export function usePhone(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false
  );
}
