"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type ReactNode } from "react";
import { m as motion } from "framer-motion";
import toast from "react-hot-toast";
import { useAuthStore } from "@/lib/store/auth";
import {
  AuthFrame,
  AuthHeading,
  AuthTextField,
  AuthPasswordField,
  PasswordStrength,
  authButtonClass,
  useEntranceDelay,
} from "@/components/AuthShell";
import { Turnstile, captchaEnabled, type TurnstileHandle } from "@/components/Turnstile";
import { GoogleButton } from "@/components/GoogleSignIn";
import { nextPath } from "@/lib/utils";

/**
 * Sign in and create account as two sides of one card, with a soft turn between
 * them: the outgoing form slides off left and fades, the incoming one slides in
 * from the right while its knot spins once, and the card eases to the new height.
 *
 * /login and /signup stay real pages. Switching sides pushes the other URL, and
 * the side shown is read from the pathname, so the address bar, a refresh, the
 * back button and the header's own links all agree with what is on screen.
 */

type Side = "in" | "up";

function sideFor(pathname: string): Side {
  return pathname.startsWith("/signup") ? "up" : "in";
}

// Server render has no layout to measure; useEffect there is a harmless no-op.
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export function AuthFlip() {
  const pathname = usePathname();
  const side = sideFor(pathname);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const loaded = useAuthStore((s) => s.loaded);

  // Already signed in (the server says so): nothing to do here, so carry on
  // to wherever the visitor was headed, e.g. checkout after "Buy Now".
  useEffect(() => {
    if (loaded && user) router.replace(nextPath(window.location.search));
  }, [loaded, user, router]);

  // Keeps ?next= across the switch, so a customer sent here from a gated action
  // still returns to it whichever form they finish on.
  const [search, setSearch] = useState("");
  useEffect(() => setSearch(window.location.search), [pathname]);

  const faces = useRef<Record<Side, HTMLDivElement | null>>({ in: null, up: null });
  const [height, setHeight] = useState<number | null>(null);

  // Track the showing side's height: it changes when the side does, and also
  // inside a side (the strength note under a new password).
  useIsoLayoutEffect(() => {
    const el = faces.current[side];
    if (!el) return;
    setHeight(el.offsetHeight);
    const ro = new ResizeObserver(() => setHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, [side]);

  function turnTo(next: Side) {
    return (e: MouseEvent<HTMLAnchorElement>) => {
      // Leave modified clicks alone, so open-in-new-tab still works.
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      // Next keeps usePathname in step with a native pushState, which is what
      // flips the side. No route change, so the card stays mounted and turns.
      window.history.pushState(null, "", `${next === "up" ? "/signup" : "/login"}${search}`);
      // Follow the turn with focus, on the heading rather than an input so a
      // phone does not throw its keyboard up mid-animation.
      window.setTimeout(() => {
        faces.current[next]?.querySelector<HTMLElement>("h1")?.focus({ preventScroll: true });
      }, 350);
    };
  }

  const face = (which: Side, content: ReactNode) => {
    const active = side === which;
    const offset = which === "in" ? "-translate-x-7" : "translate-x-7";
    return (
      <div
        ref={(el) => {
          faces.current[which] = el;
        }}
        inert={!active}
        aria-hidden={!active}
        className={`col-start-1 row-start-1 self-start transition-[opacity,transform] duration-[350ms,450ms] ease-[cubic-bezier(0.22,0.7,0.2,1)] motion-reduce:transition-none ${
          active ? "opacity-100" : `pointer-events-none opacity-0 ${offset}`
        }`}
      >
        {content}
      </div>
    );
  };

  return (
    <AuthFrame entrance="thread">
      {/* -mx-4 px-4: the clip reaches out into the card's padding, because
          Google's button frame is 10px wider than the form on each side and
          some phones draw the button into that margin; clipped at the form's
          edge its rounded left end was cut flat. */}
      <div
        className="-mx-4 grid overflow-hidden px-4 transition-[height] duration-500 ease-[cubic-bezier(0.22,0.7,0.2,1)] motion-reduce:transition-none"
        style={height === null ? undefined : { height }}
      >
        {face(
          "in",
          <>
            <AuthHeading eyebrow="Welcome Back" title="Sign In" spin={side === "in"} />
            <SignInForm />
            <SwitchLine prompt="New to Sutra?" label="Create an account" href={`/signup${search}`} onClick={turnTo("up")} />
          </>
        )}
        {face(
          "up",
          <>
            <AuthHeading eyebrow="Join Us" title="Create Account" spin={side === "up"} />
            <SignUpForm active={side === "up"} />
            <SwitchLine prompt="Already have an account?" label="Sign in" href={`/login${search}`} onClick={turnTo("in")} />
          </>
        )}
      </div>
    </AuthFrame>
  );
}

function SwitchLine({
  prompt,
  label,
  href,
  onClick,
}: {
  prompt: string;
  label: string;
  href: string;
  onClick: (e: MouseEvent<HTMLAnchorElement>) => void;
}) {
  const hold = useEntranceDelay();
  return (
    <motion.p
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.4 + hold }}
      className="mt-6 text-center text-[13px] text-foreground/55 max-md:mt-4"
    >
      {prompt}{" "}
      <Link href={href} onClick={onClick} className="font-medium text-primary hover:underline">
        {label}
      </Link>
    </motion.p>
  );
}

function SignInForm() {
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);
  const hold = useEntranceDelay();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (submitting) return;
        setSubmitting(true);
        const result = await signIn(email, password);
        if (!result.ok) {
          setSubmitting(false);
          toast.error(result.error ?? "Could not sign you in.");
          return;
        }
        toast.success("Welcome back to Sutra.");
        router.push(nextPath(window.location.search));
      }}
      className="mt-7 flex flex-col gap-4 max-md:mt-4 max-md:gap-3"
    >
      <GoogleButton text="signin_with" delay={0.12 + hold} />
      <AuthTextField
        label="Email address"
        type="email"
        name="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        delay={0.18}
      />
      <AuthPasswordField
        label="Password"
        name="password"
        required
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        delay={0.24}
      />
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.28 + hold }}
        className="-mt-1 text-right text-[13px]"
      >
        <Link href="/forgot-password" className="text-primary hover:underline">
          Forgot password?
        </Link>
      </motion.p>
      <motion.button
        type="submit"
        disabled={submitting}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.32 + hold }}
        className={authButtonClass}
      >
        {submitting ? "Signing in…" : "Sign In"}
      </motion.button>
    </form>
  );
}

function SignUpForm({ active }: { active: boolean }) {
  const router = useRouter();
  const signUp = useAuthStore((s) => s.signUp);
  const hold = useEntranceDelay();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [captcha, setCaptcha] = useState("");
  const turnstile = useRef<TurnstileHandle>(null);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (submitting) return;
        if (password.length < 6) {
          toast.error("Password must be at least 6 characters.");
          return;
        }
        if (captchaEnabled && !captcha) {
          toast.error("One moment — finishing the security check.");
          return;
        }
        setSubmitting(true);
        const result = await signUp(name, email, password, undefined, captcha);
        if (!result.ok) {
          setSubmitting(false);
          // The token was spent on this attempt; fetch a fresh one for the next.
          turnstile.current?.reset();
          toast.error(result.error ?? "Could not create your account.");
          return;
        }
        toast.success("Welcome to Sutra.");
        // A new customer sent here from a gated action lands back on it rather
        // than on their empty account page.
        router.push(nextPath(window.location.search));
      }}
      className="mt-7 flex flex-col gap-4 max-md:mt-4 max-md:gap-3"
    >
      <GoogleButton text="signup_with" delay={0.12 + hold} />
      <AuthTextField
        label="Full name"
        type="text"
        name="name"
        required
        autoComplete="name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        delay={0.18}
      />
      <AuthTextField
        label="Email address"
        type="email"
        name="email"
        required
        autoComplete="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        delay={0.24}
      />
      <div>
        <AuthPasswordField
          label="Password"
          name="password"
          required
          minLength={6}
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          delay={0.3}
        />
        <PasswordStrength value={password} />
        {/* Inside this block rather than a row of its own, so the form's gap
            doesn't leave space for a widget that is usually invisible. Only on
            the showing side: the sign-in face shouldn't spend a check. */}
        {active && <Turnstile ref={turnstile} onToken={setCaptcha} shownClassName="mt-4" />}
      </div>
      <motion.button
        type="submit"
        disabled={submitting}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.38 + hold }}
        className={authButtonClass}
      >
        {submitting ? "Creating account…" : "Create Account"}
      </motion.button>
    </form>
  );
}
