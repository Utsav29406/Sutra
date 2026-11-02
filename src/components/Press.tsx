"use client";

import { useEffect } from "react";

/** Adds a ripple element on pointerdown for any `.btn-shimmer` / `[data-press]` element. */
export default function Press() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    function handlePointerDown(e: PointerEvent) {
      const target = e.target as HTMLElement | null;
      const el = target?.closest<HTMLElement>(".btn-shimmer, [data-press]");
      if (!el || el.matches(":disabled")) return;

      const style = getComputedStyle(el);
      if (style.position === "static") el.style.position = "relative";
      if (style.overflow === "visible") el.style.overflow = "hidden";

      const rect = el.getBoundingClientRect();
      const ripple = document.createElement("span");
      ripple.className = "sutra-ripple";
      const size = 2.2 * Math.max(rect.width, rect.height);
      ripple.style.width = `${size}px`;
      ripple.style.height = `${size}px`;
      ripple.style.left = `${e.clientX - rect.left}px`;
      ripple.style.top = `${e.clientY - rect.top}px`;
      el.appendChild(ripple);
      ripple.addEventListener("animationend", () => ripple.remove());
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return null;
}
