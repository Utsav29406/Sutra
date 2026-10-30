"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronDown, MapPin, Package, Search } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/lib/store/auth";
import { useStockStore } from "@/lib/store/stock";
import { formatPrice } from "@/lib/utils";
import { nextStatuses, restoresStock, STATUS_STYLES, type Order, type OrderStatus } from "@/lib/order";
import { offerLabel } from "@/lib/festival";

const FILTERS: Array<"All" | OrderStatus> = [
  "All",
  "Processing",
  "Shipped",
  "Delivered",
  "Return Requested",
  "Cancelled",
  "Returned",
];

export function OrdersTab({ orders }: { orders: Order[] }) {
  const setOrderStatus = useAuthStore((s) => s.setOrderStatus);
  const release = useStockStore((s) => s.release);
  const [filter, setFilter] = useState<"All" | OrderStatus>("All");
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      const matchesFilter = filter === "All" || o.status === filter;
      const matchesQuery =
        !q || `${o.id} ${o.email} ${o.address} ${o.items.map((i) => i.name).join(" ")}`.toLowerCase().includes(q);
      return matchesFilter && matchesQuery;
    });
  }, [orders, filter, query]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { All: orders.length };
    for (const o of orders) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [orders]);

  if (orders.length === 0) {
    return (
      <div className="mt-6 flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/12 py-20 text-center">
        <Package size={36} strokeWidth={1.2} className="text-foreground/40" />
        <p className="font-medium">No orders yet.</p>
        <p className="max-w-sm text-sm text-foreground/60">
          Every order placed on the shop lands here, guest checkouts included.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[14rem] flex-1">
          <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/35" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by order id, customer or piece"
            aria-label="Search orders"
            className="w-full rounded-full border border-white/12 py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-primary"
          />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const count = counts[f] ?? 0;
          if (f !== "All" && count === 0) return null;
          return (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-medium transition ${
                filter === f ? "bg-primary text-white" : "border border-white/12 text-foreground/65 hover:border-primary hover:text-primary"
              }`}
            >
              {f} <span className={filter === f ? "opacity-70" : "text-foreground/40"}>{count}</span>
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 text-sm text-foreground/55">No orders match that.</p>
      ) : (
        <ul className="mt-5 flex flex-col gap-3">
          {filtered.map((order) => {
            const isOpen = expanded === order.id;
            const upcoming = nextStatuses(order);
            const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
            return (
              <li key={order.id} className="overflow-hidden rounded-2xl border border-white/10 bg-cream-dark/70 shadow-sm">
                <button
                  onClick={() => setExpanded(isOpen ? null : order.id)}
                  aria-expanded={isOpen}
                  className="flex w-full flex-wrap items-center justify-between gap-3 px-5 py-4 text-left transition hover:bg-black/[0.02]"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-medium">{order.id}</p>
                    <p className="mt-0.5 truncate text-xs text-foreground/55">
                      {order.email || "Guest"} ·{" "}
                      {new Date(order.placedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} ·{" "}
                      {itemCount} item{itemCount === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{formatPrice(order.total)}</span>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_STYLES[order.status] ?? "bg-white/5"}`}>
                      {order.status}
                    </span>
                    <ChevronDown size={16} className={`text-foreground/40 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-white/10 px-5 py-5">
                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-[0.15em] text-foreground/45">Deliver to</p>
                        {(order.customerName || order.phone) && (
                          <p className="mt-1.5 text-sm font-medium text-foreground/85">
                            {order.customerName}
                            {order.customerName && order.phone ? " · " : ""}
                            {order.phone && (
                              <a href={`tel:${order.phone}`} className="text-primary underline-offset-4 hover:underline">
                                {order.phone}
                              </a>
                            )}
                          </p>
                        )}
                        <p className="mt-1.5 flex items-start gap-2 text-sm text-foreground/75">
                          <MapPin size={14} className="mt-0.5 shrink-0 text-accent" />
                          <span className="whitespace-pre-line">{order.address}</span>
                        </p>
                        <p className="mt-2 text-sm text-foreground/60">{order.email || "No email on file"}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.15em] text-foreground/45">Payment</p>
                        <p className="mt-1.5 text-sm">{order.paymentMethod === "cod" ? "Cash on Delivery" : "Card / UPI"}</p>
                        {order.couponCode && (
                          <p className="mt-1 text-xs text-primary">
                            {offerLabel(order.couponCode)} · −{formatPrice(order.discount ?? 0)}
                          </p>
                        )}
                      </div>
                    </div>

                    <ul className="mt-5 flex flex-col gap-1.5 border-t border-white/10 pt-4 text-sm">
                      {order.items.map((item) => (
                        <li key={`${item.productId}-${item.size}`} className="flex justify-between gap-4">
                          <span>
                            {item.slug ? (
                              <Link href={`/product/${item.slug}`} className="transition-colors hover:text-primary">
                                {item.name}
                              </Link>
                            ) : (
                              item.name
                            )}
                            <span className="text-foreground/45"> · {item.size} × {item.quantity}</span>
                          </span>
                          <span>{formatPrice(item.price * item.quantity)}</span>
                        </li>
                      ))}
                    </ul>

                    <div className="mt-4 flex justify-between border-t border-white/10 pt-4 text-sm font-medium">
                      <span>Total</span>
                      <span className="text-primary">{formatPrice(order.total)}</span>
                    </div>

                    {upcoming.length > 0 ? (
                      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
                        <span className="text-xs text-foreground/50">Mark as</span>
                        {upcoming.map((status) => (
                          <button
                            key={status}
                            onClick={async () => {
                              if (busy) return;
                              setBusy(order.id);
                              const updated = await setOrderStatus(order.id, status);
                              setBusy(null);
                              if (!updated) {
                                toast.error(`Could not update ${order.id}. Please try again.`);
                                return;
                              }
                              if (restoresStock(status)) {
                                release(order.items.map((i) => ({ productId: i.productId, quantity: i.quantity })));
                              }
                              toast.success(`${order.id} marked ${status}.`);
                            }}
                            disabled={busy === order.id}
                            className={`rounded-full px-4 py-2 text-xs font-medium transition disabled:opacity-60 ${
                              status === "Cancelled"
                                ? "border border-white/15 text-foreground/70 hover:border-primary hover:text-primary"
                                : "bg-primary text-white hover:bg-primary-dark"
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-5 border-t border-white/10 pt-4 text-xs text-foreground/45">
                        This order is closed — nothing further to do.
                      </p>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
