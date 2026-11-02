"use client";

import { LazyMotion, domAnimation } from "framer-motion";

/**
 * The site's animations (fades, slides, hover and tap) only need framer-motion's
 * DOM animation features, not its layout and drag engine. Components import
 * `m as motion` and get their features from here, which roughly halves the
 * animation code every page downloads and runs. `strict` makes a stray full
 * `motion` import fail loudly instead of quietly bringing the whole engine back.
 */
export default function MotionProvider({ children }: { children: React.ReactNode }) {
  return (
    <LazyMotion features={domAnimation} strict>
      {children}
    </LazyMotion>
  );
}
