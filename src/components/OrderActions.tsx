"use client";

import { useState } from "react";
import { Ban, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/lib/store/auth";
import { useStockStore } from "@/lib/store/stock";
import { canCancel, canRequestReturn, returnDaysLeft, RETURN_WINDOW_DAYS, type Order } from "@/lib/order";

export function OrderActions({ order }: { order: Order }) {
  const setOrderStatus = useAuthStore((s) => s.setOrderStatus);
  const release = useStockStore((s) => s.release);
  const [confirming, setConfirming] = useState<"cancel" | "return" | null>(null);
  const [busy, setBusy] = useState(false);

  const cancellable = canCancel(order);
  const returnable = canRequestReturn(order);
  const daysLeft = returnDaysLeft(order);

  if (!cancellable && !returnable) {
    if (order.status === "Delivered" && daysLeft === 0) {
      return (
        <p className="mt-4 text-xs text-foreground/45">
          The {RETURN_WINDOW_DAYS}-day return window for this order has closed.
        </p>
      );
    }
    return null;
  }

  return (
    <div className="mt-5 border-t border-white/10 pt-4 print:hidden">
      {confirming === null ? (
        <div className="flex flex-wrap items-center gap-3">
          {cancellable && (
            <button
              onClick={() => setConfirming("cancel")}
              className="flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-xs font-medium transition hover:border-primary hover:text-primary"
            >
              <Ban size={13} />
              Cancel order
            </button>
          )}
          {returnable && (
            <button
              onClick={() => setConfirming("return")}
              className="flex items-center gap-1.5 rounded-full border border-white/15 px-4 py-2 text-xs font-medium transition hover:border-primary hover:text-primary"
            >
              <RotateCcw size={13} />
              Request a return
            </button>
          )}
          {returnable && daysLeft !== null && (
            <span className="text-xs text-foreground/45">
              {daysLeft} {daysLeft === 1 ? "day" : "days"} left to return.
            </span>
          )}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs text-foreground/70">
            {confirming === "cancel"
              ? "Cancel this order? The pieces go back on the shelf."
              : `Request a return for this order? You have ${daysLeft} ${daysLeft === 1 ? "day" : "days"} left.`}
          </p>
          <button
            onClick={async () => {
              if (busy) return;
              setBusy(true);
              const cancelling = confirming === "cancel";
              const updated = await setOrderStatus(
                order.id,
                cancelling ? "Cancelled" : "Return Requested"
              );
              setBusy(false);
              if (!updated) {
                toast.error("Could not update that order. Please try again.");
                return;
              }
              if (cancelling) {
                release(order.items.map((i) => ({ productId: i.productId, quantity: i.quantity })));
                setConfirming(null);
                toast.success("Order cancelled. Nothing has been charged.");
              } else {
                setConfirming(null);
                toast.success("Return requested. The shop will be in touch.");
              }
            }}
            disabled={busy}
            className="rounded-full bg-primary px-4 py-2 text-xs font-medium text-white transition hover:bg-primary-dark disabled:opacity-60"
          >
            Yes, {confirming === "cancel" ? "cancel it" : "request it"}
          </button>
          <button
            onClick={() => setConfirming(null)}
            className="rounded-full px-3 py-2 text-xs text-foreground/60 transition hover:text-primary"
          >
            Keep it
          </button>
        </div>
      )}
    </div>
  );
}
