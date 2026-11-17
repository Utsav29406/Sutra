/*
 * Kept out of IntroSplash (a client component) so the root layout, a server
 * component, can inline it as a plain string.
 */

const SEEN_KEY = "sutra-intro-seen";

/**
 * Runs inline at the top of <body>. Turns the intro on (html.sutra-intro-on)
 * only for the first page of a visit, and never for reduced motion, crawlers
 * or the admin pages. Anything unexpected leaves it off.
 */
export const INTRO_GATE = `try{var d=document.documentElement;if(!sessionStorage.getItem("${SEEN_KEY}")&&!matchMedia("(prefers-reduced-motion: reduce)").matches&&!/bot|crawl|spider|lighthouse|headless/i.test(navigator.userAgent)&&location.pathname.indexOf("/admin")!==0){sessionStorage.setItem("${SEEN_KEY}","1");d.classList.add("sutra-intro-on")}}catch(e){}`;
