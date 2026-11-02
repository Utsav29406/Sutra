"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { MandalaMotif } from "@/components/MandalaMotif";
import { usePhone } from "@/sutra-mobile/usePhone";

/** Auth pages draw their own single centred mandala, so the backdrop keeps its out of the way. */
const AUTH_ROUTES = ["/login", "/signup", "/forgot-password"];

/**
 * The animated field behind every page. Fixed to the viewport, so it holds
 * still while content scrolls over it, and the mandalas turn with scroll
 * position over a slow ambient drift.
 */
export default function SiteBackdrop() {
  const pathname = usePathname();
  const onAuthPage = AUTH_ROUTES.includes(pathname);

  const phone = usePhone();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const centerRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    /*
     * Phones get a lighter sky. Measured on a throttled phone, this canvas was
     * the biggest single cause of dropped frames while scrolling: redrawn on
     * every frame at 3x pixel density. There it draws at most 1.5x density,
     * half the stars, 30 times a second, and holds still while the page is
     * being scrolled. Tablets and desktop are unchanged.
     */
    const dpr = phone ? Math.min(window.devicePixelRatio || 1, 1.5) : window.devicePixelRatio || 1;
    const step = phone ? 2 : 1;
    let lastDraw = 0;
    let lastScroll = 0;
    const onScroll = () => {
      lastScroll = performance.now();
    };
    if (phone) window.addEventListener("scroll", onScroll, { passive: true });

    function resize() {
      if (!canvas) return;
      const { width, height } = canvas.getBoundingClientRect();
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }
    resize();
    window.addEventListener("resize", resize);

    const embers = Array.from({ length: phone ? 18 : 45 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.6 + Math.random() * 1.6,
      speed: 0.00012 + Math.random() * 0.00035,
      drift: (Math.random() - 0.5) * 0.0004,
      alpha: 0.15 + Math.random() * 0.4,
    }));

    const stars = Array.from({ length: phone ? 32 : 70 }, () => ({
      x: Math.random(),
      y: Math.random() * 0.84,
      r: 0.5 + Math.random() * 1.4,
      phase: Math.random() * Math.PI * 2,
      speed: 0.008 + Math.random() * 0.022,
      peak: 0.3 + Math.random() * 0.55,
      warm: Math.random() < 0.38,
    }));

    const root = document.documentElement;
    function draw(now = performance.now()) {
      if (!canvas || !ctx) return;
      // Hidden behind the opening: draw the sky once, then rest until it's
      // gone, so the logo's animation has the phone to itself.
      if (lastDraw && root.classList.contains("sutra-intro-on")) {
        frame = requestAnimationFrame(draw);
        return;
      }
      if (phone && (now - lastDraw < 32 || now - lastScroll < 180)) {
        frame = requestAnimationFrame(draw);
        return;
      }
      lastDraw = now;
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      for (const star of stars) {
        star.phase += star.speed * step;
        const t = (Math.sin(star.phase) + 1) / 2;
        const intensity = star.peak * (0.25 + 0.75 * t);
        const radius = star.r * dpr * (0.85 + 0.3 * t);
        const rgb = star.warm ? "212, 175, 55" : "255, 246, 236";
        const cx = star.x * w;
        const cy = star.y * h;

        ctx.beginPath();
        ctx.arc(cx, cy, radius * 3.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb}, ${intensity * 0.1})`;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb}, ${intensity})`;
        ctx.fill();

        if (star.r > 1.5 && t > 0.55) {
          const arm = radius * 6;
          ctx.beginPath();
          ctx.moveTo(cx - arm, cy);
          ctx.lineTo(cx + arm, cy);
          ctx.moveTo(cx, cy - arm);
          ctx.lineTo(cx, cy + arm);
          ctx.strokeStyle = `rgba(${rgb}, ${0.28 * intensity * (t - 0.55) * 2})`;
          ctx.lineWidth = 0.7 * dpr;
          ctx.stroke();
        }
      }

      for (const ember of embers) {
        ember.y -= ember.speed * step;
        ember.x += ember.drift * step;
        if (ember.y < -0.02) {
          ember.y = 1.02;
          ember.x = Math.random();
        }
        ctx.beginPath();
        ctx.arc(ember.x * w, ember.y * h, ember.r * dpr, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(212, 175, 55, ${ember.alpha})`;
        ctx.fill();
      }

      frame = requestAnimationFrame(draw);
    }
    draw();

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
    };
  }, [phone]);

  // Phones: the centre mandala holds still (it turned with scroll and over
  // time). Clearing the inline transform hands centring back to the class.

  useEffect(() => {
    if (phone) {
      if (centerRef.current) centerRef.current.style.transform = "";
      return;
    }
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;
    let eased = 0;
    const start = performance.now();

    const tick = (now: number) => {
      // ease toward the real scroll offset so a fast flick glides rather than snaps
      eased += (window.scrollY - eased) * 0.12;
      const drift = (now - start) / 1000;

      // drift multipliers are degrees per second of ambient turn
      if (centerRef.current) {
        centerRef.current.style.transform = `translate(-50%, -50%) rotate(${eased * 0.08 + drift * 6}deg)`;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(frame);
  }, [phone]);

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      style={{ background: "#1a1416" }}
      aria-hidden="true"
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(34% 42% at 50% 50%, rgba(212, 175, 55, 0.10), transparent 70%)",
        }}
      />

      {/* The warm pool of gold. Three elliptical blooms turning against each
          other at different speeds and blurred into one another — a circle
          rotating would look identical to itself, an ellipse does not. The
          whole pool also drifts on a slow cycle. */}
      <div className="sutra-glow absolute" style={{ left: "44%", top: "46%" }}>
        <span className="sutra-bloom sutra-bloom-a" />
        <span className="sutra-bloom sutra-bloom-b" />
        <span className="sutra-bloom sutra-bloom-c" />
      </div>

      {!onAuthPage && (
        <>
          {/* Centred by the class as well as by the scroll tick. The tick only
              starts once JavaScript runs, so without the translate here the
              first painted frame put the mandala's corner, not its middle, at
              the centre, and it jumped 215px up-left on every page open. It
              also left it off-centre for anyone with reduced motion on, where
              the tick never runs. The tick's inline transform overrides this. */}
          {/* The centre one is the whole ornament now. The matched pair that
              used to sit in the top-right and bottom-left corners was removed:
              at 18% they read as objects rather than atmosphere, and the top
              one cut across the navbar. */}
          <MandalaMotif
            ref={centerRef}
            spin={false}
            className="sutra-backdrop-mandala absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white/[0.13]"
            size={480}
          />
        </>
      )}
    </div>
  );
}
