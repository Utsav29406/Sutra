"use client";

import { usePathname, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuthStore } from "@/lib/store/auth";

/**
 * Gate for the things that only make sense when the shop knows who you are -
 * a wishlist needs an owner, a review needs an author.
 *
 * Browsing, the cart and checkout stay open on purpose: asking someone to
 * register before they can see prices or fill a basket is the reliable way to
 * lose the sale.
 *
 * Sends people to /login rather than /signup, because most of them already have
 * an account, and carries ?next= so they come back to the page they were on
 * instead of being dropped on the homepage.
 *
 * This is a matter of experience, not security - it runs entirely in the
 * browser. Anything that must actually be protected has to be checked on the
 * server.
 */
export function useRequireAccount(): (purpose: string) => boolean {
  const user = useAuthStore((s) => s.user);
  const router = useRouter();
  const pathname = usePathname();

  return (purpose: string) => {
    if (user) return true;
    toast(`Sign in to ${purpose}.`, { icon: "🔒" });
    router.push(`/login?next=${encodeURIComponent(pathname)}`);
    return false;
  };
}
