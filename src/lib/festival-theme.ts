import { FESTIVALS, festivalEnd, themeStart } from "@/lib/festival";

/*
 * The festival theme, decided before the first paint. Pages are prerendered,
 * so everything themed is in the HTML all the time and CSS shows it only while
 * <html data-fest-theme="DIWALI"> is set (globals.css, "Diwali theme"). This
 * runs inline at the top of <body>, from the festival's themeFrom day until
 * its offer ends, so the site goes back to normal by itself.
 */

const windows = FESTIVALS.flatMap((f) => {
  const from = themeStart(f);
  return from === null ? [] : [[f.id, from, festivalEnd(f)] as const];
});

export const THEME_GATE = `try{var T=${JSON.stringify(windows)},n=Date.now();for(var i=0;i<T.length;i++)if(n>=T[i][1]&&n<T[i][2]){document.documentElement.setAttribute("data-fest-theme",T[i][0]);break}}catch(e){}`;
