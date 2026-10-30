"use client";

import { m as motion } from "framer-motion";
import { usePhone } from "@/sutra-mobile/usePhone";

const petalAngles = Array.from({ length: 16 }, (_, i) => 22.5 * i);
const knotAngles = [22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5];

export function LotusMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      width="28"
      height="28"
      fill="none"
      stroke="currentColor"
      strokeWidth="1"
      className={className}
      aria-hidden="true"
    >
      <circle cx="20" cy="20" r="4" fill="currentColor" stroke="none" />
      {Array.from({ length: 8 }, (_, i) => (
        <path
          key={i}
          transform={`rotate(${45 * i} 20 20)`}
          d="M20 8 C 24 12, 24 16, 20 18 C 16 16, 16 12, 20 8 Z"
        />
      ))}
    </svg>
  );
}

function MandalaRings() {
  return (
    <g fill="none" stroke="currentColor" strokeWidth="0.6">
      <circle cx="100" cy="100" r="96" strokeDasharray="2 6" />
      <circle cx="100" cy="100" r="76" />
      <circle cx="100" cy="100" r="40" />
      {petalAngles.map((deg) => (
        <g key={deg} transform={`rotate(${deg} 100 100)`}>
          <path d="M100 24 C 108 44, 108 56, 100 60 C 92 56, 92 44, 100 24 Z" />
          <circle cx="100" cy="12" r="2.5" fill="currentColor" stroke="none" />
        </g>
      ))}
      {knotAngles.map((deg) => (
        <path
          key={deg}
          transform={`rotate(${deg} 100 100)`}
          d="M100 60 C 116 68, 116 84, 100 92 C 84 84, 84 68, 100 60 Z"
        />
      ))}
    </g>
  );
}

export function MandalaMotif({
  className,
  size = 260,
  duration = 30,
  reverse = false,
  spin = true,
  ref,
}: {
  className?: string;
  size?: number;
  duration?: number;
  reverse?: boolean;
  /** Set false when the caller drives rotation itself (e.g. from scroll). */
  spin?: boolean;
  ref?: React.Ref<SVGSVGElement>;
}) {
  // Phones: the mandalas hold still and are drawn at half size (the size is
  // halved in CSS, see .sutra-mandala in sutra-mobile/sutra-mobile.css). Tablets and desktop
  // keep them turning at full size.
  const phone = usePhone();
  const sized = `sutra-mandala ${className ?? ""}`;
  const style = { "--mandala-size": `${size}px` } as React.CSSProperties;

  if (!spin || phone) {
    return (
      <svg
        ref={ref}
        viewBox="0 0 200 200"
        width={size}
        height={size}
        className={sized}
        style={style}
        aria-hidden="true"
      >
        <MandalaRings />
      </svg>
    );
  }

  return (
    <motion.svg
      viewBox="0 0 200 200"
      width={size}
      height={size}
      className={sized}
      style={style}
      aria-hidden="true"
      animate={{ rotate: reverse ? -360 : 360 }}
      transition={{ duration, repeat: Infinity, ease: "linear" }}
    >
      <MandalaRings />
    </motion.svg>
  );
}
