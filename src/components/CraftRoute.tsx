"use client";

import { useEffect, useRef, useState } from "react";
import { m as motion } from "framer-motion";
import type { Stop } from "@/lib/story";

/**
 * The craft stops, alternating sides, with one gold thread drawn through every
 * dot. The path is measured from the dots themselves, so it follows the layout
 * at any width: a centre line on desktop, the left edge on a phone.
 */
export function CraftRoute({ stops }: { stops: Stop[] }) {
  const box = useRef<HTMLDivElement>(null);
  const [d, setD] = useState("");

  useEffect(() => {
    const el = box.current;
    if (!el) return;

    function lay() {
      if (!el) return;
      const origin = el.getBoundingClientRect();
      const pts = [...el.querySelectorAll<HTMLElement>("[data-dot]")].map((dot) => {
        const r = dot.getBoundingClientRect();
        return [r.left - origin.left + r.width / 2, r.top - origin.top + r.height / 2];
      });
      if (pts.length < 2) return;
      // Each segment bows out to alternate sides, so the thread weaves through
      // the dots. The bow narrows when the dots sit at the left edge on a
      // phone, so it never runs off the page.
      const amp = Math.min(48, pts[0][0] - 2);
      let path = `M${pts[0][0]} ${pts[0][1]}`;
      for (let i = 1; i < pts.length; i++) {
        const [x0, y0] = pts[i - 1];
        const [x1, y1] = pts[i];
        const my = (y1 - y0) * 0.5;
        const s = i % 2 ? amp : -amp;
        path += ` C${x0 + s} ${y0 + my} ${x1 + s} ${y1 - my} ${x1} ${y1}`;
      }
      setD(path);
    }

    lay();
    const ro = new ResizeObserver(lay);
    ro.observe(el);
    // Web fonts reflow the text after first paint, which moves the dots.
    document.fonts?.ready.then(lay);
    return () => ro.disconnect();
  }, []);

  return (
    <div ref={box} className="relative mt-10 flex flex-col gap-8">
      <svg className="pointer-events-none absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
        {d && (
          <motion.path
            d={d}
            fill="none"
            stroke="rgb(var(--color-accent))"
            strokeOpacity={0.75}
            strokeWidth={1.5}
            initial={{ pathLength: 0 }}
            whileInView={{ pathLength: 1 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 2.6, ease: [0.45, 0, 0.25, 1] }}
          />
        )}
      </svg>

      {stops.map((stop, i) => {
        const right = i % 2 === 1;
        return (
          <div
            key={stop.craft}
            className={`relative flex flex-col gap-1 pl-9 sm:w-[calc(50%-36px)] sm:pl-0 ${
              right ? "sm:self-end" : "sm:text-right"
            }`}
          >
            <span
              data-dot
              className={`absolute left-0 top-[9px] h-[11px] w-[11px] rounded-full border-2 border-accent-light bg-cream ${
                right ? "sm:-left-[42px]" : "sm:left-auto sm:-right-[42px]"
              }`}
            />
            <span className="text-[11px] uppercase tracking-[0.2em] text-accent">{stop.place}</span>
            <span className="font-display text-[22px] leading-snug">{stop.craft}</span>
            <p className="text-sm leading-relaxed text-foreground/60">{stop.line}</p>
          </div>
        );
      })}
    </div>
  );
}
