"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { m as motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuthStore } from "@/lib/store/auth";
import {
  googleEnabled,
  inAppBrowser,
  loadGoogle,
  onGoogleCredential,
  type GoogleButtonOptions,
} from "@/lib/google";
import { nextPath } from "@/lib/utils";

/**
 * Mounted once in the root layout. Turns a Google credential, from One Tap or
 * the button on the sign-in card, into a Sutra session, and offers One Tap to
 * signed-out visitors who are already signed in to Google in this browser.
 * Someone who has used it here before is signed straight back in.
 */
export function GoogleOneTap() {
  const router = useRouter();
  const pathname = usePathname();
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const user = useAuthStore((s) => s.user);
  const loaded = useAuthStore((s) => s.loaded);
  const prompted = useRef(false);

  useEffect(() => {
    if (!googleEnabled) return;
    return onGoogleCredential(async (credential) => {
      const id = toast.loading("Signing you in with Google…");
      const result = await signInWithGoogle(credential);
      if (!result.ok) {
        toast.error(result.error, { id });
        return;
      }
      const first = useAuthStore.getState().user?.name.split(" ")[0];
      toast.success(first ? `Welcome, ${first}.` : "Welcome to Sutra.", { id });
      // From the sign-in card, carry on as a password sign-in would. Anywhere
      // else (One Tap over a product, say), stay on the page.
      const path = window.location.pathname;
      if (path === "/login" || path === "/signup") router.push(nextPath(window.location.search));
    });
  }, [router, signInWithGoogle]);

  useEffect(() => {
    // Wait for the session check, so a signed-in customer is never offered it.
    if (!googleEnabled || !loaded) return;
    if (user) {
      window.google?.accounts?.id?.cancel();
      return;
    }
    // Once per visit: Google itself backs off further when it is dismissed.
    if (prompted.current || pathname.startsWith("/admin")) return;
    prompted.current = true;
    // Google would only answer with an error page inside another app's browser.
    if (inAppBrowser(navigator.userAgent)) return;
    // Google's script is heavy for a phone: it waits until the page has loaded
    // and the phone is idle, so it never holds up the page itself.
    const prompt = () => {
      if (useAuthStore.getState().user) return;
      void loadGoogle().then((id) => id?.prompt());
    };
    const whenIdle = () =>
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback(prompt, { timeout: 4000 })
        : window.setTimeout(prompt, 1500);
    const later = () => window.setTimeout(whenIdle, 2500);
    if (document.readyState === "complete") later();
    else window.addEventListener("load", later, { once: true });
  }, [loaded, user, pathname]);

  return null;
}

/**
 * Google's own "Continue with Google" button, with an "or with email" rule
 * under it. When the browser is signed in to Google it reads "Continue as …"
 * with the account's name and photo. Renders nothing until a Client ID is set.
 */
export function GoogleButton({
  text = "continue_with",
  delay = 0,
}: {
  text?: GoogleButtonOptions["text"];
  delay?: number;
}) {
  const box = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  // undefined until checked in the browser; null in a real browser.
  const [trappedIn, setTrappedIn] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    setTrappedIn(inAppBrowser(navigator.userAgent));
  }, []);

  useEffect(() => {
    if (!googleEnabled || trappedIn !== null) return;
    let cancelled = false;
    void loadGoogle().then((id) => {
      const el = box.current;
      if (cancelled || !el) return;
      if (!id) {
        setFailed(true); // blocked by an extension or offline: the email form still works
        return;
      }
      id.renderButton(el, {
        theme: "filled_black",
        size: "large",
        shape: "pill",
        text,
        logo_alignment: "center",
        // Google draws it at a fixed width between 200 and 400px.
        width: Math.min(400, Math.max(200, Math.round(el.offsetWidth))),
      });
    });
    return () => {
      cancelled = true;
    };
  }, [text, trappedIn]);

  if (!googleEnabled || failed) return null;
  if (trappedIn) return <OpenInBrowser app={trappedIn} delay={delay} />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <div ref={box} className="flex min-h-[44px] justify-center [color-scheme:light]" />
      <p className="mt-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.22em] text-foreground/40 max-md:mt-4">
        <span className="h-px flex-1 bg-white/10" aria-hidden="true" />
        or with email
        <span className="h-px flex-1 bg-white/10" aria-hidden="true" />
      </p>
    </motion.div>
  );
}

/**
 * Shown in place of the Google button inside Instagram, Facebook and other
 * in-app browsers, where Google blocks sign-in. Android can hand the page
 * straight to Chrome; on iPhone the app's own menu has "Open in browser".
 */
function OpenInBrowser({ app, delay }: { app: string; delay: number }) {
  const [android, setAndroid] = useState(false);
  useEffect(() => setAndroid(/Android/i.test(navigator.userAgent)), []);

  const openInChrome = () => {
    const { host, pathname, search } = window.location;
    // Falls back to the phone's default browser where Chrome isn't installed.
    const fallback = encodeURIComponent(window.location.href);
    window.location.href = `intent://${host}${pathname}${search}#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${fallback};end`;
  };
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied. Paste it into Safari or Chrome.");
    } catch {
      toast.error("Couldn't copy. Use the menu to open this page in your browser.");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm text-foreground/70">
        <p>
          Google sign-in doesn&apos;t work inside {app === "this app" ? "this app" : `the ${app} app`}.{" "}
          {android
            ? "Open this page in Chrome to continue with Google."
            : "Tap the ••• menu and choose “Open in browser” to continue with Google."}
        </p>
        <button
          type="button"
          onClick={android ? openInChrome : copyLink}
          className="mt-3 rounded-full border border-accent/40 px-4 py-1.5 text-xs font-medium text-accent-light transition hover:bg-accent/10"
        >
          {android ? "Open in Chrome" : "Copy link"}
        </button>
      </div>
      <p className="mt-5 flex items-center gap-3 text-[11px] uppercase tracking-[0.22em] text-foreground/40 max-md:mt-4">
        <span className="h-px flex-1 bg-white/10" aria-hidden="true" />
        or with email
        <span className="h-px flex-1 bg-white/10" aria-hidden="true" />
      </p>
    </motion.div>
  );
}
