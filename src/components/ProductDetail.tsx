"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { m as motion } from "framer-motion";
import {
  Gem,
  Heart,
  IndianRupee,
  Minus,
  Plus,
  RotateCcw,
  Ruler,
  ShoppingBag,
  Star,
  Tag,
} from "lucide-react";
import toast from "react-hot-toast";
import { useCartStore } from "@/lib/store/cart";
import { useStockStore } from "@/lib/store/stock";
import { useWishlistStore } from "@/lib/store/wishlist";
import { useHydrated } from "@/lib/useHydrated";
import { useRequireAccount } from "@/lib/useRequireAccount";
import { discountPercent, formatPrice } from "@/lib/utils";
import { getProductBySlug, type Product } from "@/lib/products";
import { DRAWN_FESTIVALS, festivalEnd, festivalPrice } from "@/lib/festival";
import { useFestival } from "@/lib/useFestival";
import { MiniCard, PhoneFestivalPrice, PhoneFestivalTag } from "@/sutra-mobile/festival/FestivalParts";
import { MandalaMotif } from "@/components/MandalaMotif";
import { SizeGuideModal } from "@/components/SizeGuideModal";
import { ProductReviews } from "@/components/ProductReviews";
import { RecentlyViewed } from "@/components/RecentlyViewed";
import ProductCard from "@/components/ProductCard";
import Photo from "@/components/Photo";
import { toastAddedToBag } from "@/components/Notifications";

function ProductRating({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={14} className={i < Math.round(rating) ? "fill-accent-light text-accent-light" : "text-foreground/25"} />
      ))}
    </span>
  );
}

export default function ProductDetail({ product, related }: { product: Product; related: Product[] }) {
  // No size is chosen for the shopper: the first one used to be preselected,
  // so a quick "Add to Bag" sent XS (or UK 6) without anyone picking it.
  const [size, setSize] = useState<string | null>(product.sizes.length === 1 ? product.sizes[0] : null);
  const [sizeNudge, setSizeNudge] = useState(false);
  const sizeBlock = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [qty, setQty] = useState(1);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const consumed = useStockStore((s) => s.consumed);
  const saved = useWishlistStore((s) => s.saved);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const hydrated = useHydrated();
  const requireAccount = useRequireAccount();

  const discount = discountPercent(product.price, product.compareAtPrice);
  const festival = useFestival();
  const stock = Math.max(0, product.stock - (consumed[product.id] ?? 0));
  const wishlisted = hydrated && product.id in saved;
  const soldOut = hydrated && stock === 0;
  const maxQty = Math.max(1, stock);
  const clampedQty = Math.min(qty, maxQty);
  const categoryLabel = product.category.name;

  /** Adds the chosen size to the bag; false if nothing could be added. */
  function addToBag({ quiet = false } = {}): boolean {
    if (stock === 0) {
      toast.error("This piece is sold out.");
      return false;
    }
    if (!size) {
      setSizeNudge(true);
      sizeBlock.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      toast.error("Choose a size first.");
      return false;
    }
    const added = addItem({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      image: product.images[0],
      price: product.price,
      size,
      quantity: clampedQty,
      stock,
    });
    if (added) {
      if (!quiet) {
        // The notification's View bag opens it; opening it here hid the page.
        toastAddedToBag(product.name, product.images[0]);
      }
      return true;
    }
    toast.error(`Only ${stock} in stock — your bag already has them all.`);
    return false;
  }

  function saveToWishlist() {
    if (!requireAccount("save items to your wishlist")) return;
    const nowSaved = toggleWishlist(product.id);
    toast.success(nowSaved ? "Saved to your wishlist" : "Removed from wishlist", nowSaved ? { icon: "♥" } : undefined);
  }

  /** Phones: straight to checkout with this piece in the bag. */
  function buyNow() {
    const inBag = !!size && useCartStore.getState().items.some((i) => i.productId === product.id && i.size === size);
    if (inBag || addToBag({ quiet: true })) router.push("/checkout");
  }

  return (
    <>
      <div className="mx-auto max-w-7xl px-6 py-10 max-md:px-0 max-md:pb-6 max-md:pt-0">
        <nav aria-label="Breadcrumb" className="mb-8 flex flex-wrap items-center gap-2 text-sm text-foreground/50 max-md:hidden">
          <Link className="hover:text-primary" href="/">
            Home
          </Link>
          <span>/</span>
          <Link className="hover:text-primary" href="/shop">
            Shop
          </Link>
          <span>/</span>
          <Link className="hover:text-primary" href={`/shop?category=${product.category.slug}`}>
            {categoryLabel}
          </Link>
          <span>/</span>
          <span className="truncate text-foreground/70">{product.name}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2 max-md:gap-4">
          <div>
          <motion.div
            className="sutra-no-entrance relative overflow-hidden rounded-3xl bg-white/5 shadow-sm max-md:rounded-none max-md:shadow-none"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            {/* The page's main picture: fetched first, at full phone width or half the desktop page. */}
            <Photo
              src={product.images[0]}
              sizes="(max-width: 767px) 100vw, 50vw"
              alt={product.name}
              fetchPriority="high"
              className="aspect-[4/5] w-full object-cover"
            />
            {discount !== null && (
              <span className="absolute left-4 top-4 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white max-md:hidden">
                {discount}% OFF
              </span>
            )}
            <PhoneFestivalTag className="bottom-4 px-3 text-[11px]" />
            {/* Phones: the wishlist heart sits on the photo, as on Flipkart. */}
            <button
              type="button"
              onClick={saveToWishlist}
              aria-label={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
              aria-pressed={wishlisted}
              className="absolute right-3 top-3 rounded-full bg-cream-dark/85 p-2.5 text-primary shadow-md backdrop-blur-sm md:hidden"
            >
              <Heart size={19} className={wishlisted ? "fill-primary" : ""} />
            </button>
          </motion.div>
          {/* Openly licensed photos are free to use only if credited where they
              appear: title, photographer, source and licence, plus a note that
              the image was altered - every one here is cropped and resized. */}
          {product.imageCredit && (
            <p className="mt-2 px-1 text-[11px] leading-relaxed text-foreground/40 max-md:px-4">
              Photo:{" "}
              <a href={product.imageCredit.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline decoration-foreground/20 underline-offset-2 hover:text-foreground/70">
                &ldquo;{product.imageCredit.title}&rdquo;
              </a>{" "}
              by {product.imageCredit.author},{" "}
              <a href={product.imageCredit.licenseUrl} target="_blank" rel="noopener noreferrer" className="underline decoration-foreground/20 underline-offset-2 hover:text-foreground/70">
                {product.imageCredit.license}
              </a>
              . Cropped and resized.
            </p>
          )}
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="sutra-no-entrance max-md:flex max-md:flex-col max-md:px-4">
            <p className="text-sm uppercase tracking-[0.3em] text-accent max-md:text-xs">{categoryLabel}</p>
            <h1 className="mt-2 font-display text-3xl sm:text-4xl max-md:mt-1 max-md:text-[1.6rem] max-md:leading-tight">{product.name}</h1>

            {/* Phones: Flipkart's green rating badge. */}
            {product.rating > 0 && (
              <span className="mt-2 inline-flex w-fit items-center gap-1 rounded bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white md:hidden">
                {product.rating.toFixed(1)}
                <Star size={11} className="fill-white" aria-hidden="true" />
                <span className="sr-only"> out of 5</span>
              </span>
            )}

            <div className="mt-3 flex items-center gap-3 max-md:hidden">
              <ProductRating rating={product.rating} />
              <span className="text-sm text-foreground/60">
                {product.rating.toFixed(1)}
                {product.reviewCount > 0 && ` · ${product.reviewCount} reviews`}
              </span>
            </div>

            <div data-fest-hide className="mt-5 flex items-baseline gap-3 max-md:mt-3 max-md:flex-wrap max-md:gap-x-2.5 max-md:gap-y-0">
              {discount !== null && (
                <span className="text-lg font-semibold text-emerald-400 md:hidden">
                  <span aria-hidden="true">↓</span>
                  {discount}%
                </span>
              )}
              {product.compareAtPrice && (
                <span className="text-base text-foreground/40 line-through md:hidden">{formatPrice(product.compareAtPrice)}</span>
              )}
              <span className="font-display text-3xl font-semibold text-primary max-md:font-sans max-md:text-2xl max-md:text-foreground">{formatPrice(product.price)}</span>
              {product.compareAtPrice && (
                <span className="text-lg text-foreground/40 line-through max-md:hidden">{formatPrice(product.compareAtPrice)}</span>
              )}
            </div>
            <PhoneFestivalPrice product={product} large />
            <p className="mt-1 text-xs text-foreground/50">Inclusive of all taxes</p>
            {/* Phones during a festival: the offer, already applied, in tonight's colour. */}
            {DRAWN_FESTIVALS.map((f) => (
              <span key={f.id} data-fest-show={f.id}>
                <span className="mt-3 flex gap-2.5 rounded-[10px] border border-[color-mix(in_srgb,var(--night)_45%,transparent)] bg-[color-mix(in_srgb,var(--night)_18%,rgb(var(--color-cream)))] px-3 py-2.5 text-xs leading-relaxed text-foreground/70 md:hidden">
                  <Tag size={16} className="mt-0.5 shrink-0 text-accent-light" aria-hidden="true" />
                  <span>
                    <b className="font-medium text-foreground">{f.name} offer applied.</b>{" "}
                    {formatPrice(product.price - festivalPrice(product.price, f))} off our price of {formatPrice(product.price)}
                    {f.freeShipping ? ", plus free delivery" : ""}. No code needed.
                  </span>
                </span>
              </span>
            ))}
            {festival && (
              <p className="mt-4 rounded-xl border border-accent/30 bg-accent/[0.07] px-4 py-3 text-sm leading-relaxed text-foreground/80 max-md:hidden">
                <strong className="font-medium text-accent-light">
                  {festival.name} offer: you pay {formatPrice(festivalPrice(product.price, festival))}
                </strong>
                <br />
                {festival.percentOff}% off at checkout{festival.freeShipping ? ", with free delivery" : ""}. No code
                needed. Until {festival.endsOn},{" "}
                {new Date(festivalEnd(festival) - 1).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  timeZone: "Asia/Kolkata",
                })}
                .
              </p>
            )}

            <p className="mt-6 leading-relaxed text-foreground/75 max-md:order-1 max-md:text-[15px]">{product.description}</p>

            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-3 border-y border-white/10 py-5 text-sm max-md:order-1">
              <div>
                <dt className="text-foreground/50">Fabric</dt>
                <dd className="mt-0.5 font-medium">{product.fabric}</dd>
              </div>
              {product.craftName && (
                <div>
                  <dt className="text-foreground/50">Craft</dt>
                  <dd className="mt-0.5 font-medium">{product.craftName}</dd>
                </div>
              )}
              {product.state && (
                <div>
                  <dt className="text-foreground/50">Origin</dt>
                  <dd className="mt-0.5 font-medium">{product.state}</dd>
                </div>
              )}
              <div>
                <dt className="text-foreground/50">Availability</dt>
                <dd className="mt-0.5 font-medium">
                  {hydrated ? (stock > 0 ? `${stock} in stock` : "Sold out") : `${product.stock} in stock`}
                </dd>
              </div>
            </dl>

            <div ref={sizeBlock} className="mt-6 max-md:scroll-mt-32">
              <div className="mb-2 flex items-center justify-between gap-3">
                <p id="size-label" className={`text-xs font-semibold uppercase tracking-[0.15em] ${sizeNudge ? "text-primary" : "text-foreground/50"}`}>
                  {size ? <>Size — <span className="normal-case tracking-normal">{size}</span></> : sizeNudge ? "Choose a size" : "Size"}
                </p>
                <button
                  type="button"
                  onClick={() => setSizeGuideOpen(true)}
                  className="flex items-center gap-1.5 text-xs text-primary underline-offset-4 hover:underline"
                >
                  <Ruler size={13} />
                  Size guide
                </button>
              </div>
              <div role="group" aria-labelledby="size-label" className={`flex flex-wrap gap-2 rounded-2xl transition ${sizeNudge ? "ring-1 ring-primary/60 ring-offset-4 ring-offset-transparent" : ""}`}>
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={size === s}
                    onClick={() => {
                      setSize(s);
                      setSizeNudge(false);
                    }}
                    className={`rounded-full border px-4 py-2 text-sm transition ${
                      size === s ? "border-primary bg-primary text-white" : "border-white/15 hover:border-primary"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4 max-md:hidden">
              <div className="flex items-center gap-3 rounded-full border border-white/12 px-3 py-2">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  disabled={clampedQty <= 1}
                  className="rounded-full p-1 hover:bg-white/5 disabled:opacity-35"
                  aria-label="Decrease quantity"
                >
                  <Minus size={16} />
                </button>
                <span className="w-6 text-center">{clampedQty}</span>
                <button
                  onClick={() => setQty((q) => Math.min(maxQty, q + 1))}
                  disabled={clampedQty >= maxQty}
                  className="rounded-full p-1 hover:bg-white/5 disabled:opacity-35"
                  aria-label="Increase quantity"
                >
                  <Plus size={16} />
                </button>
              </div>

              <button
                onClick={() => addToBag()}
                disabled={soldOut}
                className="btn-shimmer flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-8 py-3.5 font-medium text-white transition hover:bg-primary-dark disabled:opacity-60"
              >
                <ShoppingBag size={18} />
                {soldOut ? "Sold Out" : "Add to Bag"}
              </button>

              <button
                onClick={saveToWishlist}
                aria-pressed={wishlisted}
                className="flex items-center justify-center gap-2 rounded-full border border-white/15 px-6 py-3.5 text-sm font-medium transition hover:border-primary hover:text-primary"
              >
                <Heart size={17} className={wishlisted ? "fill-primary text-primary" : ""} />
                {wishlisted ? "Saved" : "Save"}
              </button>
            </div>

            <ul className="mt-8 flex flex-col gap-3 text-sm text-foreground/70 max-md:order-1 max-md:mt-6">
              <li className="flex items-center gap-3">
                <Gem size={18} strokeWidth={1.4} className="text-accent" aria-hidden="true" />
                Sourced directly from India&#39;s finest weaving clusters.
              </li>
              <li className="flex items-center gap-3">
                <RotateCcw size={18} strokeWidth={1.4} className="text-accent" aria-hidden="true" />
                7-day hassle-free returns on all unworn pieces.
              </li>
              <li className="flex items-center gap-3">
                <IndianRupee size={18} strokeWidth={1.4} className="text-accent" aria-hidden="true" />
                Cash on delivery available across 380+ cities.
              </li>
            </ul>
          </motion.div>
        </div>
      </div>

      {/* Phones: Flipkart's two buttons, always in reach at the bottom. */}
      <div aria-hidden="true" className="h-[calc(4rem+env(safe-area-inset-bottom))] md:hidden" />
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-cream/95 pb-[env(safe-area-inset-bottom)] shadow-[0_-10px_30px_-18px_rgba(0,0,0,0.9)] backdrop-blur-xl md:hidden print:hidden">
        {soldOut ? (
          <p className="flex h-16 items-center justify-center text-sm font-semibold uppercase tracking-[0.2em] text-primary">Sold out</p>
        ) : (
          <div className="grid h-16 grid-cols-2 gap-2 px-3 py-2.5">
            <button
              type="button"
              onClick={() => addToBag()}
              className="flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-cream-dark text-[15px] font-medium text-foreground active:bg-white/10"
            >
              <ShoppingBag size={17} aria-hidden="true" />
              Add to Bag
            </button>
            <button
              type="button"
              onClick={buyNow}
              className="flex items-center justify-center gap-2 rounded-lg bg-accent-light text-[15px] font-semibold text-[#1a1416] active:bg-accent"
            >
              Buy Now
            </button>
          </div>
        )}
      </div>

      {/* Phones during a festival: more from its edit, to finish the outfit. */}
      {DRAWN_FESTIVALS.map((f) => {
        const more = f.edit.slugs
          .filter((slug) => slug !== product.slug)
          .map(getProductBySlug)
          .filter((p): p is Product => !!p)
          .slice(0, 6);
        return (
          <div key={f.id} data-fest-show={f.id}>
            <section className="px-4 pt-8 md:hidden">
              <h2 className="mb-3 font-hero text-[23px] font-medium leading-tight">{f.phone.completeTitle}</h2>
              <div className="-mx-4 flex snap-x gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">
                {more.map((p) => (
                  <MiniCard key={p.id} product={p} festival={f} />
                ))}
              </div>
            </section>
          </div>
        );
      })}

      <ProductReviews product={product} />
      <SizeGuideModal open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} sizes={product.sizes} />
      <RecentlyViewed currentId={product.id} />

      {related.length > 0 && (
        <section className="relative overflow-hidden py-16">
          <MandalaMotif className="pointer-events-none absolute -right-32 top-10 -z-10 text-primary/5" size={420} duration={50} />
          <div className="mx-auto max-w-7xl px-6">
            <p className="text-sm uppercase tracking-[0.3em] text-accent">You may also like</p>
            <h2 className="mt-2 font-display text-3xl">More from {categoryLabel}</h2>
            <div className="mt-10 sutra-cards grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
              {related.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
