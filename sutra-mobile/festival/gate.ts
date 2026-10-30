import { FESTIVALS, festivalEnd, festivalStart } from "@/lib/festival";

/* ---------------------------------------------------------------------------
 * Sutra Mobile: the festival look, before the first paint
 * ---------------------------------------------------------------------------
 * The festival look on phones changes the layout itself (Home's sections, the
 * bottom tabs), so it can't wait for React: pages are prerendered and would
 * flash the everyday layout first. FESTIVAL_GATE runs inline at the top of
 * <body> and marks <html> with the festival running now (data-festival), the
 * day of it (data-night) and that day's colour (--night, --on-night).
 * FESTIVAL_CSS then shows whatever was rendered for that festival and night
 * (data-fest-show, data-night-show) and, on phones, hides what it replaces
 * (data-fest-hide). Both are built from FESTIVALS, so dates stay in one place.
 */

/** Dark text on light colours (White, Yellow), white on the rest. */
function onColour(hex: string): string {
  const n = parseInt(hex.slice(1), 16);
  const lin = [n >> 16, (n >> 8) & 255, n & 255].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
  return luminance > 0.4 ? "#1a1416" : "#ffffff";
}

const gateData = FESTIVALS.map((f) => ({
  id: f.id,
  s: festivalStart(f),
  e: festivalEnd(f),
  c: (f.days ?? []).map((d) => [d.hex, onColour(d.hex)]),
  a: [f.phone.accent, onColour(f.phone.accent)],
}));

export const FESTIVAL_GATE = `try{var F=${JSON.stringify(gateData)},n=Date.now(),r=document.documentElement;for(var i=0;i<F.length;i++){var f=F[i];if(n>=f.s&&n<f.e){var k=Math.floor((n-f.s)/864e5)+1,c=f.c[k-1]||f.a;r.setAttribute("data-festival",f.id);r.setAttribute("data-night",String(k));r.style.setProperty("--night",c[0]);r.style.setProperty("--on-night",c[1]);break}}}catch(e){}`;

// One more than the longest list of days: the closing day (Dussehra) has its own variant.
const maxDays = Math.max(1, ...FESTIVALS.map((f) => f.days?.length ?? 0)) + 1;
export const FESTIVAL_CSS = [
  "[data-fest-show],[data-night-show]{display:none}",
  ...FESTIVALS.map((f) => `html[data-festival="${f.id}"] [data-fest-show="${f.id}"]{display:contents}`),
  ...Array.from({ length: maxDays }, (_, i) => `html[data-night="${i + 1}"] [data-night-show="${i + 1}"]{display:contents}`),
  "html[data-festival] [data-fest-none]{display:none}",
  "@media (max-width:767.98px){html[data-festival] [data-fest-hide]{display:none}}",
].join("");
