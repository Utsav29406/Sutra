import { findTier, type Tier } from "@/lib/circle";
import { useAuthStore } from "@/lib/store/auth";

/** The signed-in shopper's Sutra Gold level, or null. */
export function useMember(): Tier | null {
  const signedIn = useAuthStore((s) => !!s.user);
  const tier = useAuthStore((s) => s.circle?.tier);
  return signedIn ? findTier(tier) : null;
}
