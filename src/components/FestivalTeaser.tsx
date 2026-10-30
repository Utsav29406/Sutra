"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, m as motion } from "framer-motion";
import { CalendarPlus, X } from "lucide-react";
import { festivalOpensLabel, festivalStart, upcomingFestival, type Festival } from "@/lib/festival";
import DaysToGo from "@/components/DaysToGo";
import { useCartStore } from "@/lib/store/cart";
import { SITE_URL } from "@/lib/site";

/*
 * The big "coming soon" popup before a festival offer opens (Diwali first):
 * lanterns, a marigold toran and a row of diyas round the news of the offer.
 *
 * It greets each visitor once, two seconds after the opening intro has
 * finished, and never on checkout, sign-in, admin or festival-store pages, or over the open
 * bag. Closing it in any way hides it for that visitor until the offer
 * opens; once it opens the popup is gone for everyone, as the offer is live.
 * The dates come from FESTIVALS (lib/festival.ts), so nothing here changes.
 */

const SHOW_AFTER_MS = 2000;
// Checkout, sign-in and admin stay clear; the festival store is where the popup leads.
const QUIET_PATHS = ["/checkout", "/login", "/signup", "/forgot-password", "/admin", "/order", "/festival"];
const dismissedKey = (festival: Festival) => `sutra-teaser-${festival.id}`;

export default function FestivalTeaser() {
  const pathname = usePathname();
  const [festival, setFestival] = useState<Festival | null>(null);
  const quiet = QUIET_PATHS.some((p) => pathname.startsWith(p));
  // The wait below outlives navigation (it runs once per visit), so it reads
  // the current page from here: going from the bag straight to checkout used
  // to open the popup over checkout two seconds later.
  const quietRef = useRef(quiet);
  useEffect(() => {
    quietRef.current = quiet;
  }, [quiet]);

  // Decide once per page load, then wait for the intro and a free screen.
  useEffect(() => {
    if (quiet) return;
    const upcoming = upcomingFestival();
    if (!upcoming) return;
    try {
      if (localStorage.getItem(dismissedKey(upcoming))) return;
    } catch {
      // Storage blocked: show it, and it simply can't remember being closed.
    }
    let timer = 0;
    const wait = () => {
      const busy =
        quietRef.current ||
        document.documentElement.classList.contains("sutra-intro-on") ||
        useCartStore.getState().isOpen;
      timer = window.setTimeout(
        busy ? wait : () => (quietRef.current ? wait() : setFestival(upcoming)),
        busy ? 400 : SHOW_AFTER_MS,
      );
    };
    wait();
    return () => window.clearTimeout(timer);
    // Only on the first page of the visit that qualifies, not on every navigation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = useCallback(() => {
    setFestival((f) => {
      if (f) {
        try {
          localStorage.setItem(dismissedKey(f), "1");
        } catch {}
      }
      return null;
    });
  }, []);

  // Leaving for checkout or sign-in closes it without counting as seen.
  useEffect(() => {
    if (quiet) setFestival(null);
  }, [quiet]);

  return <AnimatePresence>{festival && <Dialog festival={festival} onClose={close} />}</AnimatePresence>;
}

function Dialog({ festival, onClose }: { festival: Festival; onClose: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const teaser = festival.teaser!;
  const opens = festivalOpensLabel(festival);

  // Keep the page still behind it, keep focus inside it, and Escape closes.
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    const html = document.documentElement;
    const overflow = html.style.overflow;
    html.style.overflow = "hidden";
    closeButton.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key !== "Tab" || !box.current) return;
      const items = box.current.querySelectorAll<HTMLElement>("a[href], button");
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      html.style.overflow = overflow;
      before?.focus?.({ preventScroll: true });
    };
  }, [onClose]);

  return (
    // Above Google One Tap (z-index 9999): in Firefox and Safari it is a frame
    // in the top corner that otherwise sits on the close button. It shows once
    // the popup is gone. Toasts stay above both (Notifications).
    <motion.div
      className="sutra-soon fixed inset-0 z-[10000] grid place-items-center p-4 print:hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.25 } }}
      transition={{ duration: 0.35 }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        ref={box}
        role="dialog"
        aria-modal="true"
        aria-labelledby="sutra-soon-title"
        aria-describedby="sutra-soon-body"
        className="sutra-soon-box"
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.98, transition: { duration: 0.2 } }}
        transition={{ duration: 0.6, ease: [0.2, 0.8, 0.2, 1], delay: 0.1 }}
      >
        <svg width="0" height="0" className="absolute" aria-hidden="true">
          <defs>
            <radialGradient id="sutra-diya-flame" cx="50%" cy="70%" r="60%">
              <stop offset="0" stopColor="#fffbe8" />
              <stop offset=".35" stopColor="#ffe08a" />
              <stop offset=".75" stopColor="#ff9b2f" />
              <stop offset="1" stopColor="#e2541a" stopOpacity=".9" />
            </radialGradient>
            <radialGradient id="sutra-diya-halo">
              <stop offset="0" stopColor="#ffcf6b" stopOpacity=".55" />
              <stop offset="1" stopColor="#ffcf6b" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="sutra-diya-clay" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#c9643a" />
              <stop offset="1" stopColor="#6e2a12" />
            </linearGradient>
          </defs>
        </svg>
        <Embers />
        <Toran />
        <Lantern className="sutra-soon-lantern" tone="marigold" />
        <Lantern className="sutra-soon-lantern is-second" tone="rose" />

        <button ref={closeButton} type="button" onClick={onClose} className="sutra-soon-x" aria-label="Close">
          <X size={18} />
        </button>

        <div className="sutra-soon-in">
          <div>
            <span className="sutra-soon-label">
              <i aria-hidden="true" />
              Coming soon
              <DaysToGo festival={festival} />
            </span>
            <h2 id="sutra-soon-title" className="sutra-soon-title">
              {teaser.title[0]} <em>{teaser.title[1]}</em>
            </h2>
            <p id="sutra-soon-body" className="sutra-soon-body">
              {teaser.body}
            </p>
            <div className="sutra-soon-ctas">
              <Link href={`/festival?preview=${festival.id}`} onClick={onClose} className="sutra-soon-gold">
                Preview {festival.edit.title.replace(/^The /, "the ")}
              </Link>
              <button type="button" onClick={() => saveToCalendar(festival)} className="sutra-soon-line">
                <CalendarPlus size={16} aria-hidden="true" />
                Add to calendar
              </button>
            </div>
            <p className="sutra-soon-fine">
              Opens at midnight on {opens.replace(/^\w+ /, "")}, India time ·{" "}
              <button type="button" onClick={onClose}>
                Maybe later
              </button>
            </p>
          </div>
          <Seal percent={festival.percentOff} />
        </div>

        <div className="sutra-soon-diyas" aria-hidden="true">
          {Array.from({ length: 9 }, (_, i) => (
            <Diya key={i} delay={-((i * 0.37) % 1.6)} />
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

/** A one-day calendar event for the opening day, as a small .ics file. */
function saveToCalendar(festival: Festival) {
  const day = (ms: number) => new Date(ms + 5.5 * 3_600_000).toISOString().slice(0, 10).replace(/-/g, "");
  const start = festivalStart(festival);
  const stamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d+/, "");
  const url = `${SITE_URL}/festival`;
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Sutra//Festival offers//EN",
    "BEGIN:VEVENT",
    `UID:${festival.id.toLowerCase()}-${festival.startsAt}@sutra`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${day(start)}`,
    `DTEND;VALUE=DATE:${day(start + 86_400_000)}`,
    `SUMMARY:Sutra ${festival.name} offer opens`,
    `DESCRIPTION:${festival.percentOff}% off every piece${festival.freeShipping ? " and free delivery" : ""} till ${festival.endsOn}. No code needed. ${url}`,
    `URL:${url}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  link.download = `sutra-${festival.id.toLowerCase()}.ics`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
}

/** Warm sparks rising like diya embers. Skipped for reduced motion. */
function Embers() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const w = (canvas.width = canvas.offsetWidth);
    const h = (canvas.height = canvas.offsetHeight);
    const spawn = (y?: number) => ({
      x: Math.random() * w,
      y: y ?? h + Math.random() * 30,
      r: 0.6 + Math.random() * 1.6,
      vy: 0.2 + Math.random() * 0.5,
      a: 0.3 + Math.random() * 0.6,
      t: Math.random() * 6,
    });
    const dots = Array.from({ length: Math.round(w / 10) }, () => spawn(Math.random() * h));
    let frame = 0;
    const loop = () => {
      ctx.clearRect(0, 0, w, h);
      for (const d of dots) {
        d.y -= d.vy;
        d.x += Math.sin(d.t) * 0.2;
        d.t += 0.03;
        const glow = ctx.createRadialGradient(d.x, d.y, 0, d.x, d.y, d.r * 4);
        glow.addColorStop(0, `rgba(255,214,130,${d.a * Math.min(1, d.y / (h * 0.5))})`);
        glow.addColorStop(1, "rgba(255,150,40,0)");
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r * 4, 0, Math.PI * 2);
        ctx.fill();
        if (d.y < -8) Object.assign(d, spawn());
      }
      frame = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(frame);
  }, []);
  return <canvas ref={ref} className="sutra-soon-embers" aria-hidden="true" />;
}

/** A marigold toran: swags of genda flowers with mango leaves where they meet. */
function Toran() {
  const flowers = useMemo(() => {
    const out: { x: number; y: number; c: string }[] = [];
    const swags = 4;
    const seg = 760 / swags;
    for (let s = 0; s < swags; s++) {
      for (let i = 0; i <= 18; i++) {
        const t = i / 18;
        out.push({ x: s * seg + seg * t, y: 6 + 72 * t * (1 - t), c: i % 2 ? "#f6c026" : "#f28c28" });
      }
    }
    return out;
  }, []);
  return (
    <svg className="sutra-soon-toran" viewBox="0 0 760 60" preserveAspectRatio="xMidYMin slice" aria-hidden="true">
      {flowers.map((f, i) => (
        <circle key={i} cx={f.x} cy={f.y} r={5.2} fill={f.c} />
      ))}
      {[190, 380, 570].map((x) => (
        <g key={x}>
          <ellipse cx={x - 8} cy={8} rx={8} ry={3.2} fill="#3f7d3a" transform={`rotate(-30 ${x - 8} 8)`} />
          <ellipse cx={x + 8} cy={8} rx={8} ry={3.2} fill="#2f6a2c" transform={`rotate(30 ${x + 8} 8)`} />
          {[0, 1, 2, 3].map((k) => (
            <circle key={k} cx={x} cy={12 + k * 9.5} r={4.6} fill={k % 2 ? "#f6c026" : "#f28c28"} />
          ))}
        </g>
      ))}
    </svg>
  );
}

/** An akash kandil, the paper star lantern hung for Diwali. */
function Lantern({ className, tone }: { className: string; tone: "marigold" | "rose" }) {
  const id = `sutra-kandil-${tone}`;
  const [light, mid, deep] = tone === "marigold" ? ["#ffe3a3", "#f29a1f", "#a8320f"] : ["#ffd6d6", "#d9475a", "#6d1328"];
  return (
    <svg className={className} viewBox="0 0 120 220" aria-hidden="true">
      <defs>
        <radialGradient id={id} cx="50%" cy="45%" r="60%">
          <stop offset="0" stopColor={light} />
          <stop offset=".45" stopColor={mid} />
          <stop offset="1" stopColor={deep} />
        </radialGradient>
        <radialGradient id={`${id}-halo`}>
          <stop offset="0" stopColor="#ffcf6b" stopOpacity=".55" />
          <stop offset="1" stopColor="#ffcf6b" stopOpacity="0" />
        </radialGradient>
      </defs>
      <line x1="60" y1="0" x2="60" y2="40" stroke="#d4af37" strokeOpacity=".6" />
      <ellipse cx="60" cy="95" rx="60" ry="60" fill={`url(#${id}-halo)`} />
      <polygon
        points="60,40 74,78 114,80 82,104 94,144 60,120 26,144 38,104 6,80 46,78"
        fill={`url(#${id})`}
        stroke="#ffd27a"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <polygon points="60,62 68,84 90,85 72,98 79,120 60,107 41,120 48,98 30,85 52,84" fill="#fff1c9" opacity=".33" />
      <circle cx="60" cy="92" r="8" fill="#fff6d8" opacity=".8" />
      <g stroke="#f2b23a" strokeWidth="1.6" strokeLinecap="round">
        <line x1="44" y1="140" x2="40" y2="200" />
        <line x1="52" y1="132" x2="50" y2="210" />
        <line x1="60" y1="122" x2="60" y2="216" />
        <line x1="68" y1="132" x2="70" y2="210" />
        <line x1="76" y1="140" x2="80" y2="200" />
      </g>
    </svg>
  );
}

/** A clay diya (gradients defined once, in Dialog); each flame flickers on its own beat. */
function Diya({ delay }: { delay: number }) {
  const style = { animationDelay: `${delay.toFixed(2)}s` };
  return (
    <svg className="sutra-soon-diya" viewBox="0 0 64 56">
      <ellipse className="sutra-soon-halo" style={style} cx="32" cy="18" rx="22" ry="20" fill="url(#sutra-diya-halo)" />
      <g className="sutra-soon-flame" style={style}>
        <path d="M32 4 C37 13 39 19 36 24 C34.5 27 29.5 27 28 24 C25 19 27 13 32 4 Z" fill="url(#sutra-diya-flame)" />
      </g>
      <path d="M6 32 C10 48 54 48 58 32 C48 36 16 36 6 32 Z" fill="url(#sutra-diya-clay)" />
      <path d="M6 32 C16 36 48 36 58 32 C54 30 42 29 32 29 C22 29 10 30 6 32 Z" fill="#3b160a" />
      <path d="M44 31 C52 30 58 28 61 25 C59 30 55 33 50 34 Z" fill="url(#sutra-diya-clay)" />
      <g fill="#f3dc8a" opacity=".85">
        {[16, 24, 32, 40, 48].map((x, i) => (
          <circle key={x} cx={x} cy={[39, 41.5, 42.3, 41.5, 39][i]} r="1.3" />
        ))}
      </g>
      <rect x="31" y="24" width="2" height="7" rx="1" fill="#3b2a1a" />
    </svg>
  );
}

/** The offer as a small rangoli that slowly turns. */
function Seal({ percent }: { percent: number }) {
  return (
    <svg className="sutra-soon-seal" viewBox="0 0 160 160" aria-hidden="true">
      <circle cx="80" cy="80" r="76" fill="rgba(17,12,14,.6)" stroke="#f29a1f" strokeWidth="1.5" />
      <circle cx="80" cy="80" r="64" fill="none" stroke="#d4af37" strokeDasharray="2 5" />
      {Array.from({ length: 12 }, (_, i) => (
        <path
          key={i}
          transform={`rotate(${i * 30} 80 80)`}
          d="M80 18 Q88 30 80 42 Q72 30 80 18Z"
          fill="#f29a1f"
          fillOpacity=".25"
          stroke="#f29a1f"
        />
      ))}
      <text x="80" y="86" textAnchor="middle" className="sutra-soon-seal-big">
        {percent}%
      </text>
      <text x="80" y="106" textAnchor="middle" className="sutra-soon-seal-small">
        OFF ALL
      </text>
    </svg>
  );
}
