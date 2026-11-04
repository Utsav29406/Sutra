import type { Metadata } from "next";
import Link from "next/link";
import { LegalList, LegalPage, LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Terms of Service — Sutra",
  description: "The terms for using Sutra: accounts, orders, prices and offers, delivery and returns.",
  alternates: { canonical: "/terms" },
};

/* Kept in line with what the shop says elsewhere: cash on delivery, 7-day returns on unworn pieces, festival offers by date. */
export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="4 November 2026">
      <p>
        These terms apply when you use Sutra (wearsutra.vercel.app). By creating an account or placing an order you agree
        to them.
      </p>

      <LegalSection title="Your account">
        <LegalList
          items={[
            "Give your real name and an email address you can receive mail at.",
            "Keep your password to yourself. You are responsible for what happens under your account.",
            "If you sign in with Google, the email address on your Google account is the one we use.",
            "We may close accounts used to abuse the shop, for example with fake orders.",
          ]}
        />
      </LegalSection>

      <LegalSection title="Orders and prices">
        <LegalList
          items={[
            "Prices are in Indian rupees and include taxes.",
            "Your order is placed once it appears under My Account, and we email you a confirmation.",
            "Pieces are handmade, so colour and pattern can differ slightly from the photos.",
            "We may cancel an order if a piece turns out to be unavailable or a price was shown in error, and we will tell you if we do.",
          ]}
        />
      </LegalSection>

      <LegalSection title="Offers and codes">
        <p>
          Festival offers, such as the Diwali offer, apply automatically on the dates shown on the site, and while one runs
          discount codes cannot be added to it. Codes apply only as described next to them and cannot be exchanged for cash.
        </p>
      </LegalSection>

      <LegalSection title="Payment, delivery and returns">
        <LegalList
          items={[
            "Payment is cash on delivery.",
            "You can return any unworn piece within 7 days of delivery.",
          ]}
        />
      </LegalSection>

      <LegalSection title="Reviews">
        <p>
          Reviews you post must be your own honest opinion of a piece. We may remove reviews that are abusive, off-topic or
          not about the piece.
        </p>
      </LegalSection>

      <LegalSection title="Photos and content">
        <p>
          Some product photos are used under Creative Commons licences and are credited on each product page. Please do
          not copy the site&apos;s own text or design for other uses without asking.
        </p>
      </LegalSection>

      <LegalSection title="Changes and contact">
        <p>
          If these terms change, the new version will be posted here with a new date. Questions:{" "}
          <a className="text-primary underline-offset-4 hover:underline" href="mailto:hello@sutra.in">hello@sutra.in</a>.
          How we handle your data is described in our{" "}
          <Link className="text-primary underline-offset-4 hover:underline" href="/privacy">Privacy Policy</Link>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
