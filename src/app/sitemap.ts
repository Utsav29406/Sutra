import type { MetadataRoute } from "next";
import { products } from "@/lib/products";
import { SITE_URL, absoluteUrl } from "@/lib/site";

/*
 * /sitemap.xml: every page Google should know about, with each product's
 * photo so the pieces can turn up in Google Images too. Submitted once in
 * Google Search Console; Google re-reads it by itself after that.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/shop`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/festival`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/our-story`, changeFrequency: "monthly", priority: 0.6 },
  ];
  const pieces: MetadataRoute.Sitemap = products.map((p) => ({
    url: `${SITE_URL}/product/${p.slug}`,
    lastModified: p.createdAt,
    changeFrequency: "monthly",
    priority: 0.8,
    images: p.images.map(absoluteUrl),
  }));
  return [...pages, ...pieces];
}
