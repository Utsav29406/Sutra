"use client";

import { useEffect, useRef, type PointerEvent, type ReactNode } from "react";
import toast, { resolveValue, useToaster, type Toast } from "react-hot-toast";
import Photo from "@/components/Photo";
import { useCartStore } from "@/lib/store/cart";

/*
 * The site's notifications: react-hot-toast keeps the queue and the timers
 * (every toast.success / toast.error / toast() call works unchanged), this
 * draws them.
 *
 * Each one is a solid raised card just under the sticky header, so it never
 * covers the header, the phone tab bar, the chat button or the product page's
 * buy bar: full width on phones, top right on larger screens. A gold thread
 * along the bottom runs out with its time; hovering pauses them all, the ×
 * closes one, and on a phone a sideways swipe does too. Three at most, newest
 * on top.
 */

const MAX_SHOWN = 3;

const DURATIONS = {
  success: { duration: 3500 },
  blank: { duration: 4000 },
  error: { duration: 5000 },
};

export function Notifications() {
  const { toasts, handlers } = useToaster(DURATIONS);
  const { startPause, endPause } = handlers;

  // Newest first. Past the first three, older ones are closed; closed ones
  // stay a moment longer while they fade and fold away.
  const shown = toasts.filter((t) => t.visible).slice(0, MAX_SHOWN);
  useEffect(() => {
    toasts.filter((t) => t.visible).slice(MAX_SHOWN).forEach((t) => toast.dismiss(t.id));
  }, [toasts]);
  const list = toasts.filter((t) => !t.visible || shown.includes(t));

  return (
    <div
      onMouseEnter={startPause}
      onMouseLeave={endPause}
      className="sutra-toasts pointer-events-none fixed right-6 top-[calc(var(--sutra-header-h,4rem)+0.75rem)] z-[10001] flex w-[360px] flex-col transition-[top] duration-300 print:hidden max-md:inset-x-2.5 max-md:top-[calc(var(--sutra-header-h,6.5rem)+0.5rem)] max-md:w-auto"
    >
      {list.map((t) => (
        <ToastCard key={t.id} t={t} />
      ))}
    </div>
  );
}

function ToastCard({ t }: { t: Toast }) {
  const card = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; dx: number } | null>(null);
  const message = resolveValue(t.message, t);
  const timed = t.type !== "loading" && Number.isFinite(t.duration);

  // Sideways swipe to close, for touch; a mouse uses the ×.
  const onDown = (e: PointerEvent) => {
    if (e.pointerType === "mouse" || (e.target as HTMLElement).closest("button")) return;
    drag.current = { x: e.clientX, dx: 0 };
    card.current?.setPointerCapture(e.pointerId);
  };
  const onMove = (e: PointerEvent) => {
    const el = card.current;
    if (!drag.current || !el) return;
    drag.current.dx = e.clientX - drag.current.x;
    el.style.transition = "none";
    el.style.transform = `translateX(${drag.current.dx}px)`;
    el.style.opacity = String(Math.max(0, 1 - Math.abs(drag.current.dx) / 220));
  };
  const onUp = () => {
    const el = card.current;
    if (!drag.current || !el) return;
    const { dx } = drag.current;
    drag.current = null;
    el.style.transition = "transform 0.2s ease, opacity 0.2s ease";
    if (Math.abs(dx) > 70) {
      el.style.transform = `translateX(${dx > 0 ? 120 : -120}%)`;
      el.style.opacity = "0";
      toast.dismiss(t.id);
    } else {
      el.style.transform = "";
      el.style.opacity = "";
    }
  };

  const error = t.type === "error";
  return (
    // The slot collapses as the card leaves, so the ones below slide up.
    <div className={`sutra-toast-slot ${t.visible ? "" : "is-leaving"}`}>
      <div className="min-h-0">
        <div
          ref={card}
          {...t.ariaProps}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          className={`sutra-toast pointer-events-auto relative grid touch-pan-y select-none grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 overflow-hidden rounded-[14px] border bg-cream-dark/[0.97] py-[11px] pl-3 pr-2.5 shadow-[0_18px_36px_-14px_rgba(0,0,0,0.75),0_0_0_1px_rgba(0,0,0,0.35)] backdrop-blur-md ${
            error ? "border-primary/45" : "border-accent-light/30"
          }`}
        >
          <Lead t={t} />
          <div className="min-w-0 text-[13.5px] font-medium leading-snug text-foreground">
            {typeof message === "string" ? <p>{message}</p> : message}
          </div>
          <button
            type="button"
            onClick={() => toast.dismiss(t.id)}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-full text-foreground/50 transition-colors hover:bg-white/5 hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-light"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
          {timed && (
            <span
              key={t.createdAt}
              aria-hidden="true"
              className={`sutra-toast-thread absolute bottom-0 left-3 right-3 h-[2px] origin-left rounded-full ${
                error ? "bg-gradient-to-r from-primary-dark to-primary" : "bg-gradient-to-r from-accent to-accent-light"
              }`}
              style={{ animationDuration: `${t.duration}ms` }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

/* Icons for the emoji the calls pass in (toast(…, { icon: "🔒" })), drawn to match. */
const DRAWN: Record<string, ReactNode> = {
  "🔒": (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <rect x="5" y="11" width="14" height="9" rx="2" />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" />
    </svg>
  ),
  "♥": (
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" />
    </svg>
  ),
};

const CHECK = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </svg>
);
const BANG = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
    <path d="M12 6v8" />
    <path d="M12 18.5v.01" />
  </svg>
);

function Lead({ t }: { t: Toast }) {
  // A photo (or anything else that isn't a plain emoji) stands on its own.
  if (t.icon && typeof t.icon !== "string") return <>{t.icon}</>;

  const chip = "grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full [&_svg]:h-[17px] [&_svg]:w-[17px]";
  if (t.type === "loading") {
    return (
      <span className={chip} aria-hidden="true">
        <span className="h-[18px] w-[18px] animate-spin rounded-full border-2 border-accent-light/25 border-t-accent-light motion-reduce:[animation-duration:2.4s]" />
      </span>
    );
  }
  if (t.type === "error") {
    return (
      <span className={`${chip} bg-primary/15 text-[#e07a7a] ring-1 ring-inset ring-primary/50`} aria-hidden="true">
        {BANG}
      </span>
    );
  }
  const icon = typeof t.icon === "string" ? (DRAWN[t.icon] ?? <span className="text-base">{t.icon}</span>) : null;
  if (t.type === "blank") {
    return (
      <span className={`${chip} bg-white/[0.07] text-foreground ring-1 ring-inset ring-white/20`} aria-hidden="true">
        {icon ?? DRAWN["🔒"]}
      </span>
    );
  }
  return (
    <span className={`${chip} bg-accent-light/[0.14] text-accent-light ring-1 ring-inset ring-accent-light/40`} aria-hidden="true">
      {icon ?? CHECK}
    </span>
  );
}

/**
 * "Added to your bag", with the piece's photo and name and a View bag button
 * that opens the bag. Adding the same piece again refreshes the one card.
 */
export function toastAddedToBag(name: string, image: string) {
  toast.success(
    <div className="flex min-w-0 items-center gap-2.5">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p>Added to your bag</p>
        <p className="truncate text-xs font-normal text-foreground/60">{name}</p>
      </div>
      <button
        type="button"
        onClick={() => {
          // All of them, so none sits over the bag as it opens.
          toast.dismiss();
          useCartStore.getState().openCart();
        }}
        className="shrink-0 whitespace-nowrap rounded-full border border-accent-light/40 px-3 py-1.5 text-xs font-medium text-accent-light transition-colors hover:bg-accent-light/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent-light"
      >
        View bag
      </button>
    </div>,
    {
      id: `bag:${name}`,
      icon: (
        <span className="block h-11 w-[34px] shrink-0 overflow-hidden rounded-md border border-accent-light/35 bg-cream">
          <Photo src={image} sizes="34px" alt="" className="h-full w-full object-cover" />
        </span>
      ),
    }
  );
}
