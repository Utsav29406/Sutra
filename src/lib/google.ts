/*
 * Google Identity Services in the browser: the "Continue with Google" button
 * and One Tap. Both hand back the same signed ID token, which goes to
 * /api/auth/google to become a Sutra session.
 *
 * Google's script allows one setup per page, so it is loaded and initialised
 * once here, and the token is passed to whichever handler is registered.
 */

export const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() ?? "";
/** Off until a Client ID is configured; nothing Google-related renders then. */
export const googleEnabled = googleClientId !== "";

export interface GoogleButtonOptions {
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  shape?: "rectangular" | "pill" | "circle" | "square";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  width?: number;
  logo_alignment?: "left" | "center";
}

interface GoogleId {
  initialize(options: Record<string, unknown>): void;
  prompt(): void;
  cancel(): void;
  renderButton(parent: HTMLElement, options: GoogleButtonOptions): void;
  disableAutoSelect(): void;
}

declare global {
  interface Window {
    google?: { accounts?: { id?: GoogleId } };
  }
}

let handler: ((credential: string) => void) | null = null;
let loading: Promise<GoogleId | null> | null = null;

/** Sends every credential to `fn` until the returned function is called. */
export function onGoogleCredential(fn: (credential: string) => void) {
  handler = fn;
  return () => {
    if (handler === fn) handler = null;
  };
}

export function loadGoogle(): Promise<GoogleId | null> {
  if (!googleEnabled || typeof window === "undefined") return Promise.resolve(null);
  loading ??= new Promise((resolve) => {
    const ready = () => {
      const id = window.google?.accounts?.id ?? null;
      id?.initialize({
        client_id: googleClientId,
        callback: (response: { credential?: string }) => {
          if (response.credential) handler?.(response.credential);
        },
        // Someone who has used Google here before is signed in without a tap.
        auto_select: true,
        cancel_on_tap_outside: false,
        context: "signin",
        itp_support: true,
        use_fedcm_for_prompt: true,
      });
      resolve(id);
    };
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = ready;
    script.onerror = () => {
      loading = null; // try again on the next page that asks
      resolve(null);
    };
    document.head.appendChild(script);
  });
  return loading;
}

/*
 * Google refuses to sign anyone in from inside another app's built-in browser
 * (error 403 disallowed_useragent), which is where a link opened from
 * Instagram or Facebook lands. Spotting those lets the sign-in card say so
 * up front instead of showing a button that ends on Google's error page.
 * WhatsApp and Gmail open links in the real browser, so they need nothing.
 */
const IN_APP_BROWSERS: Array<[RegExp, string]> = [
  [/Instagram/i, "Instagram"],
  [/FBAN\/Messenger|FB_IAB\/MESSENGER/i, "Messenger"],
  [/FBAN|FBAV|FB_IAB/i, "Facebook"],
  [/LinkedInApp/i, "LinkedIn"],
  [/Snapchat/i, "Snapchat"],
  [/\bLine\//, "LINE"],
  [/musical_ly|BytedanceWebview|TikTok/i, "TikTok"],
  [/Pinterest/i, "Pinterest"],
  [/Barcelona/, "Threads"],
  // Any other Android app showing the page in a plain WebView.
  [/Android.*; wv\)/, "this app"],
  // Any other iPhone app: real iOS browsers (Safari, Chrome, Firefox, Edge)
  // all carry a "Safari/" token, an app's built-in WebView doesn't.
  [/\b(iPhone|iPad|iPod)\b(?!.*Safari\/)/, "this app"],
];

/** The app whose built-in browser this is, or null in a real browser. */
export function inAppBrowser(userAgent: string): string | null {
  for (const [pattern, name] of IN_APP_BROWSERS) if (pattern.test(userAgent)) return name;
  return null;
}

/** After signing out: don't let One Tap sign the same account straight back in. */
export function stopGoogleAutoSignIn() {
  if (typeof window !== "undefined") window.google?.accounts?.id?.disableAutoSelect();
}
