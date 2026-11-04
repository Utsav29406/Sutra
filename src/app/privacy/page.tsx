import type { Metadata } from "next";
import Link from "next/link";
import { LegalList, LegalPage, LegalSection } from "@/components/LegalPage";

export const metadata: Metadata = {
  title: "Privacy Policy — Sutra",
  description: "What Sutra collects, why, who helps run the shop, and how to have your data removed.",
  alternates: { canonical: "/privacy" },
};

/*
 * Kept to what the code does: the users, orders, order_items, reviews and
 * otp_* tables, the session cookie, the browser-only stores, and the services
 * the server calls. Update it when any of those change.
 */
export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="4 November 2026">
      <p>
        This explains what Sutra (wearsutra.vercel.app) collects when you use it, why, and what you can ask us to do
        with it. We collect only what is needed to run your account and your orders, and we never sell it.
      </p>

      <LegalSection title="What we collect">
        <LegalList
          items={[
            <><strong className="text-foreground">Your account:</strong> name, email address and, if you give it, your mobile number. Your password is stored only as a one-way bcrypt hash, never as the password itself.</>,
            <><strong className="text-foreground">Sign in with Google:</strong> your name and email address from Google, and nothing else. We do not see your Google password, contacts or any other Google data.</>,
            <><strong className="text-foreground">Your orders:</strong> the name, phone number and delivery address you enter at checkout, the pieces, sizes and prices, and the order status. Payment is cash on delivery, so we never handle card or bank details.</>,
            <><strong className="text-foreground">Reviews:</strong> the name, rating and text you post, which are shown publicly on the product page.</>,
            <><strong className="text-foreground">Password reset:</strong> a one-time code, stored only in hashed form and only until it expires, plus a count of wrong attempts so the code cannot be guessed.</>,
          ]}
        />
      </LegalSection>

      <LegalSection title="Cookies and storage on your device">
        <p>
          When you sign in we set one cookie, <code className="text-accent-light">sutra_session</code>, which keeps you signed in for up
          to 30 days. It is needed for your account to work. Your bag, wishlist and recently viewed pieces are kept in your
          browser&apos;s own storage and are not sent to us until you place an order. We use no advertising or tracking
          cookies.
        </p>
      </LegalSection>

      <LegalSection title="How we use it">
        <LegalList
          items={[
            "To run your account and keep you signed in.",
            "To take, track and deliver your orders, and to email you order confirmations and status updates.",
            "To email you a one-time code when you reset your password.",
            "To email you when there is a new sign-in to your account, with the device, approximate location and IP address of that sign-in, so you can spot one that was not you. These details go into the email only; we do not store them.",
          ]}
        />
      </LegalSection>

      <LegalSection title="Services that help run Sutra">
        <p>These providers process data on our behalf, only for the purposes above:</p>
        <LegalList
          items={[
            <><strong className="text-foreground">Vercel</strong> hosts the website.</>,
            <><strong className="text-foreground">Neon</strong> hosts the database with your account, orders and reviews (in the United States).</>,
            <><strong className="text-foreground">Google</strong> provides Sign in with Google, and answers the shopping assistant in the chat window (Gemini). Anything you type into the chat is sent to Google to produce the reply, so please do not share personal details there.</>,
            <><strong className="text-foreground">Cloudflare Turnstile</strong> checks that sign-ups and password resets come from a person, not a bot.</>,
            <><strong className="text-foreground">Our email provider</strong> delivers the emails described above.</>,
          ]}
        />
      </LegalSection>

      <LegalSection title="How long we keep it">
        <p>
          Your account and orders are kept until you ask us to delete them. Password reset codes expire within minutes.
          Signing out ends your session straight away.
        </p>
      </LegalSection>

      <LegalSection title="Your choices">
        <p>
          You can ask to see, correct or delete your account and order history at any time by emailing{" "}
          <a className="text-primary underline-offset-4 hover:underline" href="mailto:hello@sutra.in">hello@sutra.in</a> from
          the address on your account. If you signed in with Google, you can also remove Sutra&apos;s access from your
          Google Account settings under Security, then Your connections to third-party apps and services.
        </p>
      </LegalSection>

      <LegalSection title="Security">
        <p>
          The site is served only over HTTPS. Passwords are hashed with bcrypt, sign-in attempts and reset codes are
          rate-limited, and only you and the shop&apos;s administrator can see your orders.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          If this policy changes, the new version will be posted here with a new date. See also our{" "}
          <Link className="text-primary underline-offset-4 hover:underline" href="/terms">Terms of Service</Link>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
