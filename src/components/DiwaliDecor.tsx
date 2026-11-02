/*
 * Diwali's artwork, shared by the opening screen (IntroDiwali: diyas) and the
 * home page's theme: the marigold toran, diyas, akash kandils and fireworks. Everything is in the HTML all year; CSS shows the home pieces only
 * while <html data-fest-theme="DIWALI"> is set (lib/festival-theme). Styles:
 * globals.css, "Diwali opening" and "Diwali theme". Every number is fixed, so
 * the server and the browser draw the same thing.
 */

const f = (n: number) => Number(n.toFixed(1));

/** How far each toran's swag dips: the home hero's and the phone pages'. */
const SAGS = [60, 50] as const;
type Sag = (typeof SAGS)[number];

/**
 * The paint and the still parts every diya, lantern and toran uses, rendered
 * once in the root layout. The swags and diya bowls are drawn here once and
 * placed with <use>, which keeps the page's HTML small (the toran alone was
 * over a thousand shapes); only the parts that move are drawn inline.
 */
export function DiwaliDefs() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden="true">
      {SAGS.map((sag) => (
        <symbol key={sag} id={`sutra-dw-garland-${sag}`} overflow="visible">
          <Garland sag={sag} />
        </symbol>
      ))}
      <symbol id="sutra-dw-bowl" overflow="visible">
        <path d="M5 37 C 9 50, 20 55, 30 55 C 40 55, 51 50, 55 37 Z" fill="url(#sutra-dw-clay)" />
        <ellipse cx={30} cy={37} rx={25} ry={3.6} fill="#4a1c0e" stroke="#d4af37" strokeWidth={1.2} />
        <g fill="#d4af37">
          {[
            [18, 46],
            [24, 48.5],
            [30, 49.3],
            [36, 48.5],
            [42, 46],
          ].map(([x, y]) => (
            <circle key={x} cx={x} cy={y} r={1.4} />
          ))}
        </g>
      </symbol>
      <defs>
        <radialGradient id="sutra-dw-flame" cx="50%" cy="75%" r="65%">
          <stop offset="0" stopColor="#fffbe6" />
          <stop offset="0.35" stopColor="#ffd36b" />
          <stop offset="1" stopColor="#f26b1b" />
        </radialGradient>
        <linearGradient id="sutra-dw-clay" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#c2622e" />
          <stop offset="1" stopColor="#6e2a14" />
        </linearGradient>
        <radialGradient id="sutra-dw-lantern" cx="50%" cy="55%" r="60%">
          <stop offset="0" stopColor="#ffe7a3" />
          <stop offset="0.45" stopColor="#f28c1b" />
          <stop offset="1" stopColor="#8f2416" />
        </radialGradient>
      </defs>
    </svg>
  );
}

function Marigold({ x, y, r, light }: { x: number; y: number; r: number; light: boolean }) {
  return (
    <>
      <circle
        cx={x}
        cy={y}
        r={r}
        fill={light ? "#f8c23a" : "#f28c1b"}
        stroke="#c75f0e"
        strokeWidth={1.9}
        strokeDasharray="2.2 1.6"
      />
      <circle cx={x} cy={y} r={f(r * 0.33)} fill="#c75f0e" />
    </>
  );
}

/** The still part of one swag: the cord, marigolds along the curve, and mango leaves at the join. */
function Garland({ sag }: { sag: Sag }) {
  const beads = Array.from({ length: 13 }, (_, i) => {
    const t = (i + 1) / 14;
    const u = 1 - t;
    return { x: f(200 * t * t + 200 * u * t), y: f(8 * u * u + 2 * sag * u * t + 8 * t * t) };
  });
  return (
    <>
      <line x1={0} y1={5} x2={200} y2={5} stroke="#8a5a2b" strokeWidth={1.5} />
      {beads.map((b, i) => (
        <Marigold key={i} x={b.x} y={b.y} r={7.4} light={i % 2 === 1} />
      ))}
      {[-28, 0, 28].map((a) => (
        <ellipse key={a} cx={0} cy={22} rx={4.5} ry={13} fill="#4f8a3c" transform={`rotate(${a} 0 8)`} />
      ))}
    </>
  );
}

/**
 * One swag of the toran, 200 x 112: the garland (drawn once in DiwaliDefs)
 * and, at the join, a hanging strand of `strand` flowers and a bell that
 * sways. `sag` is how far the curve dips.
 */
export function Swag({ strand, sag }: { strand: number; sag: Sag }) {
  const bell = 14 * strand + 20;
  return (
    <svg viewBox="0 0 200 112" aria-hidden="true">
      <use href={`#sutra-dw-garland-${sag}`} />
      <g className="sutra-dw-strand">
        {Array.from({ length: strand }, (_, k) => (
          <Marigold key={k} x={0} y={22 + k * 14} r={6.4} light={k % 2 === 1} />
        ))}
        <path
          d={`M-5 ${bell + 8} Q-5 ${bell} 0 ${bell} Q5 ${bell} 5 ${bell + 8} L7 ${bell + 14} L-7 ${bell + 14} Z`}
          fill="#d4af37"
        />
        <circle cx={0} cy={bell + 16.5} r={2} fill="#d4af37" />
      </g>
    </svg>
  );
}

/** A clay diya. `ignite` wraps the flame so the opening can light it. */
export function DiyaSvg({ ignite = false }: { ignite?: boolean }) {
  const flame = (
    <g className="sutra-dw-flick">
      <path d="M30 6 C 37 17, 39 26, 30 35 C 21 26, 23 17, 30 6 Z" fill="url(#sutra-dw-flame)" />
      <path d="M30 20 C 33 25, 33 30, 30 34 C 27 30, 27 25, 30 20 Z" fill="#fffbe6" />
    </g>
  );
  return (
    <svg viewBox="0 0 60 60" aria-hidden="true">
      {ignite ? <g className="sutra-dw-light">{flame}</g> : flame}
      <use href="#sutra-dw-bowl" />
    </svg>
  );
}

/** A lit diya with its glow. `i` staggers the flicker so a row doesn't move in step. */
export function Diya({ i = 0, className }: { i?: number; className?: string }) {
  return (
    <span
      className={`sutra-fest-diya ${className ?? ""}`}
      style={{ "--d": `${f((i * 0.13) % 0.34)}s` } as React.CSSProperties}
    >
      <span className="sutra-fest-halo" />
      <DiyaSvg />
    </span>
  );
}

/** A small diya between two gold rules, above a section heading. */
export function LampLine() {
  return (
    <div data-diwali className="sutra-fest-lampline" aria-hidden="true">
      <Diya />
    </div>
  );
}

/*
 * Akash kandils. Desktop: --f places each across the hero's right half, clear
 * of the copy. Below 1024px only those with --r show, hung from the right edge.
 */
const LANTERNS = [
  { f: 0.05, h: 40, k: 0.85, dl: 0 },
  { f: 0.27, h: 150, k: 1.15, dl: -1.4, r: 150, ph: 30, pk: 0.75 },
  { f: 0.48, h: 70, k: 0.95, dl: -0.7 },
  { f: 0.7, h: 190, k: 1.25, dl: -2, r: 96, ph: 80, pk: 0.95 },
  { f: 0.9, h: 60, k: 0.8, dl: -1, r: 44, ph: 20, pk: 0.7 },
];

function Lantern() {
  return (
    <svg viewBox="0 0 60 116" aria-hidden="true">
      <path d="M22 0 H38 L42 8 H18 Z" fill="#d4af37" />
      <path d="M18 8 C 3 30, 3 56, 18 76 H42 C 57 56, 57 30, 42 8 Z" fill="url(#sutra-dw-lantern)" />
      <g fill="none" stroke="#d4af37" strokeOpacity={0.7} strokeWidth={1}>
        <path d="M24 8 C 14 30, 14 56, 24 76" />
        <path d="M36 8 C 46 30, 46 56, 36 76" />
        <path d="M30 8 V 76" />
      </g>
      <rect x={6} y={40} width={48} height={4} rx={2} fill="#d4af37" />
      <path d="M18 76 H42 L36 84 H24 Z" fill="#d4af37" />
      <g strokeWidth={2} strokeLinecap="round">
        <path d="M25 85 V 108" stroke="#f28c1b" />
        <path d="M28 85 V 114" stroke="#7f1d1d" />
        <path d="M30 85 V 110" stroke="#d4af37" />
        <path d="M32 85 V 114" stroke="#7f1d1d" />
        <path d="M35 85 V 108" stroke="#f28c1b" />
      </g>
    </svg>
  );
}

/*
 * Fireworks, each on a 5.4s loop: a trail rises, the burst opens and fades.
 * Desktop places them like the lanterns (--f, --y); below 1024px only those
 * with --pl show, in the band above the copy.
 */
const BURSTS = [
  { f: 0.15, y: 22, d: 0.3, c: "#d4af37", rays: 14, len: 52, pl: 18, py: 46 },
  { f: 0.55, y: 50, d: 1.0, c: "#f28c1b", rays: 12, len: 44 },
  { f: 0.92, y: 30, d: 1.7, c: "#e8737a", rays: 12, len: 40 },
  { f: 0.38, y: 68, d: 2.4, c: "#d4af37", rays: 10, len: 34, pl: 42, py: 96 },
  { f: 0.78, y: 12, d: 3.1, c: "#ffe9a8", rays: 16, len: 56 },
  { f: 0.68, y: 74, d: 3.8, c: "#f28c1b", rays: 10, len: 32 },
  { f: 0.02, y: 58, d: 4.5, c: "#e8737a", rays: 12, len: 38, pl: 8, py: 120 },
];

/** Everything the hero wears for Diwali, behind its copy. */
export function HeroNight() {
  return (
    <div data-diwali className="sutra-dw-hero" aria-hidden="true">
      <div className="sutra-fest-glow" />
      {BURSTS.map((b) => (
        <span
          key={b.d}
          className="sutra-fest-burst"
          data-phone={b.pl !== undefined || undefined}
          style={
            {
              "--f": b.f,
              "--y": `${b.y}%`,
              "--d": `${b.d}s`,
              "--c": b.c,
              "--len": `${b.len}px`,
              "--pl": `${b.pl ?? 0}%`,
              "--py": `${b.py ?? 0}px`,
            } as React.CSSProperties
          }
        >
          <em />
          <b />
          {Array.from({ length: b.rays }, (_, i) => (
            <i key={i} style={{ "--a": `${f((360 / b.rays) * i)}deg` } as React.CSSProperties} />
          ))}
        </span>
      ))}
      {LANTERNS.map((l) => (
        <span
          key={l.f}
          className="sutra-fest-lantern"
          data-phone={l.r !== undefined || undefined}
          style={
            {
              "--f": l.f,
              "--h": `${l.h}px`,
              "--k": l.k,
              "--dl": `${l.dl}s`,
              "--r": `${l.r ?? 0}px`,
              "--ph": `${l.ph ?? 0}px`,
              "--pk": l.pk ?? 1,
            } as React.CSSProperties
          }
        >
          <span className="sutra-fest-cord" />
          <span className="sutra-fest-lglow" />
          <Lantern />
        </span>
      ))}
      <div className="sutra-fest-diyas">
        {Array.from({ length: 11 }, (_, i) => (
          <Diya key={i} i={i} />
        ))}
      </div>
      <div className="sutra-fest-toran">
        {Array.from({ length: 16 }, (_, i) => (
          <Swag key={i} strand={2} sag={60} />
        ))}
      </div>
    </div>
  );
}

/* [left %, delay s, duration s, size px, drift px] */
const EMBERS = [
  [8, 0, 9, 3, -20],
  [17, 3, 11, 2, 16],
  [29, 6, 10, 2, -12],
  [41, 1.5, 12, 3, 10],
  [53, 4.5, 9, 2, -16],
  [64, 7, 11, 3, 14],
  [75, 2.5, 10, 2, -10],
  [86, 5.5, 12, 3, 18],
  [94, 8, 9, 2, -8],
];

/** Sparks drifting up the home page. */
export function Embers() {
  return (
    <div data-diwali className="sutra-fest-embers" aria-hidden="true">
      {EMBERS.map(([x, d, t, s, drift]) => (
        <i
          key={x}
          style={
            { "--x": `${x}%`, "--d": `${d}s`, "--t": `${t}s`, "--s": `${s}px`, "--drift": `${drift}px` } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

/** A row of diyas along the top of the footer, and the greeting. */
export function FooterLamps() {
  return (
    <div data-diwali>
      <div className="sutra-fest-footlamps" aria-hidden="true">
        {Array.from({ length: 9 }, (_, i) => (
          <Diya key={i} i={i} />
        ))}
      </div>
      <p className="pt-9 text-center font-hero text-[22px] italic text-[#ffd36b]">Happy Diwali from all of us at Sutra</p>
    </div>
  );
}
