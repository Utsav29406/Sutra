import type { Metadata } from "next";
import FestivalStore from "@/sutra-mobile/festival/FestivalStore";

export const metadata: Metadata = {
  title: "Festival Store — Sutra",
  description: "Pieces picked for the festival running now, at festival prices with free delivery.",
  alternates: { canonical: "/festival" },
  openGraph: { title: "Festival Store — Sutra", description: "Pieces picked for the festival running now, at festival prices with free delivery.", url: "/festival", images: ["/opengraph-image"] },
};

export default function FestivalPage() {
  return <FestivalStore />;
}
