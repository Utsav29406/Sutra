"use client";

import Link from "next/link";
import { use } from "react";
import { m as motion } from "framer-motion";
import { CheckCircle2, Package, Printer, Truck } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";
import { useHydrated } from "@/lib/useHydrated";
import { formatPrice } from "@/lib/utils";
import { STATUS_STYLES } from "@/lib/order";
import { MandalaMotif } from "@/components/MandalaMotif";
import { PageSkeleton } from "@/components/PageSkeleton";
import { OrderTimeline } from "@/components/OrderTimeline";
import { OrderActions } from "@/components/OrderActions";
import { OrderFeedback } from "@/components/OrderFeedback";
import { offerLabel } from "@/lib/festival";

export default function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const orders = useAuthStore((s) => s.orders);
  const loaded = useAuthStore((s) => s.loaded);
  const hydrated = useHydrated();

  if (!hydrated || !loaded) return <PageSkeleton rows={2} />;

  const order = orders.find((o) => o.id === id);

  if (!order) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <Package size={40} strokeWidth={1.2} className="text-foreground/40" />
        <h1 className="font-display text-2xl text-primary">We can&#39;t find that order.</h1>
        <p className="max-w-sm text-sm text-foreground/60">
          Check the order number — nothing under that reference is on file.
        </p>
        <Link href="/shop" className="mt-2 rounded-full bg-primary px-6 py-2.5 text-sm text-white transition hover:bg-primary-dark">
          Continue Shopping
        </Link>
      </div>
    );
  }

  const placedAt = new Date(order.placedAt);
  const expectedBy = new Date(placedAt.getTime() + 432e6);
  const dateFormat: Intl.DateTimeFormatOptions = { day: "numeric", month: "long" };

  return (
    <div className="relative overflow-hidden">
      <MandalaMotif className="pointer-events-none absolute -right-28 -top-20 -z-10 text-primary/5" size={400} duration={55} />
      <div className="mx-auto max-w-3xl px-6 py-14">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="text-center">
          <CheckCircle2 size={44} strokeWidth={1.3} className="mx-auto text-primary" />
          <h1 className="mt-4 font-display text-3xl sm:text-4xl">Dhanyavaad!</h1>
          <p className="mt-2 text-foreground/65">Your order is placed and the weavers have been told.</p>
          <p className="mt-2 text-xs leading-relaxed text-foreground/45">
            If not received in your inbox, check your{" "}
            <span className="font-medium text-foreground/70">spam</span> folder.
          </p>
          <p className="mt-4 inline-block rounded-full bg-primary/10 px-4 py-1.5 font-mono text-sm tracking-wider text-primary">
            {order.id}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-10 rounded-2xl border border-white/10 bg-cream-dark/70 p-6 shadow-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-5">
            <h2 className="font-display text-lg">Tracking</h2>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[order.status] ?? "bg-white/5"}`}>
              {order.status}
            </span>
          </div>
          <div className="py-6">
            <OrderTimeline order={order} />
          </div>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-y border-white/10 py-5 text-sm">
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-foreground/45">Placed</p>
              <p className="mt-0.5 font-medium">{placedAt.toLocaleDateString("en-IN", dateFormat)}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.15em] text-foreground/45">Payment</p>
              <p className="mt-0.5 font-medium">{order.paymentMethod === "cod" ? "Cash on Delivery" : "Card / UPI"}</p>
            </div>
            <div className="flex items-center gap-2">
              <Truck size={16} className="text-accent" />
              <div>
                <p className="text-xs uppercase tracking-[0.15em] text-foreground/45">Expected by</p>
                <p className="mt-0.5 font-medium">{expectedBy.toLocaleDateString("en-IN", dateFormat)}</p>
              </div>
            </div>
          </div>

          <ul className="flex flex-col gap-2 py-5 text-sm">
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
            <div className="flex justify-between border-t border-white/10 pt-4 text-sm text-primary">
              <span>Discount{order.couponCode ? ` · ${offerLabel(order.couponCode)}` : ""}</span>
              <span>−{formatPrice(order.discount)}</span>
            </div>
          ) : null}

          <div className={`flex justify-between text-lg ${order.discount ? "mt-3" : "border-t border-white/10 pt-4"}`}>
            <span>Total</span>
            <span className="font-display font-semibold text-primary">{formatPrice(order.total)}</span>
          </div>

          <div className="mt-5 border-t border-white/10 pt-4">
            <p className="text-xs uppercase tracking-[0.15em] text-foreground/45">Delivering to</p>
            <p className="mt-1 text-sm text-foreground/75">{order.address}</p>
          </div>

          <OrderActions order={order} />
        </motion.div>

        {/* Asked only once the parcel has arrived: on a just-placed order one
            tap posted five-star reviews for pieces nobody had seen yet. */}
        {(order.status === "Delivered" || order.status === "Return Requested" || order.status === "Returned") && (
          <div className="print:hidden">
            <OrderFeedback order={order} />
          </div>
        )}

        <div className="mt-8 flex flex-wrap justify-center gap-3 print:hidden">
          <Link href="/account" className="rounded-full bg-primary px-6 py-3 text-sm font-medium text-white transition hover:bg-primary-dark">
            View My Orders
          </Link>
          <Link href="/shop" className="rounded-full border border-white/15 px-6 py-3 text-sm font-medium transition hover:border-primary hover:text-primary">
            Continue Shopping
          </Link>
          <a
            href={`/api/orders/${encodeURIComponent(order.id)}/invoice`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full border border-white/15 px-6 py-3 text-sm font-medium transition hover:border-primary hover:text-primary"
          >
            <Printer size={15} />
            View invoice
          </a>
        </div>
      </div>
    </div>
  );
}
