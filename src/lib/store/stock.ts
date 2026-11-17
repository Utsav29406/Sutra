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
  /** Admin: add (+) or remove (-) units of a piece. */
  adjust: (productId: string, change: number) => Promise<{ ok: true; stock: number } | { ok: false; error: string }>;
}

export const useStockStore = create<StockState>()((set, get) => ({
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
  adjust: async (productId, change) => {
    let data: { ok?: boolean; stock?: number; error?: string } | null = null;
    try {
      const res = await fetch("/api/stock", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, change }),
      });
      data = await res.json().catch(() => null);
    } catch {
      return { ok: false, error: "Could not reach the server. Check your connection and try again." };
    }
    if (typeof data?.stock === "number") {
      const live = { ...(get().live ?? {}), [productId]: data.stock };
      set({ live });
      useCartStore.getState().applyStock(live);
    }
    if (!data?.ok || typeof data.stock !== "number") return { ok: false, error: data?.error ?? "Could not change stock." };
    return { ok: true, stock: data.stock };
  },
}));
