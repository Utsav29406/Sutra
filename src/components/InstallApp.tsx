"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, m as motion } from "framer-motion";
import { Download, EllipsisVertical, PlusSquare, Share, X } from "lucide-react";
import { SutraMark } from "@/components/Logo";
import { useInstallStore } from "@/lib/store/install";
import { MOBILE_BAR_HIDDEN } from "@/sutra-mobile/MobileTabBar";

/*
 * "Get the app" on phones. Sutra has no Play Store app; instead the site
 * installs itself to the home screen (manifest.ts, public/sw.js) and opens
 * full screen from its own icon.
 *
 * - A card just under the navbar offers it once, a few seconds in, where the
 *   browser can install or the phone is an iPhone (up top, so Google's
 *   sign-in sheet at the bottom never covers it). Closing it keeps it away
 *   for two weeks.
 * - The footer's "Install the app" (InstallAppButton) is there any time.
 * - iPhones, and browsers with no install prompt, get a sheet with the steps.
 */

const DISMISS_KEY = "sutra-install-dismissed";
const QUIET_DAYS = 14;

function dismissedRecently() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return at > 0 && Date.now() - at < QUIET_DAYS * 86_400_000;
  } catch {
    return false;
  }
}

export default function InstallApp() {
  const pathname = usePathname();
  const { prompt, standalone, ios, install } = useInstallStore();
  const [ready, setReady] = useState(false);
  const [closed, setClosed] = useState(true);

  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    setClosed(dismissedRecently());
    const t = window.setTimeout(() => setReady(true), 6000);
    return () => window.clearTimeout(t);
  }, []);

  function close() {
    setClosed(true);
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {}
  }

  const show = ready && !closed && !standalone && (!!prompt || ios) && !MOBILE_BAR_HIDDEN(pathname);

  return (
    <>
      <AnimatePresence>
        {show && (
          <motion.aside
            aria-label="Install the Sutra app"
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
            className="fixed inset-x-2.5 top-[calc(var(--sutra-header-h,5rem)+0.5rem)] z-[41] flex items-center gap-3 rounded-[20px] border border-accent-light/55 bg-cream-dark/95 p-3 pr-2 shadow-[0_0_0_1px_rgb(212_175_55/0.12),0_14px_38px_-12px_rgba(0,0,0,0.9)] backdrop-blur-xl md:hidden print:hidden"
          >
            <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[12px] bg-cream ring-1 ring-white/10">
              <SutraMark className="h-8 w-8 text-primary" />
            </span>
            <span className="min-w-0 flex-1">
              <b className="block text-[13.5px] font-semibold leading-tight">Get the Sutra app</b>
              <span className="block text-[11.5px] leading-snug text-foreground/60">
                Opens from your home screen. No Play Store needed.
              </span>
            </span>
            <button
              type="button"
              onClick={() => {
                close();
                void install();
              }}
              className="sutra-goldpill shrink-0"
            >
              Install
            </button>
            <button
              type="button"
              onClick={close}
              aria-label="Not now"
              className="shrink-0 rounded-full p-1.5 text-foreground/50 transition-colors hover:text-foreground"
            >
              <X size={16} aria-hidden="true" />
            </button>
          </motion.aside>
        )}
      </AnimatePresence>
      <InstallSheet />
    </>
  );
}

/** Footer link: phones only, hidden inside the installed app. */
export function InstallAppButton({ className = "" }: { className?: string }) {
  const { standalone, install } = useInstallStore();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || standalone) return null;
  return (
    <button
      type="button"
      onClick={() => void install()}
      className={`inline-flex items-center gap-1.5 hover:text-primary md:hidden ${className}`}
    >
      <Download size={14} aria-hidden="true" />
      Install the app
    </button>
  );
}

/** The steps, for phones where the browser has no install prompt to show. */
function InstallSheet() {
  const { sheetOpen, setSheet, ios } = useInstallStore();

  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheet(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheetOpen, setSheet]);

  const steps = ios
    ? [
        { icon: Share, text: <>Tap <b>Share</b> in Safari&apos;s toolbar</> },
        { icon: PlusSquare, text: <>Choose <b>Add to Home Screen</b></> },
        { icon: Download, text: <>Tap <b>Add</b>. Sutra appears with your apps</> },
      ]
    : [
        { icon: EllipsisVertical, text: <>Open your browser&apos;s <b>menu</b> (⋮)</> },
        { icon: Download, text: <>Tap <b>Install app</b> or <b>Add to Home screen</b></> },
        { icon: PlusSquare, text: <>Confirm. Sutra appears with your apps</> },
      ];

  return (
    <AnimatePresence>
      {sheetOpen && (
        <div className="fixed inset-0 z-[10002] flex items-end justify-center print:hidden" role="dialog" aria-modal="true" aria-labelledby="sutra-install-title">
          <motion.button
            type="button"
            aria-label="Close"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSheet(false)}
            className="absolute inset-0 bg-black/60"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: "easeOut" }}
            className="relative w-full max-w-md rounded-t-[24px] border-t border-accent-light/40 bg-cream-dark px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-5"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-[13px] bg-cream ring-1 ring-white/10">
                <SutraMark className="h-9 w-9 text-primary" />
              </span>
              <div className="min-w-0 flex-1">
                <h2 id="sutra-install-title" className="font-display text-xl leading-tight">
                  Install Sutra
                </h2>
                <p className="text-xs text-foreground/60">Free, takes a few seconds, no Play Store needed.</p>
              </div>
              <button
                type="button"
                onClick={() => setSheet(false)}
                aria-label="Close"
                className="rounded-full p-2 text-foreground/60 hover:bg-white/10"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <ol className="mt-5 grid gap-2.5">
              {steps.map(({ icon: Icon, text }, i) => (
                <li key={i} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-sm">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-accent-light/15 text-accent-light">
                    <Icon size={16} aria-hidden="true" />
                  </span>
                  <span className="text-foreground/85">{text}</span>
                </li>
              ))}
            </ol>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
