"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { m as motion } from "framer-motion";
import { CreditCard, IndianRupee, ShoppingBag, Tag, X } from "lucide-react";
import toast from "react-hot-toast";
import { useCartStore } from "@/lib/store/cart";
import { useAuthStore } from "@/lib/store/auth";
import { useStockStore } from "@/lib/store/stock";
import { useHydrated } from "@/lib/useHydrated";
import { formatPrice } from "@/lib/utils";
import type { Order } from "@/lib/order";
import { MandalaMotif } from "@/components/MandalaMotif";
import { PageSkeleton } from "@/components/PageSkeleton";
import { FreeDeliveryNudge } from "@/components/FreeDeliveryNudge";
import { activeFestival } from "@/lib/festival";
import { findCoupon, quote, type Coupon } from "@/lib/pricing";
import { useNow } from "@/lib/useFestival";
import Photo from "@/components/Photo";

const inputClass = "w-full rounded-xl border border-white/12 px-4 py-3 text-sm outline-none transition-colors focus:border-primary";

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const user = useAuthStore((s) => s.user);
  const authLoaded = useAuthStore((s) => s.loaded);
  const addOrder = useAuthStore((s) => s.addOrder);
  const consume = useStockStore((s) => s.consume);
  const hydrated = useHydrated();

  const [paymentMethod, setPaymentMethod] = useState<"cod" | "card">("cod");
  const [placing, setPlacing] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  const form = {
    name: fields.name ?? user?.name ?? "",
    email: fields.email ?? user?.email ?? "",
    phone: fields.phone ?? "",
    address: fields.address ?? "",
    city: fields.city ?? "",
    state: fields.state ?? "",
    pincode: fields.pincode ?? "",
  };

  // A festival offer applies by itself and takes no codes while it runs. The
  // same quote() checks the order again on the server.
  const now = useNow();
  const festival = now === null ? null : activeFestival(now);
  const priced = quote(hydrated ? items : [], festival ? null : (appliedCoupon?.code ?? null), now ?? 0);
  const { subtotal, discount, shipping, total } = priced;
  const couponOk = !festival && !!appliedCoupon && !priced.couponError && discount > 0;

  /*
   * Ordering requires an account. The bag stays open to everyone - asking for a
   * sign-in before someone can even fill it is how you lose the sale - but the
   * order itself has to belong to a customer, or it cannot appear in their
   * history and they have no way to track or return it.
   *
   * Waits for hydration first: the signed-in user is restored from storage on
   * the client, so deciding any earlier bounces a real customer to login.
   */
  // Also waits for the session check (`loaded`): someone signed in with a
  // live cookie but nothing remembered in this browser was bounced to login.
  useEffect(() => {
    if (hydrated && authLoaded && !user) {
      // Says why, so the login page does not appear out of nowhere. The fixed
      // id keeps React's double-invoked effects from stacking two toasts.
      toast("Sign in to place your order.", { icon: "🔒", id: "checkout-signin" });
      router.replace("/login?next=/checkout");
    }
  }, [hydrated, authLoaded, user, router]);

  function updateField(field: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) => setFields((f) => ({ ...f, [field]: e.target.value }));
  }

  function handleApplyCoupon() {
    if (!couponInput.trim()) {
      setCouponError("Enter a code.");
      return;
    }
    const result = quote(items, couponInput, Date.now());
    const coupon = findCoupon(couponInput);
    if (result.couponError || !coupon) {
      setAppliedCoupon(null);
      setCouponError(result.couponError ?? "That code can't be used here.");
      return;
    }
    setAppliedCoupon(coupon);
    setCouponError(null);
    setCouponInput("");
    toast.success(`${coupon.code} applied.`);
  }

  async function handlePlaceOrder(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0 || placing) return;

    // Checked again at the moment of ordering, not only on entry: a session can
    // expire, or be signed out in another tab, while this form sits open.
    if (!user) {
      toast.error("Please sign in to place your order.");
      router.push("/login?next=/checkout");
      return;
    }

    setPlacing(true);

    const order: Order = {
      id: `SUT-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 5).toUpperCase()}`,
      placedAt: new Date().toISOString(),
      items: items.map((i) => ({
        productId: i.productId,
        slug: i.slug,
        name: i.name,
        size: i.size,
        quantity: i.quantity,
        price: i.price,
      })),
      total,
      ...(discount > 0 ? { discount } : {}),
      ...(discount > 0 && priced.offerCode ? { couponCode: priced.offerCode } : {}),
      paymentMethod,
      address: `${form.address}, ${form.city}, ${form.state} ${form.pincode}`,
      status: "Processing",
      email: (user?.email ?? form.email).trim().toLowerCase(),
      // Carried through so the emailed invoice can be addressed properly.
      ...(form.name.trim() ? { customerName: form.name.trim() } : {}),
      ...(form.phone.trim() ? { phone: form.phone.trim() } : {}),
    };

    // Only clear the bag once the order is safely in the database, so a failed
    // save leaves the customer's cart exactly as it was.
    const result = await addOrder(order);
    if (!result.ok) {
      setPlacing(false);
      toast.error(result.error ?? "Could not place your order. Please try again.");
      return;
    }

    consume(items.map((i) => ({ productId: i.productId, quantity: i.quantity })));
    clearCart();
    toast.success(`Order ${order.id} placed. Dhanyavaad!`);
    router.push(`/order/${order.id}`);
  }

  // Held behind the same skeleton as the redirect above, so the form never
  // flashes on screen for someone who is about to be sent to login.
  if (!hydrated || !user) return <PageSkeleton rows={2} />;

  if (items.length === 0 && !placing) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 px-6 text-center">
        <ShoppingBag size={40} strokeWidth={1.2} className="text-foreground/40" />
        <h1 className="font-display text-2xl text-primary">Your bag is empty.</h1>
        <p className="max-w-sm text-sm text-foreground/60">Add a piece to your bag before heading to checkout.</p>
        <Link href="/shop" className="mt-2 rounded-full bg-primary px-6 py-2.5 text-sm text-white transition hover:bg-primary-dark">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <MandalaMotif className="pointer-events-none absolute -left-40 top-20 -z-10 text-primary/5" size={460} duration={60} />
      <div className="mx-auto max-w-6xl px-6 py-14">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <p className="text-sm uppercase tracking-[0.3em] text-accent">Almost Yours</p>
          <h1 className="mt-2 font-display text-3xl sm:text-4xl">Checkout</h1>
        </motion.div>

        <form onSubmit={handlePlaceOrder} className="mt-10 grid gap-10 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <h2 className="font-display text-xl">Delivery Details</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <input required maxLength={120} placeholder="Full name" value={form.name} onChange={updateField("name")} className={`${inputClass} sm:col-span-2`} />
              <input required maxLength={190} type="email" placeholder="Email address" value={user?.email ?? form.email} onChange={updateField("email")} readOnly={!!user} title={user ? "Order emails go to the email you signed in with." : undefined} className={`${inputClass} ${user ? "cursor-default opacity-70" : ""}`} />
              <input required maxLength={20} type="tel" pattern="[-0-9+\s]{10,15}" placeholder="Phone number" value={form.phone} onChange={updateField("phone")} className={inputClass} />
              <input required maxLength={300} placeholder="Street address" value={form.address} onChange={updateField("address")} className={`${inputClass} sm:col-span-2`} />
              <input required maxLength={80} placeholder="City" value={form.city} onChange={updateField("city")} className={inputClass} />
              <input required maxLength={80} placeholder="State" value={form.state} onChange={updateField("state")} className={inputClass} />
              <input required pattern="[0-9]{6}" title="Six-digit PIN code" placeholder="PIN code" value={form.pincode} onChange={updateField("pincode")} className={inputClass} />
            </div>

            <h2 className="mt-10 font-display text-xl">Payment</h2>
            <div className="mt-5 flex flex-col gap-3">
              {[
                { value: "cod" as const, icon: IndianRupee, title: "Cash on Delivery", desc: "Pay when your order arrives at your doorstep.", soon: false },
                // Off until a payment gateway is connected: it took no payment
                // but marked the order as paid by card.
                { value: "card" as const, icon: CreditCard, title: "Card / UPI", desc: "Coming soon. Cash on Delivery for now.", soon: true },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-4 rounded-2xl border p-5 transition ${
                    opt.soon
                      ? "cursor-not-allowed border-white/8 opacity-50"
                      : paymentMethod === opt.value
                        ? "cursor-pointer border-primary bg-primary/5"
                        : "cursor-pointer border-white/12 hover:border-primary/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    disabled={opt.soon}
                    checked={paymentMethod === opt.value}
                    onChange={() => setPaymentMethod(opt.value)}
                    className="mt-1 accent-[var(--color-primary)]"
                  />
                  <opt.icon size={20} className="mt-0.5 text-accent" />
                  <span>
                    <span className="block font-medium">{opt.title}</span>
                    <span className="mt-0.5 block text-sm text-foreground/60">{opt.desc}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <aside id="order-summary" className="lg:col-span-2 max-md:scroll-mt-28">
            <div className="sticky top-24 rounded-3xl border border-white/10 bg-cream-dark/70 p-6 shadow-sm backdrop-blur-sm">
              <h2 className="font-display text-xl">Order Summary</h2>
              <ul className="mt-5 flex flex-col gap-4">
                {items.map((item) => (
                  <li key={`${item.productId}-${item.size}`} className="flex gap-3 border-b border-white/10 pb-4 last:border-0 last:pb-0">
                    <Photo src={item.image} sizes="64px" alt={item.name} className="h-20 w-16 shrink-0 rounded-lg object-cover" />
                    <div className="flex flex-1 flex-col justify-center">
                      <p className="text-sm font-medium leading-tight">{item.name}</p>
                      <p className="text-xs text-foreground/55">Size: {item.size} · Qty {item.quantity}</p>
                      <p className="mt-1 text-sm font-semibold text-primary">{formatPrice(item.price * item.quantity)}</p>
                    </div>
                  </li>
                ))}
              </ul>

              <dl className="mt-6 flex flex-col gap-2 border-t border-white/12 pt-5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-foreground/60">Subtotal</dt>
                  <dd>{formatPrice(subtotal)}</dd>
                </div>
                {discount > 0 && (festival || appliedCoupon) && (
                  <div className="flex justify-between text-primary">
                    <dt className="flex items-center gap-1.5">
                      <Tag size={13} />
                      {festival ? `${festival.name} offer · ${festival.percentOff}% off` : appliedCoupon?.code}
                    </dt>
                    <dd>−{formatPrice(discount)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-foreground/60">Shipping</dt>
                  <dd>{shipping === 0 ? "Free" : formatPrice(shipping)}</dd>
                </div>
                {!festival?.freeShipping && <FreeDeliveryNudge subtotal={subtotal} className="mt-1" />}

                <div className="mt-2 border-t border-white/12 pt-4">
                  {festival ? (
                    // While a festival offer runs it is applied already, so there
                    // is no code box to puzzle over.
                    <p className="flex gap-2 rounded-xl border border-accent/30 bg-accent/[0.07] px-3 py-2.5 text-[13px] leading-relaxed text-foreground/80">
                      <Tag size={14} className="mt-0.5 shrink-0 text-accent-light" aria-hidden="true" />
                      <span>
                        <strong className="font-medium text-accent-light">{festival.name} offer applied.</strong>{" "}
                        {festival.percentOff}% off every piece{festival.freeShipping ? " and free delivery" : ""}, no code
                        needed. Ends on {festival.endsOn}.
                      </span>
                    </p>
                  ) : couponOk && appliedCoupon ? (
                    <div className="flex items-center justify-between gap-3 rounded-xl bg-primary/5 px-3 py-2.5">
                      <span className="flex min-w-0 items-center gap-2 text-sm">
                        <Tag size={14} className="shrink-0 text-primary" />
                        <span className="truncate">
                          <strong className="font-medium">{appliedCoupon.code}</strong>
                          <span className="text-foreground/55"> · {appliedCoupon.description}</span>
                        </span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setAppliedCoupon(null);
                          setCouponError(null);
                        }}
                        className="shrink-0 rounded-full p-1 text-foreground/50 transition hover:bg-white/5 hover:text-primary"
                        aria-label={`Remove coupon ${appliedCoupon.code}`}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => {
                            setCouponInput(e.target.value);
                            setCouponError(null);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleApplyCoupon();
                            }
                          }}
                          placeholder="Discount code"
                          aria-label="Discount code"
                          className="min-w-0 flex-1 rounded-xl border border-white/12 px-3 py-2.5 text-sm uppercase tracking-wider outline-none transition-colors focus:border-primary"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          className="shrink-0 rounded-xl border border-white/15 px-4 text-sm font-medium transition hover:border-primary hover:text-primary"
                        >
                          Apply
                        </button>
                      </div>
                      {couponError && <p className="mt-2 text-xs text-primary">{couponError}</p>}
                    </>
                  )}
                </div>

                <div className="mt-2 flex justify-between border-t border-white/12 pt-3 text-lg">
                  <dt>Total</dt>
                  <dd className="font-display font-semibold text-primary">{formatPrice(total)}</dd>
                </div>
              </dl>

              <button
                type="submit"
                disabled={placing}
                className="btn-shimmer relative mt-6 w-full overflow-hidden rounded-full bg-primary py-3.5 font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
              >
                {placing ? "Placing order…" : "Place Order"}
              </button>
              <p className="mt-3 text-center text-xs text-foreground/45">7-day hassle-free returns on all unworn pieces.</p>
            </div>
          </aside>

          {/* Phones: the total and Place Order stay at the bottom of the
              screen while the form scrolls, as on Flipkart. */}
          <div aria-hidden="true" className="h-[calc(3rem+env(safe-area-inset-bottom))] md:hidden" />
          <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-cream/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_-18px_rgba(0,0,0,0.9)] backdrop-blur-xl md:hidden print:hidden">
            <div className="flex h-16 items-center justify-between gap-3 px-4">
              <button
                type="button"
                onClick={() => document.getElementById("order-summary")?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="text-left"
              >
                <span className="block text-lg font-semibold leading-tight">{formatPrice(total)}</span>
                <span className="text-[11.5px] text-accent-light">View price details</span>
              </button>
              <button
                type="submit"
                disabled={placing}
                className="rounded-lg bg-accent-light px-7 py-3 text-[15px] font-semibold text-[#1a1416] active:bg-accent disabled:opacity-60"
              >
                {placing ? "Placing…" : "Place Order"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
