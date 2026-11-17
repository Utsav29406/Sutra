import type { Metadata, Viewport } from "next";
/*
 * Fonts are installed from npm (Fontsource: the same Google Fonts files, split
 * into the same character sets with unicode-range), so the build never has to
 * download them - next/font/google did, and a failed download failed the
 * whole deploy. The families and their size-matched fallbacks are set as CSS
 * variables in globals.css.
 *   Playfair Display (headings), Poppins (body, with Devanagari for the photo
 *   credits), and the hero pairing: Cormorant Garamond + Jost.
 */
import "@fontsource-variable/playfair-display/wght.css";
import "@fontsource/poppins/300.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/poppins/700.css";
import "@fontsource/cormorant-garamond/300.css";
import "@fontsource/cormorant-garamond/400.css";
import "@fontsource/cormorant-garamond/300-italic.css";
import "@fontsource/cormorant-garamond/400-italic.css";
import "@fontsource/jost/300.css";
import "@fontsource/jost/400.css";
import "@fontsource/jost/500.css";
import "./globals.css";
// Phone-only styles, after the shared ones so they win at equal specificity.
import "@/sutra-mobile/sutra-mobile.css";
import Header from "@/components/Header";
import MobileTabBar from "@/sutra-mobile/MobileTabBar";
import IntroSplash from "@/components/IntroSplash";
import MotionProvider from "@/components/MotionProvider";
import { INTRO_GATE } from "@/lib/intro";
import { THEME_GATE } from "@/lib/festival-theme";
import { DiwaliDefs } from "@/components/DiwaliDecor";
import { FESTIVAL_GATE } from "@/lib/festival-gate";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import ChatWidget from "@/components/ChatWidget";
import OffersButton from "@/components/OffersButton";
import SiteBackdrop from "@/components/SiteBackdrop";
import Press from "@/components/Press";
import DataBootstrap from "@/components/DataBootstrap";
import { GoogleOneTap } from "@/components/GoogleSignIn";
import { Notifications } from "@/components/Notifications";
import FestivalTeaser from "@/components/FestivalTeaser";
import InstallApp from "@/components/InstallApp";
import { SITE_ALT_NAMES, SITE_NAME, SITE_URL, jsonLd } from "@/lib/site";

const DESCRIPTION =
  "Handpicked sarees, lehengas, kurtas and sherwanis — crafted by master weavers across India, delivered to your doorstep.";

export const metadata: Metadata = {
  // Lets every page give paths ("/images/…") where Google and link previews need full URLs.
  metadataBase: new URL(SITE_URL),
  title: "Sutra — Indian Traditional Wear",
  description: DESCRIPTION,
  applicationName: "Sutra",
  // Added to an iPhone's home screen, Sutra opens full screen under this name.
  appleWebApp: { capable: true, title: "Sutra", statusBarStyle: "black" },
  openGraph: {
    type: "website",
    siteName: "Sutra",
    locale: "en_IN",
    title: "Sutra — Indian Traditional Wear",
    description: DESCRIPTION,
  },
  twitter: { card: "summary_large_image" },
  // Google Search Console's ownership check (the HTML tag method).
  verification: process.env.GOOGLE_SITE_VERIFICATION?.trim()
    ? { google: process.env.GOOGLE_SITE_VERIFICATION.trim() }
    : undefined,
};

// The browser bar's colour on phones, and the installed app's.
export const viewport: Viewport = { themeColor: "#1a1416" };

/*
 * Tells Google what Sutra is, on every page. The site's name for search
 * results (WebSite) lives on the home page only, as Google asks.
 */
const SITE_JSON_LD = jsonLd({
  "@context": "https://schema.org",
  "@type": "OnlineStore",
  name: SITE_NAME,
  alternateName: SITE_ALT_NAMES,
  url: `${SITE_URL}/`,
  logo: `${SITE_URL}/apple-icon.png`, // 180px; Google wants at least 112px
  description: DESCRIPTION,
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`font-sans flex min-h-screen flex-col bg-cream text-foreground antialiased`}
      >
        {/* Decides before the first paint whether the opening intro plays. */}
        <script dangerouslySetInnerHTML={{ __html: INTRO_GATE }} />
        {/* Marks the festival running now, so the hero shows the right line from the first paint. */}
        <script dangerouslySetInnerHTML={{ __html: FESTIVAL_GATE }} />
        {/* Turns the festival theme on while its dates run (lib/festival-theme). */}
        <script dangerouslySetInnerHTML={{ __html: THEME_GATE }} />
        <DiwaliDefs />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: SITE_JSON_LD }} />
        <MotionProvider>
          <IntroSplash />
          <SiteBackdrop />
          <DataBootstrap />
          <GoogleOneTap />
          {/* `contents`: the header is sticky, and a plain wrapper box would pin
              it to its own height, so it scrolled away with the page. The
              wrapper is only here to hide it when printing an invoice. */}
          <div className="contents print:hidden">
            <Header />
          </div>
          <main className="flex-1">{children}</main>
          <div className="print:hidden">
            <Footer />
          </div>
          <MobileTabBar />
          <CartDrawer />
          <ChatWidget />
          {/* Tablets and up: Offers at the bottom-left, opposite the chat. */}
          <OffersButton floating className="max-md:hidden print:hidden" />
          <Press />
          <Notifications />
          <FestivalTeaser />
          <InstallApp />
        </MotionProvider>
      </body>
    </html>
  );
}
