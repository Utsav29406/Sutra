import { create } from "zustand";
import { persist } from "zustand/middleware";

interface RecentlyViewedState {
  ids: string[];
  record: (productId: string) => void;
  clear: () => void;
}

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set, get) => ({
      ids: [],
      record: (productId) => {
        const { ids } = get();
        if (ids[0] === productId) return;
        const rest = ids.filter((id) => id !== productId);
        set({ ids: [productId, ...rest].slice(0, 8) });
      },
      clear: () => set({ ids: [] }),
    }),
    { name: "sutra-recently-viewed" }
  )
);
