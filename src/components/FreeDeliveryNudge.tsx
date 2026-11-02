"use client";

import { FREE_SHIPPING_THRESHOLD, SHIPPING_FEE } from "@/lib/shipping";
import { formatPrice } from "@/lib/utils";

/**
 * "Add ₹X more for free delivery" with a thread that fills toward the
 * threshold; "Free delivery unlocked" once the bag clears it. Counts the
 * subtotal before any discount, as checkout does (lib/pricing). Not shown while
 * a festival already makes delivery free.
 */
export function FreeDeliveryNudge({ subtotal, className = "" }: { subtotal: number; className?: string }) {
  if (subtotal <= 0) return null;
  const left = FREE_SHIPPING_THRESHOLD - subtotal;
  const share = Math.min(1, subtotal / FREE_SHIPPING_THRESHOLD);
  return (
    <div className={`text-[13px] ${className}`}>
      <p className={left > 0 ? "text-foreground/75" : "font-medium text-accent-light"}>
        {left > 0 ? (
          <>
            Add <span className="font-medium text-accent-light">{formatPrice(left)}</span> more for free delivery
            <span className="text-foreground/45"> · or {formatPrice(SHIPPING_FEE)} delivery</span>
          </>
        ) : (
          "Free delivery unlocked"
        )}
      </p>
      <div className="mt-2 h-[3px] overflow-hidden rounded-full bg-white/10" aria-hidden="true">
        <div
          className="h-full rounded-full bg-gradient-to-r from-accent to-accent-light transition-[width] duration-500"
          style={{ width: `${Math.round(share * 100)}%` }}
        />
      </div>
    </div>
  );
}
