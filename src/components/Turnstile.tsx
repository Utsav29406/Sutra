"use client";

import { useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";

/*
 * Cloudflare Turnstile widget, the browser half of lib/server/turnstile.ts.
 *
 * Always shown, so visitors can see the forms are protected. Most pass on their
 * own within a second or two (the box ticks itself); only when Cloudflare is
 * unsure does it ask for a click. Tokens are single-use, so a form calls reset()
 * after each submit to have a fresh one ready for the next.
 *
 * Renders nothing until NEXT_PUBLIC_TURNSTILE_SITE_KEY is set; the server skips
 * its check until TURNSTILE_SECRET_KEY is set, so the two switch on together.
 */

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY?.trim() ?? "";
const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

/** Width of Cloudflare's normal-size box; narrower spaces get the compact one. */
const NORMAL_WIDTH = 300;

/** Whether forms should wait for a token before submitting. */
export const captchaEnabled = SITE_KEY !== "";

export interface TurnstileHandle {
  reset: () => void;
}

interface TurnstileApi {
  render: (el: HTMLElement, options: Record<string, unknown>) => string;
  reset: (id: string) => void;
  remove: (id: string) => void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

// One script for the whole site, however many widgets mount.
let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  if (window.turnstile) return Promise.resolve(window.turnstile);
  scriptPromise ??= new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject(new Error("turnstile missing")));
    script.onerror = () => {
      scriptPromise = null; // let a later mount try again
      reject(new Error("turnstile script failed to load"));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function Turnstile({
  onToken,
  ref,
  shownClassName = "",
}: {
  /** Called with a fresh token, or "" when the current one expires or fails. */
  onToken: (token: string) => void;
  ref?: Ref<TurnstileHandle>;
  /** Spacing applied once the box is drawn, so nothing jumps while the script loads. */
  shownClassName?: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  const wrapper = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  const widget = useRef<string | null>(null);
  // The latest callback, without re-rendering the widget when the parent re-renders.
  const tokenCallback = useRef(onToken);
  useEffect(() => {
    tokenCallback.current = onToken;
  });

  useImperativeHandle(ref, () => ({
    reset() {
      tokenCallback.current("");
      if (widget.current && window.turnstile) window.turnstile.reset(widget.current);
    },
  }));

  useEffect(() => {
    if (!captchaEnabled) return;
    let cancelled = false;

    loadTurnstile()
      .then((api) => {
        if (cancelled || !container.current) return;
        // The normal box is a fixed 300px. On most phones the form column is
        // narrower, and the box stretched the whole form past the card's edge,
        // clipping the fields and button. Cloudflare's compact box (150px) fits.
        const room = wrapper.current?.clientWidth ?? NORMAL_WIDTH;
        widget.current = api.render(container.current, {
          sitekey: SITE_KEY,
          theme: "dark",
          appearance: "always",
          size: room >= NORMAL_WIDTH ? "normal" : "compact",
          callback: (token: string) => tokenCallback.current(token),
          "expired-callback": () => tokenCallback.current(""),
          "error-callback": () => tokenCallback.current(""),
        });
      })
      .catch((error) => console.error("[turnstile]", error));

    // The widget is 0px tall until Cloudflare's script draws it; follow its height
    // so the spacing arrives with the box rather than before it.
    const observer = new ResizeObserver(() => setShown((container.current?.offsetHeight ?? 0) > 0));
    if (container.current) observer.observe(container.current);

    return () => {
      cancelled = true;
      observer.disconnect();
      if (widget.current && window.turnstile) window.turnstile.remove(widget.current);
      widget.current = null;
    };
  }, []);

  if (!captchaEnabled) return null;
  return (
    <div ref={wrapper} className={shown ? shownClassName : undefined}>
      <div ref={container} className="flex justify-center" />
    </div>
  );
}
