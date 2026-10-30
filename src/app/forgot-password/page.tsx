"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, m as motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, RotateCcw, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { useAuthStore } from "@/lib/store/auth";
import {
  AuthShell,
  AuthTextField,
  AuthPasswordField,
  PasswordStrength,
} from "@/components/AuthShell";
import { Turnstile, captchaEnabled, type TurnstileHandle } from "@/components/Turnstile";

type Step = "request" | "verify" | "reset" | "done";

const STEP_TITLES: Record<Step, string> = {
  request: "Forgot Password",
  verify: "Verify Code",
  reset: "Set New Password",
  done: "Password Updated",
};

const STEP_ORDER: Record<Step, number> = { request: 0, verify: 1, reset: 2, done: 3 };

function CodeInput({
  value,
  onChange,
  length = 6,
  disabled = false,
}: {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  disabled?: boolean;
}) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  function focusInput(index: number) {
    inputs.current[Math.max(0, Math.min(index, length - 1))]?.focus();
  }

  function setValue(next: string) {
    onChange(next);
    focusInput(next.length);
  }

  return (
    <div
      className="flex justify-between gap-2"
      onPaste={(e) => {
        const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
        if (pasted) {
          e.preventDefault();
          setValue(pasted.slice(0, length));
        }
      }}
    >
      {Array.from({ length }, (_, i) => (
        <input
          key={i}
          ref={(el) => {
            inputs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          disabled={disabled}
          value={value[i] ?? ""}
          onChange={(e) => {
            const digit = e.target.value.replace(/\D/g, "");
            if (!digit) return;
            // One digit typed into a box that already has later digits after
            // it replaces just that box; it used to erase everything after.
            // Several digits at once (paste, autofill) fill from here on.
            setValue(
              digit.length === 1 && i < value.length
                ? value.slice(0, i) + digit + value.slice(i + 1)
                : (value.slice(0, i) + digit).slice(0, length)
            );
          }}
          onKeyDown={(e) => {
            if (e.key === "Backspace") {
              e.preventDefault();
              setValue(value.slice(0, i < value.length ? i : Math.max(0, i - 1)));
              return;
            }
            if (e.key === "ArrowLeft") {
              e.preventDefault();
              focusInput(i - 1);
              return;
            }
            if (e.key === "ArrowRight") {
              e.preventDefault();
              focusInput(i + 1);
            }
          }}
          onFocus={(e) => e.currentTarget.select()}
          aria-label={`Digit ${i + 1}`}
          className="h-14 w-full min-w-0 rounded-xl border border-white/12 text-center font-display text-2xl outline-none transition-colors focus:border-primary disabled:opacity-50"
        />
      ))}
    </div>
  );
}

export default function ForgotPasswordPage() {
  const resetPassword = useAuthStore((s) => s.resetPassword);

  const [step, setStep] = useState<Step>("request");
  const [emailInput, setEmailInput] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [account, setAccount] = useState<{ email: string } | null>(null);
  const [challenge, setChallenge] = useState("");
  const [masked, setMasked] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [cooldown, setCooldown] = useState(0);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const inFlight = useRef(false);
  const [captcha, setCaptcha] = useState("");
  const turnstile = useRef<TurnstileHandle>(null);

  function resetAll() {
    setStep("request");
    setAccount(null);
    setChallenge("");
    setMasked("");
    setDevCode(null);
    setCode("");
    setCooldown(0);
    setNewPassword("");
    setConfirmPassword("");
  }

  async function sendCode(email: string, resend = false) {
    if (inFlight.current) return false;
    if (captchaEnabled && !captcha) {
      toast.error("One moment — finishing the security check.");
      return false;
    }
    inFlight.current = true;
    setSubmitting(true);
    try {
      const res = await fetch("/api/otp/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: email, captcha }),
      });
      const data = await res.json().catch(() => null);
      if (!data) {
        toast.error("Something went wrong sending your code. Please try again.");
        return false;
      }
      if (!data.ok) {
        toast.error(data.error);
        return false;
      }
      setChallenge(data.challenge);
      setMasked(data.masked);
      setDevCode(data.devCode ?? null);
      setCode("");
      setCooldown(30);
      toast.success(
        data.delivery === "none"
          ? "Code generated — email delivery is not configured yet."
          : `${resend ? "New code" : "Code"} sent to ${data.masked}`
      );
      return true;
    } catch {
      toast.error("Network error. Please check your connection and try again.");
      return false;
    } finally {
      setSubmitting(false);
      inFlight.current = false;
      // Tokens are single-use: have a fresh one ready for "Resend code".
      turnstile.current?.reset();
    }
  }

  async function handleRequestSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;

    /*
     * Straight to sending the code. This used to look the account up first
     * through /api/auth/find-account, which answered anyone with the name and
     * phone number behind an email - or the email behind a phone number - and
     * said outright whether an address was registered at all.
     *
     * /api/otp/request already replies identically for addresses with no
     * account, so the next step looks the same either way and nothing about
     * who is registered leaks. Someone who mistypes sees the masked address on
     * the next screen and can go back.
     */
    const email = emailInput.trim().toLowerCase();
    if (!email.includes("@")) {
      toast.error("Enter a valid email address.");
      return;
    }
    if (await sendCode(email)) {
      setAccount({ email });
      setStep("verify");
    }
  }

  async function handleVerifySubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) {
      toast.error("Enter all 6 digits.");
      return;
    }
    if (inFlight.current) return;
    inFlight.current = true;
    setSubmitting(true);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challenge, code }),
      });
      const data = await res.json().catch(() => null);
      if (!data) {
        toast.error("Something went wrong checking your code. Please try again.");
        return;
      }
      if (!data.ok) {
        toast.error(data.error);
        setCode("");
        return;
      }
      setStep("reset");
    } catch {
      toast.error("Network error. Please check your connection and try again.");
    } finally {
      setSubmitting(false);
      inFlight.current = false;
    }
  }

  useEffect(() => {
    if (cooldown <= 0) return;
    const timeout = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timeout);
  }, [cooldown]);

  return (
    <AuthShell eyebrow="Account Recovery" title={STEP_TITLES[step]}>
      {step !== "done" && (
        <div className="mt-5 flex items-center gap-2" aria-hidden="true">
          {(["request", "verify", "reset"] as const).map((s) => (
            <span
              key={s}
              className={`h-1 flex-1 rounded-full transition-colors ${
                STEP_ORDER[s] <= STEP_ORDER[step] ? "bg-primary" : "bg-black/10"
              }`}
            />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === "request" && (
          <motion.div key="request" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }}>
            <p className="mt-5 text-sm text-foreground/60">
              Enter the email on your account and we&#39;ll send you a 6-digit verification code.
            </p>
            <form onSubmit={handleRequestSubmit} className="mt-6 flex flex-col gap-4 max-md:mt-4 max-md:gap-3">
              <AuthTextField
                label="Email address"
                type="email"
                name="email"
                required
                autoComplete="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                delay={0.1}
              />
              {/* Shares the button's row, so a hidden widget leaves no gap in the form. */}
              <div className="flex flex-col">
                <Turnstile ref={turnstile} onToken={setCaptcha} shownClassName="mb-3" />
                <motion.button
                  type="submit"
                  disabled={submitting}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.18 }}
                  className="btn-shimmer relative mt-2 overflow-hidden rounded-full bg-primary py-3 font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
                >
                  {submitting ? "Sending…" : "Send Code"}
                </motion.button>
              </div>
            </form>
            <p className="mt-6 text-center text-sm text-foreground/60 max-md:mt-4">
              Remembered it? <Link href="/login" className="font-medium text-primary hover:underline">Sign in</Link>
            </p>
          </motion.div>
        )}

        {step === "verify" && account && (
          <motion.div key="verify" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }}>
            <p className="mt-5 text-sm leading-relaxed text-foreground/60">
              Enter the 6-digit code sent to <span className="font-medium text-foreground/80">{masked}</span>. It expires in 2 minutes.
            </p>
            {devCode && (
              <div className="mt-4 rounded-xl border border-accent/30 bg-accent/5 p-3 text-center">
                <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-accent">
                  Delivery not configured — code shown for testing
                </p>
                <p className="mt-1 font-display text-2xl tracking-[0.35em] text-primary">{devCode}</p>
              </div>
            )}
            <form onSubmit={handleVerifySubmit} className="mt-6 flex flex-col gap-4 max-md:mt-4 max-md:gap-3">
              <CodeInput value={code} onChange={setCode} length={6} disabled={submitting} />
              <motion.button
                type="submit"
                disabled={submitting}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.12 }}
                className="btn-shimmer relative mt-2 flex items-center justify-center gap-2 overflow-hidden rounded-full bg-primary py-3 font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
              >
                <ShieldCheck size={18} />
                {submitting ? "Verifying…" : "Verify Code"}
              </motion.button>
            </form>
            {/* A new widget for this step: the first token was spent sending the code. */}
            <Turnstile ref={turnstile} onToken={setCaptcha} shownClassName="mt-5" />
            <div className="mt-5 flex items-center justify-between text-sm">
              <button type="button" onClick={resetAll} className="flex items-center gap-1.5 text-foreground/60 transition-colors hover:text-primary">
                <ArrowLeft size={15} />
                Change email
              </button>
              <button
                type="button"
                onClick={() => account && sendCode(account.email, true)}
                disabled={cooldown > 0 || submitting}
                className="flex items-center gap-1.5 font-medium text-primary transition-opacity hover:underline disabled:cursor-not-allowed disabled:text-foreground/40 disabled:no-underline"
              >
                <RotateCcw size={15} />
                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
              </button>
            </div>
          </motion.div>
        )}

        {step === "reset" && account && (
          <motion.div key="reset" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }}>
            <p className="mt-5 text-sm text-foreground/60">Verified. Choose a new password for your account.</p>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (submitting) return;
                if (newPassword.length < 6) {
                  toast.error("Password must be at least 6 characters.");
                  return;
                }
                if (newPassword !== confirmPassword) {
                  toast.error("Those passwords do not match.");
                  return;
                }
                if (!account) {
                  resetAll();
                  return;
                }
                // The server re-checks the signed challenge and takes the email
                // from it, so the reset can only land on the verified account.
                setSubmitting(true);
                const result = await resetPassword(challenge, code, newPassword).finally(() =>
                  setSubmitting(false)
                );
                if (result.ok) {
                  setStep("done");
                  toast.success("Password updated.");
                } else {
                  toast.error(result.error ?? "Could not reset your password.");
                }
              }}
              className="mt-6 flex flex-col gap-4 max-md:mt-4 max-md:gap-3"
            >
              <div>
                <AuthPasswordField
                  label="New password"
                  name="new-password"
                  required
                  minLength={6}
                  autoComplete="new-password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  delay={0.1}
                />
                <PasswordStrength value={newPassword} />
              </div>
              <AuthPasswordField
                label="Confirm new password"
                name="confirm-password"
                required
                minLength={6}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                delay={0.16}
              />
              <motion.button
                type="submit"
                disabled={submitting}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.22 }}
                className="btn-shimmer relative mt-2 overflow-hidden rounded-full bg-primary py-3 font-medium text-white transition-colors hover:bg-primary-dark disabled:opacity-60"
              >
                {submitting ? "Updating…" : "Update Password"}
              </motion.button>
            </form>
          </motion.div>
        )}

        {step === "done" && (
          <motion.div key="done" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="mt-8">
            <div className="flex flex-col items-center gap-3 rounded-xl bg-white/5 p-6 text-center">
              <CheckCircle2 size={36} strokeWidth={1.4} className="text-primary" />
              <p className="font-medium">Your password has been updated.</p>
              <p className="text-sm text-foreground/60">Sign in with your new password to continue.</p>
            </div>
            <Link href="/login" className="mt-6 block rounded-full bg-primary py-3 text-center font-medium text-white transition-colors hover:bg-primary-dark">
              Back to Sign In
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthShell>
  );
}
