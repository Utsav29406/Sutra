import { FESTIVALS, festivalEnd, themeStart } from "@/lib/festival";

/*
 * Kept out of IntroSplash (a client component) so the root layout, a server
 * component, can inline it as a plain string.
 */

const SEEN_KEY = "sutra-intro-seen";

/** [from, to] in epoch ms for each festival theme the opening can wear. */
const OPENINGS = FESTIVALS.flatMap((f) => {
  const from = themeStart(f);
  return from === null ? [] : [[from, festivalEnd(f)]];
});

/**
 * Runs inline at the top of <body>. Turns the intro on (html.sutra-intro-on)
 * only for the first page of a visit, and never for reduced motion, crawlers
 * or the admin pages. Inside a festival's dates it also adds
 * html.sutra-intro-diwali for the Diwali background. Anything unexpected
 * leaves it off.
 */
export const INTRO_GATE = `try{var d=document.documentElement;if(!sessionStorage.getItem("${SEEN_KEY}")&&!matchMedia("(prefers-reduced-motion: reduce)").matches&&!/bot|crawl|spider|lighthouse|headless/i.test(navigator.userAgent)&&location.pathname.indexOf("/admin")!==0){sessionStorage.setItem("${SEEN_KEY}","1");d.classList.add("sutra-intro-on");var O=${JSON.stringify(OPENINGS)},n=Date.now();for(var i=0;i<O.length;i++)if(n>=O[i][0]&&n<O[i][1])d.classList.add("sutra-intro-diwali")}}catch(e){}`;
