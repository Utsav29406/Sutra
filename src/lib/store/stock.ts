import { create } from "zustand";
import { persist } from "zustand/middleware";
import { products } from "@/lib/products";

interface StockItem {
  productId: string;
  quantity: number;
}

interface StockState {
  consumed: Record<string, number>;
  consume: (items: StockItem[]) => void;
  release: (items: StockItem[]) => void;
  available: (productId: string) => number;
  totalAvailable: () => number;
  reset: () => void;
}

const stockById = new Map(products.map((p) => [p.id, p.stock]));

export const useStockStore = create<StockState>()(
  persist(
    (set, get) => ({
      consumed: {},
      consume: (items) =>
        set((state) => {
          const consumed = { ...state.consumed };
          for (const { productId, quantity } of items) {
            consumed[productId] = (consumed[productId] ?? 0) + quantity;
          }
          return { consumed };
        }),
      release: (items) =>
        set((state) => {
          const consumed = { ...state.consumed };
          for (const { productId, quantity } of items) {
            const remaining = (consumed[productId] ?? 0) - quantity;
            if (remaining > 0) consumed[productId] = remaining;
            else delete consumed[productId];
          }
          return { consumed };
        }),
      available: (productId) =>
        Math.max(0, (stockById.get(productId) ?? 0) - (get().consumed[productId] ?? 0)),
      totalAvailable: () => {
        const consumed = get().consumed;
        return products.reduce(
          (sum, p) => sum + Math.max(0, p.stock - (consumed[p.id] ?? 0)),
          0
        );
      },
      reset: () => set({ consumed: {} }),
    }),
    { name: "sutra-stock" }
  )
);
