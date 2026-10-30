"use client";

import { useMemo } from "react";
import { formatPrice } from "@/lib/utils";
import { countsAsRevenue, type Order } from "@/lib/order";

const WINDOW_DAYS = 14;

export function RevenueChart({ orders }: { orders: Order[] }) {
  const days = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bars = Array.from({ length: WINDOW_DAYS }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (WINDOW_DAYS - 1 - i));
      return { date, total: 0 };
    });
    const startMs = bars[0].date.getTime();
    for (const order of orders) {
      if (!countsAsRevenue(order)) continue;
      const placed = new Date(order.placedAt);
      placed.setHours(0, 0, 0, 0);
      const dayIndex = Math.round((placed.getTime() - startMs) / 864e5);
      if (dayIndex >= 0 && dayIndex < WINDOW_DAYS) bars[dayIndex].total += order.total;
    }
    return bars;
  }, [orders]);

  const max = Math.max(...days.map((d) => d.total), 1);
  const windowTotal = days.reduce((sum, d) => sum + d.total, 0);

  return (
    <div className="rounded-2xl border border-white/10 bg-cream-dark/70 p-5 shadow-sm">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs uppercase tracking-[0.15em] text-foreground/50">Last {WINDOW_DAYS} days</p>
          <p className="mt-1 font-display text-2xl text-primary">{formatPrice(windowTotal)}</p>
        </div>
        {windowTotal === 0 && <p className="text-xs text-foreground/45">No orders in this window.</p>}
      </div>
      <div className="mt-5 flex h-24 items-end gap-1.5">
        {days.map((day) => {
          const height = day.total === 0 ? 2 : Math.max(6, (day.total / max) * 100);
          const label = day.date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
          return (
            <div key={day.date.toISOString()} className="group relative flex flex-1 items-end" style={{ height: "100%" }}>
              <div
                className={`w-full rounded-t transition-colors ${day.total > 0 ? "bg-primary/70 group-hover:bg-primary" : "bg-black/10"}`}
                style={{ height: `${height}%` }}
              />
              <span className="absolute inset-0" title={`${label} · ${formatPrice(day.total)}`} />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-[10px] uppercase tracking-wider text-foreground/40">
        <span>{days[0].date.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
        <span>Today</span>
      </div>
    </div>
  );
}
