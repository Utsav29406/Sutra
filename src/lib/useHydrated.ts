import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/** True only after client hydration, so persisted (localStorage-backed) store state never mismatches the server render. */
export function useHydrated(): boolean {
  return useSyncExternalStore(subscribe, () => true, () => false);
}
