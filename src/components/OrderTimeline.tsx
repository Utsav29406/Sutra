import { Check, CircleX, PackageCheck, Truck } from "lucide-react";
import { journeyIndex, type Order } from "@/lib/order";

const STEPS: Array<Order["status"]> = ["Processing", "Shipped", "Delivered"];
const STEP_ICONS = [PackageCheck, Truck, Check];
const STEP_NOTES: Record<string, string> = {
  Processing: "Your order is with the workshop.",
  Shipped: "On its way to you.",
  Delivered: "Delivered.",
};

function formatShortDate(iso: string | undefined) {
  return iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : null;
}

export function OrderTimeline({ order }: { order: Order }) {
  const activeIndex = journeyIndex(order.status);

  if (activeIndex === -1) {
    return (
      <div className="flex items-start gap-3 rounded-xl bg-black/[0.04] px-4 py-3">
        <CircleX size={18} className="mt-0.5 shrink-0 text-foreground/45" />
        <div>
          <p className="text-sm font-medium">{order.status}</p>
          <p className="text-xs text-foreground/55">
            {order.status === "Cancelled"
              ? "This order was cancelled and nothing was charged."
              : "This order has been sent back."}
            {formatShortDate(order.updatedAt) && ` · ${formatShortDate(order.updatedAt)}`}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ol className="flex items-start">
        {STEPS.map((step, i) => {
          const reached = i <= activeIndex;
          const Icon = STEP_ICONS[i];
          const isLast = i === STEPS.length - 1;
          return (
            <li key={step} className="relative flex flex-1 flex-col items-center">
              {!isLast && (
                <span
                  aria-hidden="true"
                  className={`absolute left-1/2 top-4 h-0.5 w-full ${i < activeIndex ? "bg-primary" : "bg-black/10"}`}
                />
              )}
              <span
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
                  reached ? "border-primary bg-primary text-white" : "border-white/15 bg-cream text-foreground/35"
                }`}
              >
                <Icon size={15} strokeWidth={2} />
              </span>
              <span className={`mt-2 text-center text-xs font-medium ${reached ? "text-primary" : "text-foreground/40"}`}>
                {step}
              </span>
              {i === activeIndex && (
                <span className="mt-0.5 px-1 text-center text-[11px] leading-tight text-foreground/50">
                  {STEP_NOTES[step]}
                  {formatShortDate(order.updatedAt) && i > 0 && <> · {formatShortDate(order.updatedAt)}</>}
                </span>
              )}
            </li>
          );
        })}
      </ol>
      {order.status === "Return Requested" && (
        <p className="mt-4 rounded-xl bg-orange-50 px-4 py-2.5 text-xs text-orange-800">
          You&#39;ve asked to return this order. The shop will be in touch to arrange collection.
        </p>
      )}
    </div>
  );
}
