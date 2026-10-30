"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { AnimatePresence, m as motion } from "framer-motion";
import { Minus, Plus, ShoppingBag, X } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { formatPrice } from "@/lib/utils";
import { quote } from "@/lib/pricing";
import { useFestival } from "@/lib/useFestival";
import Photo from "@/components/Photo";
import { FreeDeliveryNudge } from "@/components/FreeDeliveryNudge";

export default function CartDrawer() {
  const items = useCartStore((s) => s.items);
  const isOpen = useCartStore((s) => s.isOpen);
  const closeCart = useCartStore((s) => s.closeCart);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const subtotal = useCartStore((s) => s.subtotal);
  const festival = useFestival();
  const festivalQuote = festival ? quote(items, null) : null;
  const panel = useRef<HTMLElement>(null);

  // A dialog for keyboards too: Escape closes it, focus moves in and stays in
  // while it's open, the page behind stops scrolling, and focus goes back to
  // whatever opened it (the bag button) afterwards.
  useEffect(() => {
    if (!isOpen) return;
    const opener = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusables = () =>
      [...(panel.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])') ?? [])];
    requestAnimationFrame(() => focusables()[0]?.focus());
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeCart();
      } else if (e.key === "Tab") {
        const list = focusables();
        if (!list.length) return;
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (!panel.current?.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      opener?.focus?.();
    };
  }, [isOpen, closeCart]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
          />
          <motion.aside
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby="bag-title"
            className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col bg-cream shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 300 }}
          >
            <div className="flex items-center justify-between border-b border-white/12 px-6 py-5">
              <h2 id="bag-title" className="font-display text-xl text-primary">Your Bag</h2>
              <button
                onClick={closeCart}
                className="rounded-full p-2 transition hover:bg-white/5"
                aria-label="Close cart"
              >
                <X size={20} />
              </button>
            </div>

            <div className="scrollbar-thin flex-1 overflow-y-auto px-6 py-4 max-md:overscroll-contain">
              {items.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex h-full flex-col items-center justify-center gap-3 text-center text-foreground/60"
                >
                  <ShoppingBag size={40} strokeWidth={1.2} />
                  <p>Your bag is empty.</p>
                  <Link
                    href="/shop"
                    onClick={closeCart}
                    className="mt-2 rounded-full bg-primary px-5 py-2 text-sm text-white transition hover:bg-primary-dark"
                  >
                    Continue Shopping
                  </Link>
                </motion.div>
              ) : (
                <ul className="flex flex-col gap-4">
                  <AnimatePresence initial={false}>
                    {items.map((item) => (
                      <motion.li
                        key={`${item.productId}-${item.size}`}
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, x: 40 }}
                        transition={{ duration: 0.25 }}
                        className="flex gap-3 overflow-hidden border-b border-white/10 pb-4"
                      >
                        <Photo
                          src={item.image}
                          sizes="80px"
                          alt={item.name}
                          className="h-24 w-20 shrink-0 rounded-lg object-cover"
                        />
                        <div className="flex flex-1 flex-col justify-between">
                          <div>
                            <p className="font-medium leading-tight">{item.name}</p>
                            <p className="text-sm text-foreground/60">Size: {item.size}</p>
                            {item.quantity >= item.stock && (
                              <p className="text-xs text-accent">All {item.stock} in stock</p>
                            )}
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 rounded-full border border-white/12 px-2 py-1">
                              <button
                                onClick={() => updateQuantity(item.productId, item.size, item.quantity - 1)}
                                className="rounded-full p-1 hover:bg-white/5"
                                aria-label="Decrease quantity"
                              >
                                <Minus size={14} />
                              </button>
                              <span className="w-4 text-center text-sm">{item.quantity}</span>
                              <button
                                onClick={() => updateQuantity(item.productId, item.size, item.quantity + 1)}
                                disabled={item.quantity >= item.stock}
                                title={item.quantity >= item.stock ? `Only ${item.stock} in stock` : undefined}
                                className="rounded-full p-1 hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-35"
                                aria-label="Increase quantity"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                            <span className="text-sm font-semibold text-primary">
                              {formatPrice(item.price * item.quantity)}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => removeItem(item.productId, item.size)}
                          className="self-start rounded-full p-1 text-foreground/40 hover:bg-white/5 hover:text-primary"
                          aria-label="Remove item"
                        >
                          <X size={16} />
                        </button>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <div className="border-t border-white/12 px-6 py-5">
                <div className="mb-4 flex items-center justify-between text-lg">
                  <span>Subtotal</span>
                  <motion.span
                    key={subtotal()}
                    initial={{ scale: 1.15 }}
                    animate={{ scale: 1 }}
                    className="font-display font-semibold text-primary"
                  >
                    {formatPrice(subtotal())}
                  </motion.span>
                </div>
                {!festival?.freeShipping && <FreeDeliveryNudge subtotal={subtotal()} className="-mt-1 mb-4" />}
                {festival && festivalQuote && festivalQuote.discount > 0 && (
                  <div className="-mt-1 mb-4 flex flex-col gap-1 rounded-xl border border-accent/30 bg-accent/[0.07] px-3.5 py-2.5 text-sm">
                    <p className="flex justify-between text-accent-light">
                      <span>
                        {festival.name} offer · {festival.percentOff}% off
                      </span>
                      <span>−{formatPrice(festivalQuote.discount)}</span>
                    </p>
                    <p className="flex justify-between text-foreground/70">
                      <span>You pay{festival.freeShipping ? ", delivery free" : ""}</span>
                      <span className="font-medium text-foreground">{formatPrice(festivalQuote.total)}</span>
                    </p>
                  </div>
                )}
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="block w-full rounded-full bg-primary py-3 text-center font-medium text-white transition hover:bg-primary-dark"
                >
                  Proceed to Checkout
                </Link>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
