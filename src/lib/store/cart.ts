import { create } from "zustand";
import { persist } from "zustand/middleware";
import { products } from "@/lib/products";

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  image: string;
  price: number;
  size: string;
  quantity: number;
  stock: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  /** Returns false when the item is already at (or would exceed) available stock. */
  addItem: (item: Omit<CartItem, "quantity"> & { quantity: number }) => boolean;
  updateQuantity: (productId: string, size: string, quantity: number) => void;
  removeItem: (productId: string, size: string) => void;
  clearCart: () => void;
  subtotal: () => number;
  count: () => number;
}

/** Same cap the server applies to one line of an order. */
export const MAX_PER_LINE = 10;

/**
 * Brings saved bag lines up to date with the catalogue. A bag kept in the
 * browser held the price it was added at, so after a price change every
 * checkout was refused ("prices have changed") with nothing on screen that
 * could fix it. Runs on every load, not just on a storage version bump.
 */
function refreshItems(items: CartItem[] | undefined): CartItem[] {
  return (items ?? []).flatMap((item) => {
    const product = products.find((p) => p.id === item?.productId);
    if (!product || !product.sizes.includes(item.size)) return [];
    const stock = Math.min(product.stock, MAX_PER_LINE);
    if (stock <= 0) return [];
    return [
      {
        ...item,
        name: product.name,
        slug: product.slug,
        image: product.images[0],
        price: product.price,
        stock,
        quantity: Math.max(1, Math.min(Math.floor(Number(item.quantity) || 1), stock)),
      },
    ];
  });
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      addItem: (item) => {
        const state = get();
        const existing = state.items.find(
          (i) => i.productId === item.productId && i.size === item.size
        );
        const stock = Math.max(0, Math.min(item.stock, MAX_PER_LINE));
        const currentQty = existing?.quantity ?? 0;
        if (currentQty >= stock) return false;
        const nextQty = Math.min(currentQty + item.quantity, stock);
        set({
          items: existing
            ? state.items.map((i) =>
                i.productId === item.productId && i.size === item.size
                  ? { ...i, quantity: nextQty, stock }
                  : i
              )
            : [...state.items, { ...item, stock, quantity: nextQty }],
        });
        return true;
      },
      updateQuantity: (productId, size, quantity) =>
        set((state) => ({
          items:
            quantity <= 0
              ? state.items.filter((i) => i.productId !== productId || i.size !== size)
              : state.items.map((i) =>
                  i.productId === productId && i.size === size
                    ? { ...i, quantity: Math.min(quantity, i.stock) }
                    : i
                ),
        })),
      removeItem: (productId, size) =>
        set((state) => ({
          items: state.items.filter((i) => i.productId !== productId || i.size !== size),
        })),
      clearCart: () => set({ items: [] }),
      subtotal: () => get().items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      count: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: "sutra-cart",
      partialize: (state) => ({ items: state.items }),
      version: 1,
      migrate: (persisted) => ({ items: refreshItems((persisted as Partial<CartState> | undefined)?.items) }),
      merge: (persisted, current) => ({
        ...current,
        items: refreshItems((persisted as Partial<CartState> | undefined)?.items),
      }),
    }
  )
);
