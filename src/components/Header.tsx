"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, m as motion } from "framer-motion";
import { ChevronDown, Heart, Search, ShoppingBag, Sparkles, User } from "lucide-react";
import { useCartStore } from "@/lib/store/cart";
import { useWishlistStore } from "@/lib/store/wishlist";
import { useAuthStore } from "@/lib/store/auth";
import { useHydrated } from "@/lib/useHydrated";
import { Logo } from "@/components/Logo";
import SearchBar from "@/components/SearchBar";
import { CollectionsPanel, useCollectionsMenu } from "@/components/CollectionsMenu";
import { MOBILE_BAR_HIDDEN, PHONE_SEARCH_EVENT } from "@/sutra-mobile/MobileTabBar";

const navLinks = [
  { href: "/", label: "Home" },
  // Women and Men live as tabs on the shop page and as cards on the home page,
  // so the bar keeps to the three places a visitor actually goes.
  { href: "/shop", label: "Shop" },
  { href: "/our-story", label: "Our Story" },
];

export default function Header() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const collections = useCollectionsMenu(pathname);
  const accountMenu = useRef<HTMLDivElement>(null);

  // The account menu only closed when the mouse left it, so on a phone it
  // stayed open over the next page. Close it on a tap elsewhere, on Escape,
  // and whenever the page changes.
  useEffect(() => setAccountOpen(false), [pathname]);
  useEffect(() => {
    if (!accountOpen) return;
    const onPointer = (e: PointerEvent) => {
      if (!accountMenu.current?.contains(e.target as Node)) setAccountOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAccountOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [accountOpen]);

  // Looked up by href rather than hard-coded positions, which went stale the
  // moment a link was added or removed.
  const activeIndex = navLinks.findIndex((link) =>
    link.href === "/" ? pathname === "/" : pathname.startsWith(link.href)
  );

  const navRef = useRef<HTMLUListElement>(null);
  const threadRef = useRef<HTMLSpanElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  const positionThread = useCallback((index: number) => {
    const container = navRef.current;
    const link = linkRefs.current[index];
    const thread = threadRef.current;
    if (!thread) return;
    if (!link || link.offsetParent === null) {
      thread.classList.remove("on");
      return;
    }
    const left = container ? link.getBoundingClientRect().left - container.getBoundingClientRect().left : link.offsetLeft;
    // The capsule reaches past the link on both sides.
    thread.style.width = `${link.offsetWidth + 32}px`;
    thread.style.transform = `translateX(${left - 16}px)`;
    thread.classList.add("on");
  }, []);

  useEffect(() => {
    positionThread(activeIndex);
    const timeout = window.setTimeout(() => positionThread(activeIndex), 620);
    // Removed on cleanup: otherwise every page change stacked another listener.
    const onResize = () => positionThread(activeIndex);
    window.addEventListener("resize", onResize);
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("resize", onResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeIndex, positionThread]);

  // Phones: the search row opens from the tab bar's Search button (or the
  // header's search icon where that bar steps aside) and closes on navigation.
  const [phoneSearch, setPhoneSearch] = useState(false);
  useEffect(() => {
    const toggle = () => setPhoneSearch((o) => !o);
    window.addEventListener(PHONE_SEARCH_EVENT, toggle);
    return () => window.removeEventListener(PHONE_SEARCH_EVENT, toggle);
  }, []);
  useEffect(() => setPhoneSearch(false), [pathname]);
  useEffect(() => {
    if (!phoneSearch) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPhoneSearch(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phoneSearch]);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 40);
    }
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openCart = useCartStore((s) => s.openCart);
  const cartItems = useCartStore((s) => s.items);
  const saved = useWishlistStore((s) => s.saved);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const hydrated = useHydrated();

  const cartCount = hydrated ? cartItems.reduce((sum, i) => sum + i.quantity, 0) : 0;
  const signedIn = hydrated && !!user;
  // Gold account pill for Sutra Gold members, a plain one for everyone else.
  const member = useAuthStore((s) => !!s.circle);
  const acctPill = `sutra-acct${hydrated && member ? "" : " is-plain"}`;
  const wishlistCount = hydrated ? Object.keys(saved).length : 0;

  // Sticky bars further down (the shop's Sort | Filter bar on phones) sit
  // flush under the header, whose height changes as the phone search row
  // slides away and back. Its live height is kept in a CSS variable.
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const publish = () => document.documentElement.style.setProperty("--sutra-header-h", `${el.offsetHeight}px`);
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <header
      ref={headerRef}
      className="sutra-header pointer-events-none sticky top-0 z-40 px-2.5 pt-2.5 sm:px-4 md:px-6 md:pt-3"
    >
      {/* Three layouts:
          - Phones: three rows. Logo and icons on top, the links across the full
            width, then search. The logo-and-links group is `contents` so its
            children can be ordered into the nav's own rows.
          - Tablets (md): one row, logo and links together on the left.
          - From lg: logo | links | search and icons, as a 1fr-auto-1fr grid so
            the links sit at the true centre of the screen. The right side is
            far wider than the logo, so centring them in the leftover space
            would have pushed them visibly left.
          - 1024–1279px: logo and links together on the left instead, so the
            search box gets the room centring would leave empty. */}
      {/* The navbar floats: a frosted pill (a rounded panel on phones, where
          search sits inside it) held a little clear of the page's edges. The
          header itself ignores clicks so the page around the pill stays usable. */}
      <nav
        className={`sutra-floatnav sutra-glass pointer-events-auto mx-auto flex max-w-[86rem] 2xl:max-w-[98rem] flex-wrap items-center justify-between gap-x-4 rounded-[24px] border border-accent-light/55 bg-cream/70 px-4 py-1 backdrop-blur-xl transition-shadow sm:px-6 md:flex-nowrap md:rounded-full lg:grid lg:grid-cols-[1fr_auto_1fr] lg:gap-x-8 lg:max-xl:grid-cols-[auto_auto_1fr] ${
          scrolled
            ? "shadow-[0_0_0_1px_rgb(212_175_55/0.12),0_14px_38px_-10px_rgb(212_175_55/0.32)]"
            : "shadow-[0_0_0_1px_rgb(212_175_55/0.12),0_10px_34px_-10px_rgb(212_175_55/0.28)]"
        }`}
      >
        <div className="contents md:flex md:min-w-0 md:items-center md:gap-8 lg:contents">
          <Link className="sutra-logo order-1 flex items-center justify-self-start py-1.5 md:order-none" aria-label="Sutra — home" href="/">
            <Logo className="sutra-logo-size" />
          </Link>

          <ul
            ref={navRef}
            // The capsule follows the pointer, then glides back to the open page.
            onMouseLeave={() => positionThread(activeIndex)}
            onBlur={() => positionThread(activeIndex)}
            className="relative order-3 flex w-full items-center justify-center gap-10 whitespace-nowrap border-t border-white/[0.07] pb-2.5 pt-2 md:order-none md:w-auto md:justify-start md:gap-5 md:border-0 md:p-0 lg:gap-7 max-md:hidden"
          >
            <span ref={threadRef} className="sutra-navthread" aria-hidden="true" />
            {navLinks.map((link, i) => {
              // "Shop" also opens the Collections panel on hover (desktop).
              const shop = link.href === "/shop";
              return (
              <li key={link.href} {...(shop ? collections.hover : {})}>
                <Link
                  ref={(el) => {
                    linkRefs.current[i] = el;
                  }}
                  href={link.href}
                  aria-current={i === activeIndex ? "page" : undefined}
                  onMouseEnter={() => positionThread(i)}
                  onFocus={() => positionThread(i)}
                  {...(shop
                    ? {
                        onKeyDown: collections.triggerKeys,
                        "aria-expanded": collections.open,
                        "aria-controls": "sutra-collections",
                      }
                    : {})}
                  style={{ "--nav-delay": `${0.05 * i}s` } as React.CSSProperties}
                  className={`sutra-navin relative z-[1] text-sm font-medium transition-colors ${
                    i === activeIndex ? "text-white" : "text-foreground/80 hover:text-white"
                  }`}
                >
                  {link.label}
                  {shop && (
                    <ChevronDown
                      size={12}
                      aria-hidden="true"
                      className={`ml-1 inline transition-transform duration-200 max-lg:hidden ${
                        collections.open ? "rotate-180 text-accent-light" : ""
                      }`}
                    />
                  )}
                </Link>
              </li>
              );
            })}
            {/* Sutra Gold: a see-through gold pill with a light that sweeps
                across it now and then. Kept out of navLinks so the underline
                thread doesn't try to sit under it. */}
            {/* The full pill from lg; just the gold sparkle on tablets and
                tablets. Phones have no link row: they reach Sutra Gold
                from the Home card, the Offers panel and the footer. */}
            <li>
              <Link
                href="/gold"
                aria-current={pathname.startsWith("/gold") ? "page" : undefined}
                aria-label="Sutra Gold"
                title="Sutra Gold"
                className="sutra-goldnav"
              >
                <Sparkles size={13} aria-hidden="true" />
                <span className="max-lg:hidden">Sutra Gold</span>
              </Link>
            </li>
          </ul>
        </div>

        <div className="order-2 flex shrink-0 items-center gap-1 justify-self-end md:order-none md:gap-2 lg:w-full lg:justify-end lg:pl-6">
          <SearchBar />

          {/* Phones open search from the tab bar; where that bar steps aside
              (product, checkout), this icon does it instead. */}
          {MOBILE_BAR_HIDDEN(pathname) && (
            <button
              type="button"
              onClick={() => setPhoneSearch((o) => !o)}
              aria-expanded={phoneSearch}
              aria-label="Search"
              className="rounded-full p-2.5 transition-colors hover:bg-white/10 md:hidden"
            >
              <Search size={18} aria-hidden="true" />
            </button>
          )}

          <motion.button
            onClick={openCart}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            // Phones reach the bag from the bottom tab bar, so it shows up here
            // only on pages where that bar steps aside (product, checkout).
            // With something in it, the bag becomes a maroon pill showing the count (md up).
            className={`relative flex items-center rounded-full p-2.5 transition-colors hover:bg-white/10 md:p-1.5 ${
              cartCount > 0 ? "sutra-bagpill" : ""
            } ${MOBILE_BAR_HIDDEN(pathname) ? "" : "max-md:hidden"}`}
            aria-label={cartCount > 0 ? `Open bag, ${cartCount} item${cartCount === 1 ? "" : "s"}` : "Open cart"}
          >
            <ShoppingBag size={cartCount > 0 ? 16 : 18} className="max-md:h-[18px] max-md:w-[18px]" />
            {cartCount > 0 && (
              <span className="max-md:hidden" aria-hidden="true">
                {/* The word only from 1280px; below that, icon and count, so
                    the search box beside it keeps its width. */}
                <span className="max-xl:hidden">Bag </span>
                <b>{cartCount}</b>
              </span>
            )}
            <AnimatePresence>
              {cartCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-semibold text-white md:hidden"
                >
                  {cartCount}
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Shown on phones too, beside the account button: the tab bar has no wishlist tab. */}
          <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>
            <Link
              href="/wishlist"
              className="relative flex rounded-full p-2.5 transition-colors hover:bg-white/10 md:p-1.5"
              aria-label={wishlistCount > 0 ? `Wishlist, ${wishlistCount} saved` : "Wishlist"}
            >
              <Heart size={18} />
              <AnimatePresence>
                {wishlistCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent text-[9px] font-semibold text-white"
                  >
                    {wishlistCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          </motion.div>

          {/* Phones: straight to the account page (or sign in), no menu. Hidden
              until the saved session is read, so it never shows the wrong one. */}
          {/* Icon only on product and checkout pages, where search and the bag
              share the row and the word would push it onto two lines. */}
          <Link
            href={signedIn ? "/account" : "/login"}
            aria-label={signedIn ? "Account" : "Sign in"}
            className={`ml-1 md:hidden ${signedIn ? acctPill : "sutra-goldpill"} ${hydrated ? "" : "opacity-0"}`}
          >
            <User size={14} aria-hidden="true" />
            <span className={MOBILE_BAR_HIDDEN(pathname) ? "sr-only" : ""}>{signedIn ? "Account" : "Sign in"}</span>
          </Link>

          <div ref={accountMenu} className="relative ml-1 max-md:hidden">
            {/* Signed out: a "Sign in" pill edged in gold thread. Signed in: a
                "My account" pill that opens the account menu, gold for Circle
                members and plain otherwise. */}
            {!signedIn ? (
              <Link
                href="/login"
                tabIndex={hydrated ? undefined : -1}
                className={`sutra-goldpill ${hydrated ? "" : "opacity-0"}`}
              >
                <User size={15} />
                Sign in
              </Link>
            ) : (
              <motion.button
                onClick={() => setAccountOpen((o) => !o)}
                aria-expanded={accountOpen}
                aria-haspopup="menu"
                whileTap={{ scale: 0.96 }}
                className={`${acctPill} is-compact`}
                title="My account"
                aria-label={`My account, signed in as ${user!.name}${member ? ", Sutra Gold member" : ""}`}
              >
                <User size={15} />
                {/* Icon only below 1440px, so the search box keeps its width. */}
                <span className="max-[1439px]:hidden">My account</span>
              </motion.button>
            )}
            <AnimatePresence>
              {accountOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-48 overflow-hidden rounded-xl border border-white/10 bg-cream-dark/95 shadow-2xl backdrop-blur-xl"
                  onMouseLeave={() => setAccountOpen(false)}
                >
                  {hydrated && user ? (
                    <>
                      <div className="px-4 py-3 text-sm text-foreground/60">Hi, {user.name.split(" ")[0]}</div>
                      <Link href="/account" className="block px-4 py-2 text-sm hover:bg-white/10" onClick={() => setAccountOpen(false)}>
                        My Orders
                      </Link>
                      {user.role === "ADMIN" && (
                        <Link href="/admin" className="block px-4 py-2 text-sm hover:bg-white/10" onClick={() => setAccountOpen(false)}>
                          Admin Panel
                        </Link>
                      )}
                      <button
                        onClick={() => {
                          setAccountOpen(false);
                          signOut();
                        }}
                        className="block w-full px-4 py-2 text-left text-sm text-primary hover:bg-white/10"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/login" className="block px-4 py-2 text-sm hover:bg-white/10" onClick={() => setAccountOpen(false)}>
                        Login
                      </Link>
                      <Link href="/signup" className="block px-4 py-2 text-sm hover:bg-white/10" onClick={() => setAccountOpen(false)}>
                        Create Account
                      </Link>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>

        {/* Phones: search is a full-width row that opens on demand (the tab
            bar's Search button), never on scroll: the header changing height
            while scrolling made the page jump. */}
        {phoneSearch && (
          <div className="order-4 w-full pb-3 md:hidden">
            <SearchBar compact autoFocus />
          </div>
        )}
      </nav>

      <CollectionsPanel
        open={collections.open}
        close={collections.close}
        hover={collections.hover}
        panelBlur={collections.panelBlur}
      />
    </header>
  );
}

