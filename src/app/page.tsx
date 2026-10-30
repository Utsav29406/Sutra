import type { Metadata } from "next";
import { SITE_ALT_NAMES, SITE_NAME, SITE_URL, jsonLd } from "@/lib/site";
import HomeClient from "./HomeClient";

// The home page itself is client-side (HomeClient); this server wrapper only
// adds what a client component can't: its canonical address and the site's
// name for Google's results, which Google reads from the home page alone.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

const WEBSITE_JSON_LD = jsonLd({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  alternateName: SITE_ALT_NAMES,
  url: `${SITE_URL}/`,
});

export default function HomePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: WEBSITE_JSON_LD }} />
      <HomeClient />
    </>
  );
}
