import type { Metadata } from "next";
import ShopClient from "./ShopClient";

export const metadata: Metadata = {
  title: "Shop — Sutra",
  description: "Browse the full Sutra collection of sarees, lehengas, kurtas and sherwanis.",
  alternates: { canonical: "/shop" },
  openGraph: { title: "Shop — Sutra", description: "Browse the full Sutra collection of sarees, lehengas, kurtas and sherwanis.", url: "/shop", images: ["/opengraph-image"] },
};

export default function ShopPage() {
  return <ShopClient />;
}
