"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { m as motion } from "framer-motion";
import { Boxes, IndianRupee, MessageSquare, Package } from "lucide-react";
import { useAuthStore } from "@/lib/store/auth";
import { useStockStore } from "@/lib/store/stock";
import { useHydrated } from "@/lib/useHydrated";
import { products } from "@/lib/products";
import { formatPrice } from "@/lib/utils";
import { countsAsRevenue } from "@/lib/order";
import { DashboardSkeleton } from "@/components/PageSkeleton";
import { OrdersTab } from "@/components/admin/OrdersTab";
import { CatalogueTab } from "@/components/admin/CatalogueTab";
import { ReviewsTab } from "@/components/admin/ReviewsTab";
import { RevenueChart } from "@/components/admin/RevenueChart";

const TABS = ["Orders", "Catalogue", "Reviews"] as const;
type Tab = (typeof TABS)[number];

export default function AdminPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const orders = useAuthStore((s) => s.orders);
  const reviews = useAuthStore((s) => s.reviews);
  const loaded = useAuthStore((s) => s.loaded);
  const consumed = useStockStore((s) => s.consumed);
  const hydrated = useHydrated();
  const [tab, setTab] = useState<Tab>("Orders");

  useEffect(() => {
    if (!hydrated) return;
    if (!user) {
      if (loaded) router.replace("/login?next=/admin");
    } else if (user.role !== "ADMIN") router.replace("/account");
  }, [hydrated, loaded, user, router]);

  const stats = useMemo(() => {
    const revenue = orders.filter(countsAsRevenue).reduce((sum, o) => sum + o.total, 0);
    const stock = products.reduce((sum, p) => sum + Math.max(0, p.stock - (consumed[p.id] ?? 0)), 0);
    const openOrders = orders.filter((o) => o.status === "Processing" || o.status === "Return Requested").length;
    return { revenue, stock, openOrders };
  }, [orders, consumed]);

  if (!hydrated || user?.role !== "ADMIN" || !loaded) return <DashboardSkeleton />;

  const cards = [
    { icon: Package, label: "Orders", value: String(orders.length), note: stats.openOrders > 0 ? `${stats.openOrders} need attention` : "Nothing outstanding" },
    { icon: IndianRupee, label: "Revenue", value: formatPrice(stats.revenue), note: "Cancellations excluded" },
    { icon: Boxes, label: "Units in stock", value: String(stats.stock), note: `${products.length} pieces listed` },
    { icon: MessageSquare, label: "Reviews", value: String(reviews.length), note: `${reviews.filter((r) => r.orderId).length} from orders` },
  ];

  return (
    <div className="mx-auto max-w-6xl px-6 py-14">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <p className="text-sm uppercase tracking-[0.3em] text-accent">Sutra</p>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl">Admin Panel</h1>
      </motion.div>

      <div className="mt-10 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <div className="grid grid-cols-2 gap-4">
          {cards.map((card, i) => (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.06 * i }}
              className="rounded-2xl border border-white/10 bg-cream-dark/70 p-5 shadow-sm"
            >
              <card.icon size={20} strokeWidth={1.5} className="mb-3 text-accent" />
              <p className="font-display text-2xl text-primary">{card.value}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.15em] text-foreground/50">{card.label}</p>
              <p className="mt-1.5 text-xs text-foreground/45">{card.note}</p>
            </motion.div>
          ))}
        </div>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.24 }}>
          <RevenueChart orders={orders} />
        </motion.div>
      </div>

      <div className="mt-12 flex flex-wrap gap-2 border-b border-white/12">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            aria-current={tab === t ? "true" : undefined}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === t ? "border-primary text-primary" : "border-transparent text-foreground/55 hover:text-primary"
            }`}
          >
            {t}
            {t === "Orders" && orders.length > 0 && <span className="ml-1.5 text-foreground/40">{orders.length}</span>}
          </button>
        ))}
      </div>

      {tab === "Orders" && <OrdersTab orders={orders} />}
      {tab === "Catalogue" && <CatalogueTab consumed={consumed} />}
      {tab === "Reviews" && <ReviewsTab reviews={reviews} />}
    </div>
  );
}
