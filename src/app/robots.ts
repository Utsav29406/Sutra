import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";

/*
 * /robots.txt. Search engines may read every shop page; the private ones
 * (account, checkout, orders, admin) are also marked noindex in their layouts.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/admin", "/account", "/checkout", "/order/", "/wishlist", "/forgot-password"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
