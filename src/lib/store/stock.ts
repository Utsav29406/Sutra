import { create } from "zustand";
import { useCartStore } from "@/lib/store/cart";

/*
 * Live stock from the server (api/stock), where every order takes stock and
 * every cancel or return gives it back. Until it arrives, and if it can't be
 * read, pages fall back to the catalogue's figure; the server checks stock
 * again when the order is placed either way. Not saved in the browser: a
 * stale copy is exactly what this replaced.
 */
interface StockState {
  live: Record<string, number> | null;
  /** Reads stock from the server; on success the bag's limits follow it. */
  load: () => Promise<void>;
}

export const useStockStore = create<StockState>()((set) => ({
  live: null,
  load: async () => {
    try {
      const res = await fetch("/api/stock", { cache: "no-store" });
      const data = await res.json();
      if (!data?.ok || !data.stock) return;
      set({ live: data.stock as Record<string, number> });
      useCartStore.getState().applyStock(data.stock);
    } catch {
      // Keep what we have; the server still checks at checkout.
    }
  },
}));
