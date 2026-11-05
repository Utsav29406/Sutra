import type { Metadata } from "next";
import CircleClient from "./CircleClient";

export const metadata: Metadata = {
  title: "Sutra Gold — Sutra",
  description: "Free membership: free delivery from ₹2,999, member prices up to 10% off, and festival prices early.",
  alternates: { canonical: "/gold" },
  openGraph: {
    title: "Sutra Gold — Sutra",
    description: "Free membership: free delivery from ₹2,999, member prices up to 10% off, and festival prices early.",
    url: "/gold",
    images: ["/opengraph-image"],
  },
};

export default function CirclePage() {
  return <CircleClient />;
}
