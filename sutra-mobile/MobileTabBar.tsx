"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Home, LayoutGrid, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { useWishlistStore } from "@/lib/store/wishlist";
import { useHydrated } from "@/lib/useHydrated";
import { DRAWN_FESTIVALS } from "@/lib/festival";
import { FestivalIcon } from "@/sutra-mobile/festival/FestivalParts";

/**
 * Phones only: the app-style tab bar along the bottom of the screen, as on
 * Flipkart. It takes over from the header's links, wishlist and bag, which
 * phones no longer show there; the account icon stays at the top right. Hidden from md up, so tablets and desktop are
 * untouched.
 *
 * Product pages and checkout have their own bar in this spot (Add to Bag /
 * Buy Now, Place Order), so the tabs step aside there.
 */
export const MOBILE_BAR_HIDDEN = (pathname: string) =>
  pathname.startsWith("/product/") || pathname.startsWith("/checkout") || pathname.startsWith("/admin");

export default function MobileTabBar() {
  const pathname = usePathname();
  const hydrated = useHydrated();
  const openCart = useCartStore((s) => s.openCart);
  const cartCount = useCartStore((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const wishCount = useWishlistStore((s) => Object.keys(s.saved).length);

  if (MOBILE_BAR_HIDDEN(pathname)) return null;

  const tabs = [
    { href: "/", label: "Home", icon: Home, active: pathname === "/" },
    { href: "/shop", label: "Shop", icon: LayoutGrid, active: pathname.startsWith("/shop") },
    { href: "/wishlist", label: "Wishlist", icon: Heart, active: pathname.startsWith("/wishlist"), badge: hydrated ? wishCount : 0 },
  ];

  return (
    <>
      {/* Keeps the footer's last lines clear of the fixed bar. */}
      <div aria-hidden="true" className="h-[calc(3.6rem+env(safe-area-inset-bottom))] md:hidden print:hidden" />
      <nav
        aria-label="Main"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-cream/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_-18px_rgba(0,0,0,0.9)] backdrop-blur-xl md:hidden print:hidden"
      >
        <ul className="sutra-tabs grid h-[3.6rem] grid-cols-4">
          {tabs.slice(0, 2).map((tab) => (
            <Tab key={tab.href} {...tab} />
          ))}
          {/* During a festival: its store, raised in the middle (a fifth column, see sutra-mobile.css). */}
          {DRAWN_FESTIVALS.map((f) => (
            <li key={f.id} data-fest-show={f.id}>
              <Link
                href="/festival"
                aria-current={pathname.startsWith("/festival") ? "page" : undefined}
                className={`relative flex h-full flex-col items-center justify-end pb-1.5 text-[10.5px] font-medium ${
                  pathname.startsWith("/festival") ? "text-accent-light" : "text-foreground"
                }`}
              >
                <span className="absolute -top-[18px] left-1/2 grid h-[52px] w-[52px] -translate-x-1/2 place-items-center rounded-full border-[3px] border-cream bg-[var(--night)] text-[var(--on-night)] shadow-[0_0_0_1px_rgb(var(--color-accent-light)),0_8px_18px_-6px_rgba(0,0,0,0.8)]">
                  <FestivalIcon icon={f.phone.icon} size={24} />
                </span>
                {f.phone.tabLabel}
              </Link>
            </li>
          ))}
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
          {tabs.slice(2).map((tab) => (
            <Tab key={tab.href} {...tab} />
          ))}
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
