"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Search, ShoppingBag } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { useHydrated } from "@/lib/useHydrated";

/**
 * Phones only: the app-style tab bar along the bottom of the screen, as on
 * Flipkart. It takes over from the header's links and bag, which phones no
 * longer show there; wishlist and account stay at the top right. Hidden from
 * md up, so tablets and desktop are untouched.
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

  // The capsule moves the moment a tab is tapped, not when the next page has
  // loaded; the address takes over again once it changes.
  const [tapped, setTapped] = useState<number | null>(null);
  useEffect(() => setTapped(null), [pathname]);

  if (MOBILE_BAR_HIDDEN(pathname)) {
    // Product pages and checkout have their own bar here; this spacer, after
    // the footer, keeps the footer's last line clear of it.
    if (pathname.startsWith("/admin")) return null;
    return <div aria-hidden="true" className="h-[calc(4.25rem+env(safe-area-inset-bottom))] md:hidden print:hidden" />;
  }

  const tabs = [
    { href: "/", label: "Home", icon: Home, active: pathname === "/" },
    { href: "/shop", label: "Shop", icon: LayoutGrid, active: pathname.startsWith("/shop") },
  ];
  const fromPath = tabs.findIndex((t) => t.active);
  const selected = tapped ?? fromPath;

  return (
    <>
      {/* Keeps the footer's last lines clear of the fixed bar. */}
      <div aria-hidden="true" className="h-[calc(4.8rem+env(safe-area-inset-bottom))] md:hidden print:hidden" />
      {/* A floating capsule in solid glass (.sutra-glass, sutra-mobile.css). */}
      <nav
        aria-label="Main"
        className="sutra-glass fixed inset-x-2.5 bottom-[calc(0.5rem+env(safe-area-inset-bottom))] z-40 rounded-full border p-[5px] md:hidden print:hidden"
      >
        <ul className="sutra-tabs relative grid h-[3.4rem] grid-cols-4">
          {/* One capsule for the open page, gliding from button to button. */}
          <li
            aria-hidden="true"
            className="sutra-tabpill"
            style={{
              transform: `translateX(${Math.max(selected, 0) * 100}%)`,
              opacity: selected >= 0 ? 1 : 0,
            }}
          />
          {tabs.map((tab, i) => (
            <Tab key={tab.href} {...tab} selected={i === selected} onTap={() => setTapped(i)} />
          ))}
          <li>
            <button
              type="button"
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
                window.dispatchEvent(new Event(PHONE_SEARCH_EVENT));
              }}
              className="relative z-[1] flex h-full w-full flex-col items-center justify-center gap-0.5 text-[10.5px] font-medium text-foreground/65 transition-colors duration-300 active:text-foreground"
            >
              <Search size={21} strokeWidth={1.7} aria-hidden="true" />
              Search
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={openCart}
              className="relative z-[1] flex h-full w-full flex-col items-center justify-center gap-0.5 text-[10.5px] font-medium text-foreground/65 transition-colors duration-300 active:text-foreground"
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
  selected,
  onTap,
}: {
  href: string;
  label: string;
  icon: typeof Home;
  active: boolean;
  selected: boolean;
  onTap: () => void;
}) {
  return (
    <li>
      <Link
        href={href}
        onClick={onTap}
        aria-current={active ? "page" : undefined}
        className={`relative z-[1] flex h-full flex-col items-center justify-center gap-0.5 text-[10.5px] font-medium transition-colors duration-300 ${
          selected ? "text-white" : "text-foreground/65"
        }`}
      >
        <Icon size={21} strokeWidth={selected ? 2.1 : 1.7} aria-hidden="true" />
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
