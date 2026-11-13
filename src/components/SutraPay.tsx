"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import qrcode from "qrcode-generator";
import { AnimatePresence, m as motion } from "framer-motion";
import { AppWindow, AtSign, Check, ChevronRight, CreditCard, Loader2, Lock, QrCode, ShieldCheck, Smartphone, X, XCircle } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import type { Order } from "@/lib/order";
import {
  cardBrand,
  cardProblem,
  digits,
  formatCardNumber,
  formatExpiry,
  QR_PAYEE,
  TEST,
  UPI_APPS,
  upiPayLink,
  upiValid,
  type SutraPayMethod,
  type UpiAppId,
} from "@/lib/sutrapay";

/*
 * The Sutra Pay window: the shop's own dummy gateway (rules in lib/sutrapay).
 * Card goes through a bank OTP step. UPI, as real gateways do it: on a laptop
 * a QR code to scan with the phone; on a phone (which can't scan its own
 * screen) a hand-off to a UPI app; on both, a UPI ID that gets an "approve in
 * your app" request. The demo never opens a real app (the payee is made up);
 * a short "opening…" screen stands in for the hand-off. The server
 * (api/payments/sutrapay) decides every outcome.
 */

/** The paid order comes back with a success, as the server saved it. */
export type PayOutcome = { paid: boolean; error?: string; order?: Order };

type Stage = "details" | "otp" | "opening" | "approve" | "processing" | "success" | "declined";

const field =
  "w-full rounded-lg border border-white/12 bg-white/[0.04] px-3 py-2.5 text-sm outline-none transition-colors placeholder:text-foreground/30 focus:border-accent-light/70";
const chip =
  "rounded-full border border-white/12 px-2.5 py-1 text-[11px] text-foreground/65 transition hover:border-accent-light/60 hover:text-accent-light";
const UPI_WAIT_S = 5;

/** A UPI QR code, drawn as SVG squares (no image, no innerHTML). */
function UpiQr({ value, size = 184 }: { value: string; size?: number }) {
  const { count, path } = useMemo(() => {
    const qr = qrcode(0, "M");
    qr.addData(value);
    qr.make();
    const n = qr.getModuleCount();
    let d = "";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
    return { count: n, path: d };
  }, [value]);
  return (
    <svg
      viewBox={`-2 -2 ${count + 4} ${count + 4}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      role="img"
      aria-label="UPI QR code"
      className="rounded-lg bg-white"
    >
      <path d={path} fill="#1a1416" />
    </svg>
  );
}

async function submit(orderId: string, body: Record<string, unknown>): Promise<PayOutcome & { invalid?: boolean }> {
  try {
    const res = await fetch("/api/payments/sutrapay", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, ...body }),
    });
    const data = await res.json().catch(() => null);
    if (!data?.ok) return { paid: false, invalid: res.status === 400, error: data?.error ?? "The payment could not be completed." };
    return { paid: !!data.paid, ...(data.error ? { error: String(data.error) } : {}), ...(data.order ? { order: data.order as Order } : {}) };
  } catch {
    return { paid: false, error: "Could not reach Sutra Pay. Check your connection." };
  }
}

export function SutraPay({
  orderId,
  amount,
  phone,
  start = "card",
  onDone,
}: {
  /** Which tab opens first: the checkout choice. */
  start?: SutraPayMethod;
  /** Null while closed. */
  orderId: string | null;
  amount: number;
  /** For "OTP sent to …". */
  phone?: string;
  onDone: (outcome: PayOutcome) => void;
}) {
  const [method, setMethod] = useState<SutraPayMethod>("card");
  const [stage, setStage] = useState<Stage>("details");
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "", name: "" });
  const [otp, setOtp] = useState("");
  const [vpa, setVpa] = useState("");
  // UPI: scan a QR (laptops/tablets) or pay in a UPI app (phones, where a QR
  // would be on the same screen as the app that has to scan it), or a UPI ID.
  const [isPhone, setIsPhone] = useState(false);
  const [upiMode, setUpiMode] = useState<"qr" | "app" | "id">("qr");
  const [upiApp, setUpiApp] = useState<UpiAppId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [wait, setWait] = useState(UPI_WAIT_S);
  const lastError = useRef<string | undefined>(undefined);

  // A fresh window for every order. Closing it parks the stage too, so a
  // countdown left running behind a closed window can't fire later.
  useEffect(() => {
    if (!orderId) {
      setStage("details");
      return;
    }
    setMethod(start);
    const phone = !window.matchMedia("(min-width: 768px)").matches;
    setIsPhone(phone);
    setUpiMode(phone ? "app" : "qr");
    setUpiApp(null);
    setStage("details");
    setCard({ number: "", expiry: "", cvv: "", name: "" });
    setOtp("");
    setVpa("");
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  async function finish(body: Record<string, unknown>) {
    if (!orderId) return;
    setStage("processing");
    // A moment of "processing", as a bank would take.
    const [result] = await Promise.all([submit(orderId, body), new Promise((r) => setTimeout(r, 1300))]);
    if (result.paid) {
      setStage("success");
      setTimeout(() => onDone({ paid: true, order: result.order }), 1100);
    } else if (result.invalid) {
      setError(result.error ?? "Check your details.");
      setStage("details");
    } else {
      lastError.current = result.error;
      setError(result.error ?? "The payment was declined. No money was taken.");
      setStage("declined");
    }
  }

  // UPI: the request waits in the shopper's app; here it is approved after a
  // few seconds, or straight away with "I've approved".
  // The count lives in the effect, not read back from state: reading `wait`
  // let the previous attempt's 0 fire the payment the moment a new approve
  // screen opened, skipping it.
  const approveBody = () => ({ method: "upi", upi: upiApp ? { app: upiApp } : { vpa } });
  const autoApprove = useRef<() => void>(() => {});
  autoApprove.current = () => finish(approveBody());
  useEffect(() => {
    if (stage !== "approve") return;
    let left = UPI_WAIT_S;
    setWait(left);
    const timer = window.setInterval(() => {
      left -= 1;
      setWait(left);
      if (left <= 0) {
        window.clearInterval(timer);
        autoApprove.current();
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [stage]);

  function continueCard(e: React.FormEvent) {
    e.preventDefault();
    const problem = cardProblem(card);
    if (problem) return setError(problem);
    if (!card.name.trim()) return setError("Enter the name on the card.");
    setError(null);
    setOtp("");
    setStage("otp");
  }

  function continueUpi(e: React.FormEvent) {
    e.preventDefault();
    if (!upiValid(vpa)) return setError("Enter a UPI ID like name@bank.");
    setError(null);
    setUpiApp(null);
    setStage("approve");
  }

  // Phone: "open" the chosen app, then wait for the shopper to pay there.
  function openUpiApp(app: UpiAppId) {
    setError(null);
    setUpiApp(app);
    setStage("opening");
  }
  useEffect(() => {
    if (stage !== "opening") return;
    const timer = window.setTimeout(() => setStage("approve"), 1400);
    return () => window.clearTimeout(timer);
  }, [stage]);
  const appName = UPI_APPS.find((a) => a.id === upiApp)?.name ?? "your UPI app";

  const brand = cardBrand(card.number);
  const cancel = () => onDone({ paid: false, error: "Payment cancelled. Your bag is still here." });
  const busy = stage === "processing" || stage === "success";

  // A dialog for keyboards too (as the bag drawer): focus moves in and stays
  // in, Escape cancels unless a payment is being processed, and focus goes
  // back to the Pay button afterwards.
  const panel = useRef<HTMLDivElement>(null);
  const escape = useRef<() => void>(() => {});
  escape.current = () => {
    if (!busy) cancel();
  };
  useEffect(() => {
    if (!orderId) return;
    const opener = document.activeElement as HTMLElement | null;
    const focusables = () =>
      [...(panel.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])') ?? [])];
    const raf = requestAnimationFrame(() => {
      if (!panel.current?.contains(document.activeElement)) focusables()[0]?.focus();
    });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        escape.current();
      } else if (e.key === "Tab") {
        const list = focusables();
        if (!list.length) return;
        const first = list[0];
        const last = list[list.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        } else if (!panel.current?.contains(document.activeElement)) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
      opener?.focus?.();
    };
  }, [orderId]);

  return (
    <AnimatePresence>
      {orderId && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm max-sm:items-end max-sm:p-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Sutra Pay"
        >
          <motion.div
            ref={panel}
            initial={{ y: 30, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="relative max-h-[92dvh] w-full max-w-[420px] overflow-y-auto rounded-2xl border border-white/10 bg-cream-dark shadow-2xl max-sm:max-w-none max-sm:rounded-b-none max-sm:pb-[env(safe-area-inset-bottom)]"
          >
            {/* Header: who is being paid, how much, for which order. */}
            <div className="flex items-center justify-between gap-3 border-b border-white/10 bg-gradient-to-r from-primary/25 to-transparent py-4 pl-5 pr-11">
              <div>
                <p className="flex items-center gap-1.5 text-sm font-semibold">
                  <ShieldCheck size={16} className="text-accent-light" aria-hidden="true" />
                  Sutra Pay
                  <span className="rounded-full bg-accent px-2 py-px text-[10px] font-bold uppercase tracking-wider text-[#1a120c]">
                    Demo
                  </span>
                </p>
                <p className="mt-0.5 font-mono text-[11px] text-foreground/50">Sutra · {orderId}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] uppercase tracking-wider text-foreground/50">Amount</p>
                <p className="font-display text-xl font-semibold">{formatPrice(amount)}</p>
              </div>
              {!busy && (
                <button
                  type="button"
                  onClick={cancel}
                  className="absolute right-2.5 top-2.5 rounded-full p-1.5 text-foreground/45 transition hover:bg-white/10 hover:text-foreground"
                  aria-label="Cancel payment"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            <div className="p-5">
              {stage === "details" && (
                <div className="flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-2" role="tablist" aria-label="Pay with">
                    {(
                      [
                        { id: "card", label: "Card", icon: CreditCard },
                        { id: "upi", label: "UPI", icon: Smartphone },
                      ] as const
                    ).map((m) => (
                      <button
                        key={m.id}
                        type="button"
                        role="tab"
                        aria-selected={method === m.id}
                        onClick={() => {
                          setMethod(m.id);
                          setError(null);
                        }}
                        className={`flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium transition ${
                          method === m.id
                            ? "border-accent-light/70 bg-accent/10 text-accent-light"
                            : "border-white/10 text-foreground/70 hover:border-white/25"
                        }`}
                      >
                        <m.icon size={16} aria-hidden="true" />
                        {m.label}
                      </button>
                    ))}
                  </div>

                  {method === "card" ? (
                    <form onSubmit={continueCard} className="flex flex-col gap-2.5" noValidate>
                      <div className="relative">
                        <input
                          className={`${field} pr-24 font-mono tracking-wider`}
                          inputMode="numeric"
                          autoComplete="off"
                          placeholder="Card number"
                          aria-label="Card number"
                          value={card.number}
                          onChange={(e) => setCard({ ...card, number: formatCardNumber(e.target.value) })}
                        />
                        {brand && (
                          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded bg-white/10 px-2 py-0.5 text-[10.5px] font-semibold tracking-wide text-foreground/80">
                            {brand}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        <input
                          className={`${field} font-mono`}
                          inputMode="numeric"
                          autoComplete="off"
                          placeholder="MM / YY"
                          aria-label="Expiry"
                          value={card.expiry}
                          onChange={(e) => setCard({ ...card, expiry: formatExpiry(e.target.value) })}
                        />
                        <input
                          className={`${field} font-mono`}
                          inputMode="numeric"
                          autoComplete="off"
                          type="password"
                          placeholder="CVV"
                          aria-label="CVV"
                          maxLength={4}
                          value={card.cvv}
                          onChange={(e) => setCard({ ...card, cvv: digits(e.target.value).slice(0, 4) })}
                        />
                      </div>
                      <input
                        className={field}
                        autoComplete="off"
                        placeholder="Name on card"
                        aria-label="Name on card"
                        value={card.name}
                        onChange={(e) => setCard({ ...card, name: e.target.value.slice(0, 60) })}
                      />
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-foreground/45">Test cards:</span>
                        <button
                          type="button"
                          className={chip}
                          onClick={() => setCard({ number: TEST.cardSuccess, expiry: "12 / 30", cvv: "123", name: "Test Shopper" })}
                        >
                          Pays
                        </button>
                        <button
                          type="button"
                          className={chip}
                          onClick={() => setCard({ number: TEST.cardDecline, expiry: "12 / 30", cvv: "123", name: "Test Shopper" })}
                        >
                          Declined
                        </button>
                      </div>
                      {error && <p className="text-sm text-primary" role="alert">{error}</p>}
                      <button type="submit" className="mt-1 rounded-xl bg-primary py-3 font-semibold text-white transition hover:bg-primary-dark">
                        Pay {formatPrice(amount)}
                      </button>
                    </form>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div className="grid grid-cols-2 gap-1 rounded-lg bg-white/[0.05] p-1 text-xs font-medium" role="tablist" aria-label="UPI">
                        {(
                          [
                            isPhone
                              ? ({ id: "app", label: "UPI app", icon: AppWindow } as const)
                              : ({ id: "qr", label: "Scan QR", icon: QrCode } as const),
                            { id: "id", label: "UPI ID", icon: AtSign } as const,
                          ]
                        ).map((m) => (
                          <button
                            key={m.id}
                            type="button"
                            role="tab"
                            aria-selected={upiMode === m.id}
                            onClick={() => {
                              setUpiMode(m.id);
                              setError(null);
                            }}
                            className={`flex items-center justify-center gap-1.5 rounded-md py-1.5 transition ${
                              upiMode === m.id ? "bg-white/[0.12] text-foreground" : "text-foreground/55 hover:text-foreground"
                            }`}
                          >
                            <m.icon size={13} aria-hidden="true" />
                            {m.label}
                          </button>
                        ))}
                      </div>

                      {upiMode === "app" ? (
                        <div className="flex flex-col gap-2">
                          <p className="text-sm">
                            Pay <b>{formatPrice(amount)}</b> in a UPI app on this phone
                          </p>
                          <ul className="flex flex-col gap-1.5" aria-label="UPI apps">
                            {UPI_APPS.map((a) => (
                              <li key={a.id}>
                                <button
                                  type="button"
                                  onClick={() => openUpiApp(a.id)}
                                  className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-3 text-left text-sm transition hover:border-accent-light/60"
                                >
                                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.08] text-xs font-bold text-accent-light" aria-hidden="true">
                                    {a.id === "other" ? <Smartphone size={15} /> : a.name.charAt(0)}
                                  </span>
                                  <span className="flex-1 font-medium">{a.name}</span>
                                  <ChevronRight size={16} className="text-foreground/40" aria-hidden="true" />
                                </button>
                              </li>
                            ))}
                          </ul>
                          <p className="text-[11px] text-foreground/45">Demo: no app really opens; the next screen stands in for it.</p>
                        </div>
                      ) : upiMode === "qr" ? (
                        <div className="flex flex-col items-center gap-3 text-center">
                          <div className="rounded-xl border border-white/10 bg-white p-2.5 shadow-lg">
                            <UpiQr value={upiPayLink(orderId, amount)} />
                          </div>
                          <div>
                            <p className="text-sm">
                              Scan with any UPI app to pay <b>{formatPrice(amount)}</b>
                            </p>
                            <p className="mt-0.5 text-[11.5px] text-foreground/45">GPay · PhonePe · Paytm · BHIM · your bank&apos;s app</p>
                          </div>
                          <p className="flex items-center gap-2 text-xs text-accent-light" aria-live="polite">
                            <Loader2 size={13} className="animate-spin" aria-hidden="true" />
                            Waiting for payment…
                          </p>
                          <button
                            type="button"
                            onClick={() => finish({ method: "upi", upi: { qr: true } })}
                            className="w-full rounded-xl bg-primary py-3 font-semibold text-white transition hover:bg-primary-dark"
                          >
                            I&apos;ve paid
                          </button>
                          <div className="flex w-full flex-wrap items-center justify-between gap-2 text-[11px] text-foreground/45">
                            <span>
                              Demo QR to <span className="font-mono">{QR_PAYEE}</span>: a real UPI app will refuse it.
                            </span>
                            <button
                              type="button"
                              onClick={() => finish({ method: "upi", upi: { qr: true, simulate: "decline" } })}
                              className="underline underline-offset-2 hover:text-foreground/70"
                            >
                              Simulate a failed payment
                            </button>
                          </div>
                        </div>
                      ) : (
                    <form onSubmit={continueUpi} className="flex flex-col gap-2.5" noValidate>
                      <input
                        className={field}
                        autoComplete="off"
                        autoCapitalize="none"
                        placeholder="UPI ID, e.g. name@okbank"
                        aria-label="UPI ID"
                        value={vpa}
                        onChange={(e) => setVpa(e.target.value.trim().slice(0, 100))}
                      />
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-[11px] text-foreground/45">Test IDs:</span>
                        <button type="button" className={chip} onClick={() => setVpa(TEST.upiSuccess)}>
                          {TEST.upiSuccess}
                        </button>
                        <button type="button" className={chip} onClick={() => setVpa(TEST.upiDecline)}>
                          {TEST.upiDecline}
                        </button>
                      </div>
                      {error && <p className="text-sm text-primary" role="alert">{error}</p>}
                      <button type="submit" className="mt-1 rounded-xl bg-primary py-3 font-semibold text-white transition hover:bg-primary-dark">
                        Send payment request
                      </button>
                    </form>
                      )}
                    </div>
                  )}

                  <p className="flex items-center justify-center gap-1.5 text-[11.5px] text-foreground/45">
                    <Lock size={12} aria-hidden="true" />
                    Demo gateway: no real money moves.
                  </p>
                </div>
              )}

              {stage === "otp" && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!/^\d{6}$/.test(otp)) return setError("Enter the 6-digit OTP.");
                    setError(null);
                    finish({ method: "card", card: { number: card.number, expiry: card.expiry, cvv: card.cvv, otp } });
                  }}
                  className="flex flex-col gap-3"
                  noValidate
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/50">
                    {brand ?? "Card"} · Secure check
                  </p>
                  <p className="text-sm text-foreground/75">
                    Your bank sent a one-time password
                    {phone && digits(phone).length >= 4 ? ` to the number ending ${digits(phone).slice(-4)}` : ""} for{" "}
                    <b className="text-foreground">{formatPrice(amount)}</b> to Sutra, card ending {digits(card.number).slice(-4)}.
                  </p>
                  <input
                    className={`${field} text-center font-mono text-lg tracking-[0.5em]`}
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    autoFocus
                    placeholder="••••••"
                    aria-label="OTP"
                    value={otp}
                    onChange={(e) => setOtp(digits(e.target.value).slice(0, 6))}
                  />
                  <p className="text-[11.5px] text-foreground/45">
                    Demo OTP: <button type="button" className="font-mono text-accent-light underline underline-offset-2" onClick={() => setOtp(TEST.otp)}>{TEST.otp}</button>
                  </p>
                  {error && <p className="text-sm text-primary" role="alert">{error}</p>}
                  <button type="submit" className="rounded-xl bg-primary py-3 font-semibold text-white transition hover:bg-primary-dark">
                    Verify and pay
                  </button>
                  <button type="button" onClick={() => setStage("details")} className="text-sm text-foreground/55 hover:text-foreground">
                    Back
                  </button>
                </form>
              )}

              {stage === "approve" && (
                <div className="flex flex-col items-center gap-3 py-4 text-center" aria-live="polite">
                  <span className="relative grid h-16 w-16 place-items-center">
                    <span className="absolute inset-0 animate-ping rounded-full bg-accent/20" aria-hidden="true" />
                    <Smartphone size={30} className="text-accent-light" aria-hidden="true" />
                  </span>
                  {upiApp ? (
                    <>
                      <p className="font-medium">Complete the payment in {appName}</p>
                      <p className="text-sm text-foreground/60">
                        {formatPrice(amount)} to Sutra. Come back here when it&apos;s done. Waiting… {Math.max(wait, 0)}s
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-medium">Approve the request in your UPI app</p>
                      <p className="text-sm text-foreground/60">
                        Sent to <b className="font-mono text-foreground/85">{vpa}</b> for {formatPrice(amount)}. Waiting… {Math.max(wait, 0)}s
                      </p>
                    </>
                  )}
                  <div className="mt-2 flex flex-wrap justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => finish(approveBody())}
                      className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
                    >
                      {upiApp ? "I've paid" : "I've approved"}
                    </button>
                    <button type="button" onClick={() => setStage("details")} className="rounded-xl border border-white/15 px-5 py-2.5 text-sm">
                      {upiApp ? "Choose another app" : "Change UPI ID"}
                    </button>
                  </div>
                  {upiApp && (
                    <button
                      type="button"
                      onClick={() => finish({ method: "upi", upi: { app: upiApp, simulate: "decline" } })}
                      className="text-[11px] text-foreground/45 underline underline-offset-2 hover:text-foreground/70"
                    >
                      Simulate a failed payment
                    </button>
                  )}
                </div>
              )}

              {stage === "opening" && (
                <div className="flex flex-col items-center gap-3 py-8 text-center" aria-live="polite">
                  <Loader2 size={34} className="animate-spin text-accent-light" aria-hidden="true" />
                  <p className="font-medium">Opening {appName}…</p>
                  <p className="text-sm text-foreground/55">Pay {formatPrice(amount)} there, then come back to Sutra.</p>
                </div>
              )}

              {(stage === "processing" || stage === "success") && (
                <div className="flex flex-col items-center gap-3 py-8 text-center" aria-live="polite">
                  {stage === "processing" ? (
                    <>
                      <Loader2 size={34} className="animate-spin text-accent-light" aria-hidden="true" />
                      <p className="text-sm text-foreground/70">Processing your payment… don&apos;t close this window.</p>
                    </>
                  ) : (
                    <>
                      <motion.span
                        initial={{ scale: 0.4, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="grid h-14 w-14 place-items-center rounded-full bg-green-500/90 text-white"
                      >
                        <Check size={28} aria-hidden="true" />
                      </motion.span>
                      <p className="font-medium">Payment successful</p>
                      <p className="text-sm text-foreground/55">{formatPrice(amount)} paid to Sutra</p>
                    </>
                  )}
                </div>
              )}

              {stage === "declined" && (
                <div className="flex flex-col items-center gap-3 py-6 text-center" role="alert">
                  <XCircle size={44} className="text-primary" aria-hidden="true" />
                  <p className="font-medium">Payment failed</p>
                  <p className="max-w-xs text-sm text-foreground/60">{error}</p>
                  <div className="mt-2 flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setStage("details");
                      }}
                      className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-primary-dark"
                    >
                      Try again
                    </button>
                    <button
                      type="button"
                      onClick={() => onDone({ paid: false, error: lastError.current ?? "Payment failed. No money was taken." })}
                      className="rounded-xl border border-white/15 px-5 py-2.5 text-sm"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
