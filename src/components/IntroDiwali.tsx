/*
 * The Diwali background for the opening (IntroSplash): diyas light from the
 * middle outwards, embers rise and three small fireworks burst. No toran here,
 * by request; the home page has its own under the header. It sits inside .sutra-intro-bg, so it fades out with the
 * screen and the logo's own animation is untouched.
 *
 * Always rendered, shown only while html.sutra-intro-diwali is set (by
 * INTRO_GATE, inside the dates in FESTIVALS). Every number is fixed, so the
 * server and the browser draw the same thing. Styles: globals.css, "Diwali
 * opening". The artwork itself is shared with the home page (DiwaliDecor).
 */

import { DiyaSvg } from "@/components/DiwaliDecor";

const f = (n: number) => Number(n.toFixed(1));

/* Nine diyas, left to right; each lights by its distance from the middle.
   Phones hide the outer two on each side. */
const DIYAS = Array.from({ length: 9 }, (_, i) => f(0.1 + Math.abs(i - 4) * 0.13));

/* [left %, delay s, duration s, size px, drift px] */
const EMBERS = [
  [12, 0.35, 2.1, 3, -14], [21, 0.6, 1.9, 2, 10], [30, 0.45, 2.3, 3, -8], [38, 0.9, 1.8, 2, 16],
  [44, 0.3, 2.2, 4, -6], [50, 0.7, 2.0, 3, 8], [56, 0.4, 2.4, 2, -12], [62, 0.85, 1.9, 3, 14],
  [70, 0.5, 2.2, 2, -10], [79, 0.65, 2.0, 3, 12], [88, 0.4, 2.1, 2, -16], [26, 1.1, 1.7, 2, 6],
  [48, 1.2, 1.8, 2, -4], [66, 1.05, 1.7, 2, 10], [35, 1.4, 1.5, 3, -8], [58, 1.5, 1.5, 2, 6],
];

const BURSTS = [
  { x: "18%", y: "26%", d: 0.7, c: "#d4af37", rays: 14, len: 54 },
  { x: "82%", y: "22%", d: 1.15, c: "#f28c1b", rays: 12, len: 46 },
  { x: "72%", y: "38%", d: 1.6, c: "#e8737a", rays: 10, len: 36 },
];

export default function IntroDiwali() {
  return (
    <div className="sutra-dw">
      <div className="sutra-dw-sky" />
      {BURSTS.map((b) => (
        <span
          key={b.x}
          className="sutra-dw-burst"
          style={{ "--x": b.x, "--y": b.y, "--d": `${b.d}s`, "--c": b.c, "--len": `${b.len}px` } as React.CSSProperties}
        >
          <b />
          {Array.from({ length: b.rays }, (_, i) => (
            <i key={i} style={{ "--a": `${f((360 / b.rays) * i)}deg` } as React.CSSProperties} />
          ))}
        </span>
      ))}
      {EMBERS.map(([x, d, t, s, drift], i) => (
        <span
          key={i}
          className="sutra-dw-ember"
          style={
            { "--x": `${x}%`, "--d": `${d}s`, "--t": `${t}s`, "--s": `${s}px`, "--drift": `${drift}px` } as React.CSSProperties
          }
        />
      ))}
      <div className="sutra-dw-diyas">
        {DIYAS.map((d, i) => (
          <span key={i} className="sutra-dw-diya" style={{ "--d": `${d}s` } as React.CSSProperties}>
            <span className="sutra-dw-halo" />
            <DiyaSvg ignite />
          </span>
        ))}
      </div>
    </div>
  );
}
