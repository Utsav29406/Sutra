import type { Metadata } from "next";
import FestivalStore from "@/sutra-mobile/festival/FestivalStore";

export const metadata: Metadata = {
  title: "Festival Store — Sutra",
  description: "Pieces picked for the festival running now, at festival prices with free delivery.",
  alternates: { canonical: "/festival" },
  // Open only a few days a year; the rest of the time it says "no festival
  // store open right now", which search engines treat as an empty page.
  robots: { index: false, follow: true },
  openGraph: { title: "Festival Store — Sutra", description: "Pieces picked for the festival running now, at festival prices with free delivery.", url: "/festival", images: ["/opengraph-image"] },
};

export default function FestivalPage() {
  return <FestivalStore />;
}
