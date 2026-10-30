import type { Metadata } from "next";
import { Cormorant_Garamond, Jost, Playfair_Display, Poppins } from "next/font/google";
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
import { FESTIVAL_CSS, FESTIVAL_GATE } from "@/sutra-mobile/festival/gate";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import ChatWidget from "@/components/ChatWidget";
import SiteBackdrop from "@/components/SiteBackdrop";
import Press from "@/components/Press";
import DataBootstrap from "@/components/DataBootstrap";
import { GoogleOneTap } from "@/components/GoogleSignIn";
import { Notifications } from "@/components/Notifications";
import FestivalTeaser from "@/components/FestivalTeaser";
import { SITE_ALT_NAMES, SITE_NAME, SITE_URL, jsonLd } from "@/lib/site";

const playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

/* Hero-only pairing. Cormorant carries the couture contrast the headline wants;
   Jost sets the two eyebrows in a single voice. The rest of the site stays on
   Playfair + Poppins. */
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-jost",
  display: "swap",
  // Small labels only: fetched when used, not ahead of the page's main fonts.
  preload: false,
});

const DESCRIPTION =
  "Handpicked sarees, lehengas, kurtas and sherwanis — crafted by master weavers across India, delivered to your doorstep.";

export const metadata: Metadata = {
  // Lets every page give paths ("/images/…") where Google and link previews need full URLs.
  metadataBase: new URL(SITE_URL),
  title: "Sutra — Indian Traditional Wear",
  description: DESCRIPTION,
  applicationName: "Sutra",
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
        className={`${playfairDisplay.variable} ${poppins.variable} ${cormorant.variable} ${jost.variable} font-sans flex min-h-screen flex-col bg-cream text-foreground antialiased`}
      >
        {/* Decides before the first paint whether the opening intro plays. */}
        <script dangerouslySetInnerHTML={{ __html: INTRO_GATE }} />
        {/* Marks the festival running now, so phones get its look from the first paint. */}
        <script dangerouslySetInnerHTML={{ __html: FESTIVAL_GATE }} />
        <style dangerouslySetInnerHTML={{ __html: FESTIVAL_CSS }} />
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
          <Press />
          <Notifications />
          <FestivalTeaser />
        </MotionProvider>
      </body>
    </html>
  );
}
