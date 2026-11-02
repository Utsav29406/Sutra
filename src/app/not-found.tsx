import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Page not found — Sutra" };

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-24 text-center">
      <p className="text-sm uppercase tracking-[0.3em] text-accent">404</p>
      <h1 className="mt-2 font-display text-4xl">We couldn&#39;t find that page</h1>
      <p className="mt-4 text-foreground/70">
        The piece you&#39;re looking for may have sold out or moved. Explore the
        rest of the collection instead.
      </p>
      <Link
        href="/shop"
        className="mt-8 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark"
      >
        Back to Shop
      </Link>
    </div>
  );
}
