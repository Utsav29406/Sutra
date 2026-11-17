import { FESTIVALS, festivalEnd, festivalStart } from "@/lib/festival";

/*
 * Runs inline at the top of <body>, before the first paint, and marks <html>
 * with the festival whose offer is running now (data-festival). The hero picks
 * its "before" or "during" line from it (globals.css), so the right one shows
 * from the first frame. Built from FESTIVALS, so dates stay in one place.
 */
const gateData = FESTIVALS.map((f) => ({ id: f.id, s: festivalStart(f), e: festivalEnd(f) }));

export const FESTIVAL_GATE = `try{var F=${JSON.stringify(gateData)},n=Date.now();for(var i=0;i<F.length;i++){if(n>=F[i].s&&n<F[i].e){document.documentElement.setAttribute("data-festival",F[i].id);break}}}catch(e){}`;
