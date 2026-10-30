"use client";

import { useEffect, useRef, useState } from "react";
import IntroDiwali from "@/components/IntroDiwali";

/*
 * The opening on someone's first page of a visit: the knot arrives (IntroKnot),
 * "sutRa" rises letter by letter over a gold thread, then the logo glides up
 * into the header as the shop fades in. Phones and desktop alike.
 *
 * The whole sequence is CSS (globals.css, "Opening intro"), so it starts with
 * the first paint instead of waiting for React, and ends itself even if
 * scripts never run. This component only adds the two things CSS cannot:
 * aiming the logo's flight at the header logo, and tap-to-skip.
 *
 * Whether it plays at all is decided by INTRO_GATE (lib/intro.ts) before the
 * page paints, so returning visitors never see a flash of it.
 */

/** When the logo starts its flight to the header, in ms (matches the CSS). */
const FLIGHT_AT = 2200;

const TAGLINE = "Indian Traditional Wear";

/*
 * The knot's two strands (SutraMark's arcs). How they arrive is all CSS
 * ("Opening intro" in globals.css): a gold spark runs round each strand as it
 * glows up, or, during Diwali, a diya flame lights in the middle and opens out
 * into the knot. Both move only by turning, scaling and fading, which phones
 * keep running while they are busy starting the page.
 */
const STRANDS = [
  { className: "sutra-intro-strand is-first", d: "M53.83 34.32 A23 23 0 1 1 45.62 28.67" },
  { className: "sutra-intro-strand is-second", d: "M46.17 65.68 A23 23 0 1 1 54.38 71.33" },
];

/** Built like SutraMark, so its proportions match the header logo it lands on. */
function IntroKnot() {
  return (
    <span className="sutra-intro-mark relative h-[1.55em] w-[1.55em] shrink-0 text-primary">
      <span className="sutra-intro-flame" />
      {STRANDS.map((strand) => (
        <span key={strand.d} className={strand.className}>
          <svg viewBox="0 0 100 100">
            <path d={strand.d} fill="none" stroke="currentColor" strokeWidth={10} />
          </svg>
        </span>
      ))}
      <span className="sutra-intro-spark is-first" />
      <span className="sutra-intro-spark is-second" />
    </span>
  );
}

export default function IntroSplash() {
  const [done, setDone] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const logoRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (!root.classList.contains("sutra-intro-on")) {
      setDone(true);
      return;
    }

    // Aim the flight at the header logo, if there is still time before it
    // starts. Too late (a slow phone took that long to load scripts) and the
    // logo simply fades where it is, which is what the CSS does by default.
    const logo = logoRef.current;
    const target = document.querySelector(".sutra-header .sutra-logo svg");
    const from = logo?.querySelector(".sutra-intro-mark");
    const started = Number(logo?.getAnimations?.()[0]?.currentTime ?? performance.now());
    if (logo && target && from && started < FLIGHT_AT - 100) {
      const a = from.getBoundingClientRect();
      const b = target.getBoundingClientRect();
      logo.style.setProperty("--intro-dx", `${b.left - a.left}px`);
      logo.style.setProperty("--intro-dy", `${b.top - a.top}px`);
      logo.style.setProperty("--intro-k", String(b.width / a.width));
      logo.style.setProperty("--intro-hold", "1");
    }

    const finish = () => {
      root.classList.remove("sutra-intro-on");
      setDone(true);
    };
    // A little after the CSS ends (3.1s), as a backstop for animationend.
    const timer = window.setTimeout(finish, 3500);
    const skip = () => {
      root.classList.remove("sutra-intro-on");
      setSkipping(true);
      window.setTimeout(() => setDone(true), 260);
    };
    window.addEventListener("keydown", skip, { once: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", skip);
      root.classList.remove("sutra-intro-on");
    };
  }, []);

  if (done) return null;

  return (
    <div
      aria-hidden="true"
      className={`sutra-intro print:hidden ${skipping ? "is-skipping" : ""}`}
      onPointerDown={() => {
        document.documentElement.classList.remove("sutra-intro-on");
        setSkipping(true);
        window.setTimeout(() => setDone(true), 260);
      }}
      onAnimationEnd={(e) => {
        if (e.target === e.currentTarget && e.animationName === "sutra-intro-end") {
          document.documentElement.classList.remove("sutra-intro-on");
          setDone(true);
        }
      }}
    >
      <div className="sutra-intro-bg">
        <IntroDiwali />
      </div>
      <div className="sutra-intro-center">
        {/* Built like <Logo />, so its proportions match the header logo it lands on. */}
        <span ref={logoRef} className="sutra-intro-logo inline-flex items-center gap-[0.34em]">
          <IntroKnot />
          <span className="font-sans leading-none tracking-[0.01em]">
            {[..."sutRa"].map((c, i) => (
              <span key={i} className="sutra-intro-letter" style={{ "--i": i } as React.CSSProperties}>
                {c}
              </span>
            ))}
          </span>
        </span>
        <span className="sutra-intro-thread" />
        {/* Letter by letter, so the spread can be moved rather than re-spaced (see CSS). */}
        <span className="sutra-intro-tag font-hero-ui">
          {[...TAGLINE].map((c, i) => (
            <span key={i} style={{ "--o": i - TAGLINE.length / 2 } as React.CSSProperties}>
              {c}
            </span>
          ))}
        </span>
      </div>
      <span className="sutra-intro-skip font-hero-ui">Tap to skip</span>
    </div>
  );
}
