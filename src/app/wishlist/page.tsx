"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { m as motion } from "framer-motion";
import ProductCard from "@/components/ProductCard";
import { PageSkeleton } from "@/components/PageSkeleton";
import { useWishlistStore } from "@/lib/store/wishlist";
import { useAuthStore } from "@/lib/store/auth";
import { useHydrated } from "@/lib/useHydrated";
import { getProductById } from "@/lib/products";

export default function WishlistPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const saved = useWishlistStore((s) => s.saved);
  const hydrated = useHydrated();
  const loaded = useAuthStore((s) => s.loaded);

  // Waits for hydration before deciding: the signed-in user is restored from
  // storage on the client, so checking too early bounces a real user to login.
  // Also waits for the session check (`loaded`): someone signed in with a
  // live cookie but nothing remembered in this browser was bounced to login.
  useEffect(() => {
    if (hydrated && loaded && !user) router.replace("/login?next=/wishlist");
  }, [hydrated, loaded, user, router]);

  if (!hydrated || !user) return <PageSkeleton rows={2} />;

  const items = hydrated
    ? Object.keys(saved)
        .map((id) => getProductById(id))
        .filter((p): p is NonNullable<typeof p> => Boolean(p))
    : [];

  return (
    <div className="mx-auto max-w-7xl px-6 py-14">
      <p className="text-sm uppercase tracking-[0.3em] text-accent">Saved for later</p>
      <h1 className="mt-2 font-display text-4xl sm:text-5xl">Your Wishlist</h1>

      {items.length === 0 ? (
        <motion.div
          className="mt-16 flex flex-col items-center gap-4 py-16 text-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div className="rounded-full bg-cream-dark p-5 text-primary">
            <Heart size={32} />
          </div>
          <h2 className="font-display text-2xl">Your wishlist is empty</h2>
          <p className="max-w-sm text-sm text-foreground/60">
            Tap the heart icon on any saree, lehenga, kurta or sherwani to save
            it here for later.
          </p>
          <Link
            href="/shop"
            className="mt-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark"
          >
            Browse the Collection
          </Link>
        </motion.div>
      ) : (
        <div className="mt-10 sutra-cards grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((product, i) => (
            <ProductCard key={product.id} product={product} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
