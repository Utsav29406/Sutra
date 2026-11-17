"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/store/auth";
import { useCartStore } from "@/lib/store/cart";
import { useWishlistStore } from "@/lib/store/wishlist";
import { useRecentlyViewedStore } from "@/lib/store/recentlyViewed";
import { useStockStore } from "@/lib/store/stock";

/*
 * Each store is saved in localStorage, but an open tab only reads it when it
 * loads. With two tabs open, the one that wrote last won: adding a piece in
 * one tab, then another in an older tab, threw the first piece out of the bag.
 * Signing out in one tab left the other showing the account. The browser tells
 * every other tab when a key changes, so each re-reads its copy then.
 */
const SYNCED = {
  "sutra-cart": () => useCartStore.persist.rehydrate(),
  "sutra-wishlist": () => useWishlistStore.persist.rehydrate(),
  "sutra-recently-viewed": () => useRecentlyViewedStore.persist.rehydrate(),
} as const;

/**
 * Pulls orders and reviews out of Postgres once per page load. Mounted in the root
 * layout so every route has the shared caches filled without each one asking.
 * Also keeps the bag, wishlist and sign-in in step across open tabs.
 */
export default function DataBootstrap() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
    void useStockStore.getState().load();
    // The old per-browser stock counts, no longer used.
    try {
      localStorage.removeItem("sutra-stock");
    } catch {}
  }, [hydrate]);

  useEffect(() => {
    const onStorage = async (e: StorageEvent) => {
      if (e.storageArea !== localStorage || !e.key) return;
      if (e.key in SYNCED) {
        await SYNCED[e.key as keyof typeof SYNCED]();
      } else if (e.key === "sutra-auth") {
        // Signed in or out in another tab: take the new account, then load
        // its orders and membership (or clear them).
        const before = useAuthStore.getState().user?.email;
        await useAuthStore.persist.rehydrate();
        if (useAuthStore.getState().user?.email !== before) void useAuthStore.getState().hydrate(true);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return null;
}
