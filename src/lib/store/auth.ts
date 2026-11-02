import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Order, OrderStatus } from "@/lib/order";
import type { Review } from "@/lib/review";
import { stopGoogleAutoSignIn } from "@/lib/google";
import { switchWishlistOwner } from "@/lib/store/wishlist";

export type { Review };

export interface User {
  name: string;
  email: string;
  role: "USER" | "ADMIN";
}

type Result = { ok: true } | { ok: false; error: string };

interface AuthState {
  /** The signed-in session. This is the only slice kept in localStorage. */
  user: User | null;
  /** Server-backed caches, refilled from Postgres by `hydrate()`. */
  orders: Order[];
  reviews: Review[];
  loaded: boolean;
  loading: boolean;

  hydrate: (force?: boolean) => Promise<void>;
  signIn: (email: string, password: string) => Promise<Result>;
  /** Signs in with the ID token from "Continue with Google" or One Tap. */
  signInWithGoogle: (credential: string) => Promise<Result>;
  signUp: (name: string, email: string, password: string, phone?: string, captcha?: string) => Promise<Result>;
  signOut: () => void;
  addOrder: (order: Order) => Promise<Result>;
  setOrderStatus: (orderId: string, status: OrderStatus) => Promise<Order | null>;
  ordersFor: (email: string | undefined) => Order[];
  addReview: (review: Review) => Promise<Result>;
  reviewsFor: (productId: string) => Review[];
  resetPassword: (challenge: string, code: string, password: string) => Promise<Result>;
}

const NETWORK_ERROR = "Could not reach the server. Check your connection and try again.";

/*
 * A forced refresh requested while another refresh is in flight. Harmless when
 * orders were global to the shop; not now that they depend on who is signed in.
 * Signing in straight after the page loads would otherwise have its refresh
 * swallowed by the still-running signed-out one, leaving the new user looking
 * at an empty order history until the next reload.
 */
let refreshQueued = false;

/*
 * Bumped whenever the signed-in user changes here. A refresh that started under
 * an older generation has an out-of-date answer about who is signed in and
 * whose orders to show - most dangerously, a page-load refresh that began signed
 * out and lands just after a successful sign-in would sign the new user
 * straight back out. Such a refresh keeps its reviews and discards the rest.
 */
let authGeneration = 0;

async function postJson(url: string, body: unknown): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await res.json().catch(() => null)) as Record<string, unknown> | null;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      orders: [],
      reviews: [],
      loaded: false,
      loading: false,

      hydrate: async (force = false) => {
        const { loaded, loading } = get();
        if (loading) {
          if (force) refreshQueued = true;
          return;
        }
        if (loaded && !force) return;
        set({ loading: true });
        const generation = authGeneration;
        try {
          const [sessionRes, ordersRes, reviewsRes] = await Promise.all([
            fetch("/api/auth/session", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
            fetch("/api/orders", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
            fetch("/api/reviews", { cache: "no-store" }).then((r) => r.json()).catch(() => null),
          ]);
          const reviews = reviewsRes?.ok ? (reviewsRes.reviews as Review[]) : get().reviews;

          if (generation !== authGeneration) {
            // Someone signed in or out mid-flight; this answer is about the
            // previous user. A sign-in queued its own refresh behind us, so
            // leave `loaded` for that one; a sign-out did not, so settle here.
            set({ reviews, ...(refreshQueued ? {} : { loaded: true }) });
          } else {
            set({
              // The server is the authority on who is signed in. A user
              // remembered in this browser with no live session behind it -
              // from before sessions existed, or an expired cookie - is signed
              // out here rather than shown as signed in while every request
              // fails. A failed check (sessionRes null) changes nothing: being
              // offline is not the same as signing out.
              ...(sessionRes?.ok ? { user: (sessionRes.user as User | null) ?? null } : {}),
              orders: ordersRes?.ok ? (ordersRes.orders as Order[]) : get().orders,
              reviews,
              loaded: true,
            });
          }
        } finally {
          set({ loading: false });
          if (refreshQueued) {
            refreshQueued = false;
            void get().hydrate(true);
          }
        }
      },

      signIn: async (email, password) => {
        const data = await postJson("/api/auth/login", { email, password });
        if (!data) return { ok: false, error: NETWORK_ERROR };
        if (!data.ok) return { ok: false, error: String(data.error ?? "Could not sign you in.") };
        authGeneration++;
        set({ user: data.user as User });
        // Orders depend on who is signed in, so reload them for this user.
        void get().hydrate(true);
        return { ok: true };
      },

      signInWithGoogle: async (credential) => {
        const data = await postJson("/api/auth/google", { credential });
        if (!data) return { ok: false, error: NETWORK_ERROR };
        if (!data.ok) return { ok: false, error: String(data.error ?? "Google sign-in failed.") };
        authGeneration++;
        set({ user: data.user as User });
        void get().hydrate(true);
        return { ok: true };
      },

      signUp: async (name, email, password, phone, captcha) => {
        const data = await postJson("/api/auth/signup", { name, email, password, phone, captcha });
        if (!data) return { ok: false, error: NETWORK_ERROR };
        if (!data.ok) {
          return { ok: false, error: String(data.error ?? "Could not create your account.") };
        }
        authGeneration++;
        set({ user: data.user as User });
        void get().hydrate(true);
        return { ok: true };
      },

      signOut: () => {
        // Clears the server's cookie too - dropping only this copy would leave
        // the session alive for the next person at a shared computer. Orders go
        // with it, so they are not left on screen for whoever signs in next.
        authGeneration++;
        void fetch("/api/auth/logout", { method: "POST" }).catch(() => undefined);
        // Otherwise One Tap would sign a Google customer straight back in.
        stopGoogleAutoSignIn();
        set({ user: null, orders: [] });
      },

      addOrder: async (order) => {
        const data = await postJson("/api/orders", { order });
        if (!data) return { ok: false, error: NETWORK_ERROR };
        if (!data.ok) return { ok: false, error: String(data.error ?? "Could not save your order.") };
        const saved = (data.order as Order) ?? order;
        set((state) => ({ orders: [saved, ...state.orders] }));
        return { ok: true };
      },

      setOrderStatus: async (orderId, status) => {
        let data: Record<string, unknown> | null = null;
        try {
          const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status }),
          });
          data = (await res.json().catch(() => null)) as Record<string, unknown> | null;
        } catch {
          return null;
        }
        if (!data?.ok) return null;
        const updated = data.order as Order;
        set((state) => ({ orders: state.orders.map((o) => (o.id === orderId ? updated : o)) }));
        return updated;
      },

      ordersFor: (email) => {
        if (!email) return [];
        const normalized = email.trim().toLowerCase();
        return get().orders.filter((o) => o.email === normalized);
      },

      addReview: async (review) => {
        const data = await postJson("/api/reviews", { review });
        if (!data) return { ok: false, error: NETWORK_ERROR };
        if (!data.ok) {
          return { ok: false, error: String(data.error ?? "Could not save your review.") };
        }
        const saved = (data.review as Review) ?? review;
        set((state) => ({ reviews: [saved, ...state.reviews.filter((r) => r.id !== saved.id)] }));
        return { ok: true };
      },

      reviewsFor: (productId) => get().reviews.filter((r) => r.productId === productId),

      resetPassword: async (challenge, code, password) => {
        const data = await postJson("/api/auth/reset-password", { challenge, code, password });
        if (!data) return { ok: false, error: NETWORK_ERROR };
        if (!data.ok) {
          return { ok: false, error: String(data.error ?? "Could not reset your password.") };
        }
        return { ok: true };
      },
    }),
    {
      name: "sutra-auth",
      version: 4,
      // Accounts, orders and reviews live in Postgres now; only the session is local.
      partialize: (state) => ({ user: state.user }),
      migrate: (persisted) => {
        const state = (persisted ?? {}) as { user?: User | null };
        return { user: state.user ?? null };
      },
    }
  )
);

// Each account keeps its own wishlist on a shared device (see wishlist.ts).
if (typeof window !== "undefined") {
  useAuthStore.subscribe((state, prev) => {
    const email = state.user?.email?.trim().toLowerCase() ?? null;
    if (email !== (prev.user?.email?.trim().toLowerCase() ?? null)) switchWishlistOwner(email);
  });
}
