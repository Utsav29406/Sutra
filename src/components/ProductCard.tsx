"use client";

import Link from "next/link";
import { m as motion } from "framer-motion";
import { Heart, ShoppingBag, Star } from "lucide-react";
import toast from "react-hot-toast";
import { useCartStore } from "@/lib/store/cart";
import { useStockStore } from "@/lib/store/stock";
import { useWishlistStore } from "@/lib/store/wishlist";
import { useHydrated } from "@/lib/useHydrated";
import { useRequireAccount } from "@/lib/useRequireAccount";
import { discountPercent, formatPrice } from "@/lib/utils";
import type { Product } from "@/lib/products";
import { festivalPrice } from "@/lib/festival";
import { CARD_SIZES } from "@/lib/images";
import { useFestival } from "@/lib/useFestival";
import { PhoneFestivalPrice, PhoneFestivalTag } from "@/sutra-mobile/festival/FestivalParts";
import Photo from "@/components/Photo";
import { toastAddedToBag } from "@/components/Notifications";

/** `eager`: the first cards in view on load (the shop's first row), fetched straight away. */
export default function ProductCard({
  product,
  index = 0,
  eager = false,
}: {
  product: Product;
  index?: number;
  eager?: boolean;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const consumed = useStockStore((s) => s.consumed);
  const saved = useWishlistStore((s) => s.saved);
  const toggle = useWishlistStore((s) => s.toggle);
  const hydrated = useHydrated();
  const requireAccount = useRequireAccount();
  const festival = useFestival();

  const discount = discountPercent(product.price, product.compareAtPrice);
  const stock = Math.max(0, product.stock - (consumed[product.id] ?? 0));
  const wishlisted = hydrated && product.id in saved;

  return (
    <motion.div
      className="group"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: 0.06 * Math.min(index, 7) }}
    >
      <Link href={`/product/${product.slug}`} className="block">
        <div className="relative overflow-hidden rounded-2xl bg-white/5 shadow-sm transition-shadow duration-300 group-hover:shadow-xl max-md:rounded-lg max-md:shadow-none">
          <Photo
            src={product.images[0]}
            sizes={CARD_SIZES}
            alt={product.name}
            loading={eager ? "eager" : "lazy"}
            className="aspect-[4/5] w-full object-cover"
          />
          {discount !== null && (
            <span className="absolute left-3 top-3 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-white max-md:hidden">
              {discount}% OFF
            </span>
          )}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (!requireAccount("save items to your wishlist")) return;
              const nowSaved = toggle(product.id);
              toast.success(nowSaved ? "Saved to your wishlist" : "Removed from wishlist", nowSaved ? { icon: "♥" } : undefined);
            }}
            aria-label={wishlisted ? "Remove from wishlist" : "Save to wishlist"}
            aria-pressed={wishlisted}
            className="absolute right-3 top-3 rounded-full bg-cream-dark/85 p-2 text-primary shadow-sm backdrop-blur-sm transition hover:bg-cream-dark max-md:right-1.5 max-md:top-1.5 max-md:p-1.5"
          >
            <Heart size={15} className={wishlisted ? "fill-primary" : ""} />
          </button>
          <PhoneFestivalTag />
          {hydrated && stock === 0 && (
            <span className="absolute inset-0 flex items-center justify-center bg-cream-dark/70 text-sm font-semibold uppercase tracking-[0.2em] text-primary">
              Sold Out
            </span>
          )}
          <button
            onClick={(e) => {
              // A piece made in several sizes goes to its page to choose one:
              // Quick Add used to put the first size (XS, UK 6) in the bag
              // without asking. Not stopping the click lets the card's link open.
              if (product.sizes.length > 1) return;
              e.preventDefault();
              e.stopPropagation();
              if (stock === 0) {
                toast.error(`${product.name} is sold out.`);
                return;
              }
              const added = addItem({
                productId: product.id,
                slug: product.slug,
                name: product.name,
                image: product.images[0],
                price: product.price,
                size: product.sizes[0],
                quantity: 1,
                stock,
              });
              if (added) {
                toastAddedToBag(product.name, product.images[0]);
              } else {
                toast.error(`Only ${stock} left — that's all of them in your bag.`);
              }
            }}
            data-press="true"
            disabled={hydrated && stock === 0}
            className="absolute bottom-3 left-3 right-3 flex translate-y-0 items-center justify-center gap-2 rounded-full bg-white/95 py-2.5 text-sm font-medium text-primary opacity-100 shadow-lg transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-50 sm:translate-y-2 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100 max-md:hidden"
          >
            <ShoppingBag size={16} />
            {hydrated && stock === 0 ? "Sold Out" : product.sizes.length > 1 ? "Choose Size" : "Quick Add"}
          </button>
        </div>
        <div className="mt-3 max-md:mt-2">
          <p className="text-xs uppercase tracking-wide text-foreground/50 max-md:text-[10.5px]">{product.category.name}</p>
          <h3 className="mt-0.5 font-medium leading-snug max-md:line-clamp-2 max-md:text-[13.5px] max-md:font-normal max-md:text-foreground/90">{product.name}</h3>
          {/* Phones, as on Flipkart: a green rating badge under the name. */}
          {product.rating > 0 && (
            <span className="mt-1 inline-flex items-center gap-0.5 rounded bg-emerald-600 px-1.5 py-px text-[11px] font-semibold text-white md:hidden">
              {product.rating.toFixed(1)}
              <Star size={9} className="fill-white" aria-hidden="true" />
              <span className="sr-only"> out of 5</span>
            </span>
          )}
          <div data-fest-hide className="mt-1 flex items-center gap-2 max-md:flex-wrap max-md:gap-x-1.5 max-md:gap-y-0">
            <span className="font-semibold text-primary max-md:text-[15px] max-md:text-foreground">{formatPrice(product.price)}</span>
            {product.compareAtPrice && (
              <span className="text-sm text-foreground/40 line-through max-md:text-xs">{formatPrice(product.compareAtPrice)}</span>
            )}
            {discount !== null && <span className="text-xs font-semibold text-emerald-400 md:hidden">{discount}% off</span>}
          </div>
          <PhoneFestivalPrice product={product} />
          {festival && (
            <p className="mt-0.5 text-[12.5px] text-accent-light max-md:hidden">
              {formatPrice(festivalPrice(product.price, festival))} in the {festival.name} offer
            </p>
          )}
        </div>
      </Link>
    </motion.div>
  );
}
