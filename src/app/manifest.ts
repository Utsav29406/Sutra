import type { MetadataRoute } from "next";

/*
 * Makes Sutra installable from the browser ("Install app" / "Add to Home
 * Screen"): it then opens full screen from its own icon, like a store app.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Sutra — Indian Traditional Wear",
    short_name: "Sutra",
    description: "Handpicked sarees, lehengas, kurtas and sherwanis, crafted by master weavers across India.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#1a1416",
    theme_color: "#1a1416",
    categories: ["shopping", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    // Long-press the home-screen icon for these.
    shortcuts: [
      { name: "Shop", url: "/shop", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "Wishlist", url: "/wishlist", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
      { name: "My orders", url: "/account", icons: [{ src: "/icons/icon-192.png", sizes: "192x192" }] },
    ],
  };
}
