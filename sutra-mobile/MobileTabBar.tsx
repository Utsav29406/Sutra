"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Search, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { useHydrated } from "@/lib/useHydrated";

/**
 * Phones only: the app-style tab bar along the bottom of the screen, as on
 * Flipkart. It takes over from the header's links and bag, which phones no
 * longer show there; wishlist and account stay at the top right. Hidden from md up, so tablets and desktop are
 * untouched.
 *
 * Product pages and checkout have their own bar in this spot (Add to Bag /
 * Buy Now, Place Order), so the tabs step aside there.
 */
export const MOBILE_BAR_HIDDEN = (pathname: string) =>
  pathname.startsWith("/product/") || pathname.startsWith("/checkout") || pathname.startsWith("/admin");

/** Fired by the Search tab; the header opens or closes its phone search row. */
export const PHONE_SEARCH_EVENT = "sutra:phone-search";

export default function MobileTabBar() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const openCart = useCartStore((s) => s.openCart);
  const cartCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));

  if (MOBILE_BAR_HIDDEN(pathname)) return null;

  const tabs = [
    { href: "/", label: "Home", icon: Home, active: pathname === "/" },
    { href: "/shop", label: "Shop", icon: LayoutGrid, active: pathname.startsWith("/shop") },
  ];

  return (
    <>
      {/* Keeps the footer's last lines clear of the fixed bar. */}
      <div aria-hidden="true" className="h-[calc(4.6rem+env(safe-area-inset-bottom))] md:hidden print:hidden" />
      {/* Floats like the navbar: a gold-edged pill held clear of the screen's edges. */}
      <nav
        aria-label="Main"
        className="fixed inset-x-2.5 bottom-[calc(0.5rem+env(safe-area-inset-bottom))] z-40 rounded-[24px] border border-accent-light/55 bg-cream/95 shadow-[0_0_0_1px_rgb(212_175_55/0.12),0_10px_34px_-10px_rgb(212_175_55/0.28)] backdrop-blur-xl md:hidden print:hidden"
      >
        <ul className="sutra-tabs grid h-[3.6rem] grid-cols-4">
          {tabs.map((tab) => (
            <Tab key={tab.href} {...tab} />
          ))}
          <li>
            <button
              type="button"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
                window.dispatchEvent(new Event(PHONE_SEARCH_EVENT));
              }}
              className="relative flex h-full w-full flex-col items-center justify-center gap-0.5 text-[10.5px] font-medium text-foreground/65 transition-colors active:text-primary"
            >
              <Search size={21} strokeWidth={1.7} aria-hidden="true" />
              Search
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={openCart}
              className="relative flex h-full w-full flex-col items-center justify-center gap-0.5 text-[10.5px] font-medium text-foreground/65 transition-colors active:text-primary"
              aria-label={hydrated && cartCount > 0 ? `Bag, ${cartCount} items` : "Bag"}
            >
              <span className="relative">
                <ShoppingBag size={21} strokeWidth={1.7} aria-hidden="true" />
                <Badge count={hydrated ? cartCount : 0} tone="bg-primary" />
              </span>
              Bag
            </button>
          </li>
        </ul>
      </nav>
    </>
  );
}

function Tab({
  href,
  label,
  icon: Icon,
  active,
  badge = 0,
}: {
  href: string;
  label: string;
  icon: typeof Home;
  active: boolean;
  badge?: number;
}) {
  return (
    <li>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={`relative flex h-full flex-col items-center justify-center gap-0.5 text-[10.5px] font-medium transition-colors ${
          active ? "text-accent-light" : "text-foreground/65 active:text-primary"
        }`}
      >
        {/* The gold thread from the desktop nav, marking the open tab. */}
        <span
          aria-hidden="true"
          className={`absolute inset-x-5 top-0 h-[2px] rounded-full bg-accent-light transition-transform duration-300 ${
            active ? "scale-x-100" : "scale-x-0"
          }`}
        />
        <span className="relative">
          <Icon size={21} strokeWidth={active ? 2.1 : 1.7} aria-hidden="true" />
          <Badge count={badge} tone="bg-accent" />
        </span>
        {label}
      </Link>
    </li>
  );
}

function Badge({ count, tone }: { count: number; tone: string }) {
  if (count <= 0) return null;
  return (
    <span
      className={`absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full ${tone} px-1 text-[9px] font-semibold text-white`}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}
