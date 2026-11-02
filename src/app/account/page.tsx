"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { m as motion } from "framer-motion";
import { Package, ShieldCheck } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";
import { useHydrated } from "@/lib/useHydrated";
import { formatPrice } from "@/lib/utils";
import { STATUS_STYLES } from "@/lib/order";
import { MandalaMotif } from "@/components/MandalaMotif";
import { PageSkeleton } from "@/components/PageSkeleton";
import { OrderTimeline } from "@/components/OrderTimeline";
import { OrderActions } from "@/components/OrderActions";
import { offerLabel } from "@/lib/festival";

export default function AccountPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const orders = useAuthStore((s) => s.orders);
  const signOut = useAuthStore((s) => s.signOut);
  const loaded = useAuthStore((s) => s.loaded);
  const hydrated = useHydrated();

  // Set while signing out from this page, so the "signed out, go to login"
  // redirect below doesn't override the trip home (it used to win).
  const signingOut = useRef(false);

  // Also waits for the session check (`loaded`): someone signed in with a
  // live cookie but nothing remembered in this browser was bounced to login.
  useEffect(() => {
    if (hydrated && loaded && !user && !signingOut.current) router.replace("/login?next=/account");
  }, [hydrated, loaded, user, router]);

  if (!hydrated || !user || !loaded) return <PageSkeleton rows={2} />;

  const email = user.email.trim().toLowerCase();
  const myOrders = orders.filter((o) => o.email === email);

  return (
    <div className="relative overflow-hidden">
      <MandalaMotif className="pointer-events-none absolute -right-32 -top-24 -z-10 text-primary/5" size={420} duration={50} />
      <div className="mx-auto max-w-5xl px-6 py-14">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-wrap items-end justify-between gap-4"
        >
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-accent">My Account</p>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl">Namaste, {user.name.split(" ")[0]}</h1>
            <p className="mt-1 text-sm text-foreground/60">{user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            {user.role === "ADMIN" && (
              <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                <ShieldCheck size={14} />
                Admin
              </span>
            )}
            {/* Phones have no header account menu, so the way in is here. */}
            {user.role === "ADMIN" && (
              <Link href="/admin" className="rounded-full border border-accent/40 px-4 py-2 text-sm text-accent-light md:hidden">
                Admin Panel
              </Link>
            )}
            <button
              onClick={() => {
                signingOut.current = true;
                router.replace("/");
                signOut();
              }}
              className="rounded-full border border-white/12 px-5 py-2 text-sm transition hover:border-primary hover:text-primary"
            >
              Sign Out
            </button>
          </div>
        </motion.div>

        <h2 className="mt-12 font-display text-2xl">Order History</h2>

        {myOrders.length === 0 ? (
          <div className="mt-6 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/12 py-20 text-center">
            <Package size={36} strokeWidth={1.2} className="text-foreground/40" />
            <p className="font-medium">No orders yet.</p>
            <p className="max-w-sm text-sm text-foreground/60">
              When you place an order it will show up here with its status.
            </p>
            <Link href="/shop" className="mt-2 rounded-full bg-primary px-5 py-2 text-sm text-white transition hover:bg-primary-dark">
              Start Shopping
            </Link>
          </div>
        ) : (
          <ul className="mt-6 flex flex-col gap-4">
            {myOrders.map((order, i) => (
              <motion.li
                key={order.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.06 * i }}
                className="rounded-2xl border border-white/10 bg-cream-dark/70 p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <Link href={`/order/${order.id}`} className="font-medium transition-colors hover:text-primary">
                      Order {order.id}
                    </Link>
                    <p className="text-sm text-foreground/55">
                      {new Date(order.placedAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} ·{" "}
                      {order.paymentMethod === "cod" ? "Cash on Delivery" : "Card Payment"}
                    </p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[order.status] ?? "bg-white/5"}`}>
                    {order.status}
                  </span>
                </div>

                <div className="mt-5 border-t border-white/10 pt-5">
                  <OrderTimeline order={order} />
                </div>

                <ul className="mt-5 flex flex-col gap-1.5 border-t border-white/10 pt-4 text-sm text-foreground/70">
                  {order.items.map((item) => (
                    <li key={`${item.name}-${item.size}`} className="flex justify-between gap-4">
                      <span>
                        {item.name}
                        <span className="text-foreground/45"> · {item.size} × {item.quantity}</span>
                      </span>
                      <span>{formatPrice(item.price * item.quantity)}</span>
                    </li>
                  ))}
                </ul>

                {order.discount ? (
                  <div className="mt-3 flex justify-between text-sm text-primary">
                    <span>Discount{order.couponCode ? ` · ${offerLabel(order.couponCode)}` : ""}</span>
                    <span>−{formatPrice(order.discount)}</span>
                  </div>
                ) : null}

                <div className="mt-4 flex justify-between border-t border-white/10 pt-4 font-medium">
                  <span>Total</span>
                  <span className="text-primary">{formatPrice(order.total)}</span>
                </div>

                <OrderActions order={order} />
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
