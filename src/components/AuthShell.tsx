"use client";

import { createContext, useContext, useId, useMemo, useState, type InputHTMLAttributes, type ReactNode } from "react";
import { m as motion } from "framer-motion";
import { Eye, EyeOff } from "lucide-react";
import { MandalaMotif } from "@/components/MandalaMotif";

/*
 * Seconds to hold the card's contents back while an entrance plays, so the
 * fields rise after the gold thread has drawn the frame rather than over it.
 * Zero unless the frame was asked for an entrance, so recovery keeps its timing.
 */
const EntranceDelay = createContext(0);
export const useEntranceDelay = () => useContext(EntranceDelay);
const THREAD_DELAY = 0.62;

/**
 * The "Gold Leaf" auth treatment: a double gold hairline frame with squared
 * corners, borrowed from the border of a wedding invitation — the right
 * reference for a shop selling bridal lehengas and sherwanis. Shared by sign in,
 * create account and password recovery so the three read as one set.
 */

/* ------------------------------------------------------------------ fields */

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  delay?: number;
};

/*
 * Floating label rather than a placeholder. A placeholder disappears the moment
 * someone types, which left the form as a column of unlabelled boxes — no way to
 * check what you put where, and nothing for a screen reader to announce.
 *
 * The label rides on `:placeholder-shown`, so the input keeps a single-space
 * placeholder and hides it: that pseudo-class is the only way to know the field
 * is empty from CSS alone.
 */
const inputBase =
  "peer w-full rounded-lg border border-white/12 bg-white/[0.04] px-3.5 pb-2 pt-6 text-base max-md:pb-1.5 max-md:pt-5 " +
  "text-foreground outline-none transition-colors placeholder:text-transparent " +
  "focus:border-accent-light focus:bg-white/[0.07]";

const labelBase =
  "pointer-events-none absolute left-3.5 top-4 origin-left text-sm text-foreground/45 max-md:top-3.5 " +
  "transition-all duration-150 " +
  "peer-focus:-translate-y-2.5 peer-focus:scale-[0.78] peer-focus:text-accent " +
  "peer-[:not(:placeholder-shown)]:-translate-y-2.5 peer-[:not(:placeholder-shown)]:scale-[0.78] " +
  "peer-[:not(:placeholder-shown)]:text-accent";

export function AuthTextField({ label, delay = 0, className, ...props }: FieldProps) {
  const id = useId();
  const hold = useEntranceDelay();
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: delay + hold }}
      className="relative"
    >
      <input id={id} placeholder=" " className={`${inputBase} ${className ?? ""}`} {...props} />
      <label htmlFor={id} className={labelBase}>
        {label}
      </label>
    </motion.div>
  );
}

/**
 * Same field, plus a reveal toggle — typos are likeliest on a phone. An eye
 * rather than the word "Show": the faint word was easy to miss.
 */
export function AuthPasswordField({ label, delay = 0, className, ...props }: FieldProps) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const hold = useEntranceDelay();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: delay + hold }}
      className="relative"
    >
      <input
        id={id}
        placeholder=" "
        type={shown ? "text" : "password"}
        className={`${inputBase} pr-14 ${className ?? ""}`}
        {...props}
      />
      <label htmlFor={id} className={labelBase}>
        {label}
      </label>
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        // Big enough to hit on a phone, and labelled for screen readers since
        // "Show"/"Hide" alone does not say what it acts on.
        className="absolute right-1.5 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-md text-foreground/70 transition-colors hover:text-accent-light focus-visible:text-accent-light"
        aria-label={shown ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
        aria-pressed={shown}
        title={shown ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
      >
        {shown ? <EyeOff size={19} strokeWidth={1.75} /> : <Eye size={19} strokeWidth={1.75} />}
      </button>
    </motion.div>
  );
}

/**
 * Three bars under a new password. Scored on length first, then on whether the
 * password mixes character classes — length is what actually matters, so a long
 * simple password still reads as strong.
 */
export function PasswordStrength({ value }: { value: string }) {
  const { score, note } = useMemo(() => {
    if (!value) return { score: 0, note: "At least 6 characters." };
    const classes = [/[a-z]/i, /\d/, /[^a-z0-9]/i].filter((re) => re.test(value)).length;
    if (value.length < 6) return { score: 1, note: "Too short — 6 characters minimum." };
    if (value.length >= 10 && classes >= 2) return { score: 3, note: "Strong password." };
    return { score: 2, note: "Fine. Longer is stronger." };
  }, [value]);

  const fill = ["bg-primary", "bg-accent", "bg-accent-light"][score - 1] ?? "";

  return (
    <div className={`mt-2 ${value ? "" : "max-md:hidden"}`}>
      <div className="flex gap-1.5" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={`h-[3px] flex-1 rounded-full transition-colors duration-300 ${
              i < score ? fill : "bg-foreground/12"
            }`}
          />
        ))}
      </div>
      <p className="mt-1.5 text-[11.5px] text-foreground/45">{note}</p>
    </div>
  );
}

/* ------------------------------------------------------------------- shell */

/** The Sutra knot — two strands, one pulled through the other. */
function KnotMark({ size = 40, draw = false }: { size?: number; draw?: boolean }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true" className="text-accent-light">
      {/* pathLength lets the thread-draw dash work in percentages of each arc. */}
      <g className={draw ? "sutra-knot-draw" : undefined} fill="none" stroke="currentColor" strokeWidth={8} strokeLinecap="round">
        <path pathLength={100} d="M53.83 34.32 A23 23 0 1 1 45.62 28.67" />
        <path pathLength={100} d="M46.17 65.68 A23 23 0 1 1 54.38 71.33" />
      </g>
    </svg>
  );
}

/** Knot, eyebrow, title and woven rule: the top of every auth card. */
export function AuthHeading({
  eyebrow,
  title,
  titleId,
  spin = false,
}: {
  eyebrow: string;
  title: string;
  titleId?: string;
  /** Spin the knot in, used when the card turns between sign in and sign up. */
  spin?: boolean;
}) {
  // During an entrance the title and rule rise in with the fields; otherwise
  // they are there from the first frame, as before.
  const hold = useEntranceDelay();
  const rise = (delay: number) =>
    hold
      ? { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.35, delay: delay + hold } }
      : {};

  return (
    <>
      <div className="sutra-auth-short-hide grid place-items-center max-md:[&_svg]:h-7 max-md:[&_svg]:w-7">
        {/* initial={false}: no spin on page load, only when a side turns in. */}
        <motion.div
          initial={false}
          animate={spin ? { rotate: 0, scale: 1 } : { rotate: -180, scale: 0.7 }}
          transition={{ duration: 0.6, ease: [0.22, 0.7, 0.2, 1] }}
        >
          <KnotMark draw={hold > 0} />
        </motion.div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.14 + hold }}
        className="sutra-auth-short-hide mt-4 text-center text-[11px] uppercase tracking-[0.28em] text-accent max-md:mt-3 max-md:text-[10px]"
      >
        {eyebrow}
      </motion.p>

      {/* tabIndex -1 so focus can follow the card when it turns. */}
      <motion.h1
        {...rise(0.16)}
        id={titleId}
        tabIndex={-1}
        className="mt-1.5 text-center font-display text-3xl font-medium outline-none max-md:mt-1.5 max-md:text-[1.7rem]"
      >
        {title}
      </motion.h1>

      {/* Woven rule: two tapered threads meeting at a mark. */}
      <motion.div {...rise(0.2)} className="sutra-auth-short-hide mt-3 flex items-center justify-center gap-3 text-accent max-md:mt-2.5" aria-hidden="true">
        <span className="h-px w-12 bg-gradient-to-r from-transparent to-accent/70" />
        <span className="text-[10px]">✦</span>
        <span className="h-px w-12 bg-gradient-to-l from-transparent to-accent/70" />
      </motion.div>
    </>
  );
}

export function AuthShell({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <AuthFrame>
      <AuthHeading eyebrow={eyebrow} title={title} spin />
      {children}
    </AuthFrame>
  );
}

/**
 * The mandala backdrop and the double gold hairline frame, with no heading.
 *
 * entrance="thread" opens the card by drawing it in gold thread (see
 * .sutra-trace in globals.css) instead of the default rise and fade.
 */
export function AuthFrame({ children, entrance }: { children: ReactNode; entrance?: "thread" }) {
  const thread = entrance === "thread";
  return (
    <div className="relative flex min-h-[80vh] items-center justify-center overflow-hidden px-5 py-14 sm:px-6 sm:py-16 max-md:min-h-0 max-md:px-2 max-md:py-3">
      {/* One mandala, centred behind the card. Positioning lives on the wrapper:
          a motion transform on the svg would overwrite a translate on the same
          element. */}
      {/* White, like the home page's centre mandala (SiteBackdrop, white/13%),
          so the two read as one motif rather than a gold one fighting the white
          one behind it. Stronger here (24%, picked from a preview) because the
          translucent card in front dims the rings that turn through it. */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2">
        <MandalaMotif className="text-white/[0.24]" size={700} duration={70} />
      </div>

      <motion.div
        // The thread entrance keeps the card in place from the first frame:
        // the drawing is the arrival, so the default rise would fight it.
        initial={thread ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        /*
         * Outer gold hairline. The squared corners are the point — a soft radius
         * reads casual, and this is meant to read like an invitation.
         *
         * Deliberately translucent, and with almost no backdrop blur: the
         * mandala behind is drawn at 0.6 stroke width, so a large blur radius
         * does not soften those rings, it erases them. 2px keeps a trace of
         * glass while the rings still turn visibly through the card.
         */
        className={`relative w-full max-w-md rounded-[6px] border border-accent/40 bg-cream-dark/55 p-2 shadow-2xl backdrop-blur-[2px] max-md:max-w-[21.5rem] max-md:p-1 ${
          thread ? "sutra-thread-frame" : ""
        }`}
      >
        {thread && <ThreadTrace className="-inset-px" rx={6} />}
        <div className={`relative rounded-[3px] border border-accent/20 px-6 py-8 sm:px-8 max-md:px-4 max-md:py-6 ${thread ? "sutra-thread-inner" : ""}`}>
          {thread && <ThreadTrace className="sutra-trace-inner -inset-px" rx={3} />}
          <EntranceDelay.Provider value={thread ? THREAD_DELAY : 0}>{children}</EntranceDelay.Provider>
        </div>
      </motion.div>
    </div>
  );
}

/** One gold thread drawn round a border box, then faded away. Decorative only. */
function ThreadTrace({ className, rx }: { className: string; rx: number }) {
  return (
    <svg className={`sutra-trace pointer-events-none absolute z-10 h-[calc(100%+2px)] w-[calc(100%+2px)] overflow-visible ${className}`} aria-hidden="true">
      <rect width="100%" height="100%" rx={rx} pathLength={100} />
    </svg>
  );
}

/** Shared submit button styling, so the three screens stay identical. */
export const authButtonClass =
  "btn-shimmer relative mt-2 overflow-hidden rounded-full bg-primary py-3 font-medium text-white " +
  "transition-colors hover:bg-primary-dark disabled:opacity-60";
