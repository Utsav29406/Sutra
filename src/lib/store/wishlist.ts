import { create } from "zustand";
import { persist } from "zustand/middleware";

interface WishlistState {
  saved: Record<string, string>;
  /** Toggles the product id and returns whether it is now saved. */
  toggle: (productId: string) => boolean;
  remove: (productId: string) => void;
  has: (productId: string) => boolean;
  count: () => number;
  clear: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      saved: {},
      toggle: (productId) => {
        const saved = { ...get().saved };
        const wasSaved = productId in saved;
        if (wasSaved) delete saved[productId];
        else saved[productId] = new Date().toISOString();
        set({ saved });
        return !wasSaved;
      },
      remove: (productId) =>
        set((state) => {
          const saved = { ...state.saved };
          delete saved[productId];
          return { saved };
        }),
      has: (productId) => productId in get().saved,
      count: () => Object.keys(get().saved).length,
      clear: () => set({ saved: {} }),
    }),
    { name: "sutra-wishlist" }
  )
);

/*
 * The wishlist is kept per account on this device. It used to be one list per
 * browser, so whoever signed in next on a shared phone or laptop saw (and
 * added to) the previous person's saved pieces. When the signed-in account
 * changes, the outgoing list is put aside under that account's email and the
 * incoming account's own list, if it has one here, is brought back.
 */
const OWNER_KEY = "sutra-wishlist-owner";
const stashKey = (email: string) => `sutra-wishlist:${email}`;

export function switchWishlistOwner(email: string | null): void {
  try {
    const owner = localStorage.getItem(OWNER_KEY);
    if (owner === email) return;
    const store = useWishlistStore.getState();
    if (owner) localStorage.setItem(stashKey(owner), JSON.stringify(store.saved));
    let next: Record<string, string> = {};
    if (email) {
      const raw = localStorage.getItem(stashKey(email));
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && typeof parsed === "object") next = parsed;
      // Someone signing in for the first time here keeps what they saved
      // while signed out of an account that never had a list on this device.
      else if (!owner) next = store.saved;
      localStorage.setItem(OWNER_KEY, email);
    } else {
      localStorage.removeItem(OWNER_KEY);
    }
    useWishlistStore.setState({ saved: next });
  } catch {
    // Storage blocked (private mode): the list just stays as it is.
  }
}
