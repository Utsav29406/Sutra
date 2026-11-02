/**
 * Festival offers: a percentage off everything and free delivery, applied by
 * itself between two dates, with no code to type. Checkout, the cart, product
 * prices, the home page banner and the server's order check all read this one
 * list, so what is advertised and what is charged can never disagree.
 *
 * Dates are India time (the shop's own calendar), inclusive: an offer ending on
 * "2026-10-20" runs until midnight at the end of that day in India, wherever
 * the shopper happens to be.
 *
 * ---------------------------------------------------------------------------
 * Adding the next festival
 * ---------------------------------------------------------------------------
 * Add an entry below. It switches itself on at the start date and off after
 * the end date: nothing has to be removed by hand afterwards.
 */

export interface Festival {
  /** Stored on the order as its offer, e.g. "NAVRATRI". Not a code anyone types. */
  id: string;
  name: string;
  /** Inclusive YYYY-MM-DD, India time. */
  startsAt: string;
  /** Inclusive YYYY-MM-DD, India time. */
  endsAt: string;
  /** Name of the last day, for "ends on Dussehra". */
  endsOn: string;
  /** The banner's headline, before "15% off". */
  tagline: string;
  /** Said on the closing day, once the listed days are over. */
  closingGreeting: string;
  percentOff: number;
  freeShipping: boolean;
  /**
   * A ticking countdown to the end of the offer (Navratri had one). false shows
   * only the closing day and date instead; Diwali goes without, by request.
   */
  countdown?: boolean;
  /** Pieces picked for the festival, by slug, shown as an edit on the home page. */
  edit: { title: string; eyebrow: string; slugs: string[] };
  /**
   * One colour per day, if the festival has them (Navratri does), with the
   * pieces in that colour, by slug, picked by eye from their photos.
   */
  days?: { colour: string; hex: string; goddess: string; slugs: string[] }[];
  /** The festival's own look on phones (sutra-mobile/festival at the project root). */
  phone: FestivalPhone;
  /**
   * The big "coming soon" popup (FestivalTeaser), shown once per visitor from
   * this India-time day until the offer opens.
   */
  teaser?: { from: string; title: [string, string]; body: string };
  /**
   * The site wears the festival's theme from this India-time day until the
   * offer ends: the opening screen (IntroDiwali) and the home page's dressing
   * (DiwaliDecor). After the last day it goes back to normal by itself. Only
   * Diwali has a theme.
   */
  themeFrom?: string;
}

/**
 * Phones get their own layout while a festival runs: a tonight card, a store
 * tab in the middle of the bottom bar, the festival price first on every card.
 * Tablets and desktop keep the usual site.
 */
export interface FestivalPhone {
  /** The middle tab's label and the store page's title. */
  tabLabel: string;
  storeTitle: string;
  storeIntro: string;
  /** Icon on the middle tab (see FestivalIcon). */
  icon: "dandiya" | "diya";
  /** Theme colour when the festival has no colour per day. */
  accent: string;
  /** Category circles on Home: label, the piece whose photo shows it, and the search it opens. */
  categories: { label: string; slug: string; q: string }[];
  /** Extra filter chips on the store page, beyond All / For her / For him / price. */
  chips: { label: string; match: RegExp }[];
  /** Heading of the row of festival pieces on a product page. */
  completeTitle: string;
  /** Home's two big tiles, each opening the store filtered to her or him. */
  forHer: { sub: string; slug: string };
  forHim: { sub: string; slug: string };
}

export const FESTIVALS: Festival[] = [
  {
    id: "NAVRATRI",
    name: "Navratri",
    startsAt: "2026-10-11",
    endsAt: "2026-10-20", // Dussehra
    endsOn: "Dussehra",
    tagline: "Nine nights of garba,",
    closingGreeting: "Shubh Vijayadashami",
    percentOff: 15,
    freeShipping: true,
    edit: {
      eyebrow: "For the nine nights",
      title: "The Garba Edit",
      slugs: [
        "chaniya-choli-garba-set",
        "mirror-work-kediyu-chorno-set",
        "bandhani-odhani-dupatta",
        "patan-patola-silk-dupatta",
        "gujarati-bridal-saree-set",
        "ajrakh-block-print-cotton-saree",
        "rajkot-patola-silk-saree",
        "bandhani-jodhpuri-safa",
        "banjara-mirror-work-kanchali-ghaghra",
        "ahir-hand-embroidered-kutchi-blouse",
        "kathiawadi-cotton-kediyu-chorno",
        "bandhani-silk-saree-madder-red",
      ],
    },
    // The colour worn on each night of Sharad Navratri 2026.
    days: [
      { colour: "Orange", hex: "#f08a24", goddess: "Maa Shailaputri",
        slugs: ["ahir-hand-embroidered-kutchi-blouse", "bomkai-cotton-saree", "leheriya-georgette-saree", "kolhapuri-leather-chappal", "chaniya-choli-garba-set"] },
      { colour: "White", hex: "#f2efe9", goddess: "Maa Brahmacharini",
        slugs: ["lucknowi-chikan-cotton-kurta", "bengal-tant-cotton-saree", "panetar-gajji-silk-saree", "angrakha-cotton-kurta", "kerala-set-mundu", "eri-silk-handloom-kurta"] },
      { colour: "Red", hex: "#d93636", goddess: "Maa Chandraghanta",
        slugs: ["bandhani-silk-saree-madder-red", "gharchola-bandhani-wedding-saree", "bandhani-jodhpuri-safa", "rabari-tie-dyed-wool-odhani", "patan-patola-double-ikat-saree", "kutchi-madder-red-wool-shawl"] },
      { colour: "Royal blue", hex: "#3f63d8", goddess: "Maa Kushmanda",
        slugs: ["pochampally-ikat-saree", "blue-khadi-cotton-kurta", "bagru-dabu-indigo-saree", "silk-dhoti-kurta-with-topi", "baluchari-silk-saree"] },
      { colour: "Yellow", hex: "#f2c230", goddess: "Maa Skandamata", slugs: ["paithani-silk-saree"] },
      { colour: "Green", hex: "#3aa55b", goddess: "Maa Katyayani", slugs: ["maheshwari-silk-cotton-saree", "paithani-silk-saree"] },
      { colour: "Grey", hex: "#9a9a9a", goddess: "Maa Kalaratri", slugs: ["kashmiri-wool-pheran", "jodhpuri-bandhgala-suit", "bhujodi-handwoven-shawl"] },
      { colour: "Purple", hex: "#8e4fc7", goddess: "Maa Mahagauri", slugs: [] },
      { colour: "Peacock green", hex: "#0f9b8e", goddess: "Maa Siddhidatri", slugs: ["maheshwari-silk-cotton-saree", "paithani-silk-saree"] },
    ],
    phone: {
      tabLabel: "Garba",
      storeTitle: "Garba Store",
      storeIntro: "Picked for the nine nights, from Kutch, Patan, Rajkot and Kathiawad.",
      icon: "dandiya",
      accent: "#d4af37",
      categories: [
        { label: "Chaniya Choli", slug: "chaniya-choli-garba-set", q: "chaniya choli" },
        { label: "Kediyu", slug: "mirror-work-kediyu-chorno-set", q: "kediyu" },
        { label: "Bandhani", slug: "bandhani-odhani-dupatta", q: "bandhani" },
        { label: "Patola", slug: "rajkot-patola-silk-saree", q: "patola" },
        { label: "Ghaghra", slug: "banjara-mirror-work-kanchali-ghaghra", q: "ghaghra" },
        { label: "Safa", slug: "bandhani-jodhpuri-safa", q: "safa" },
        { label: "Kutchi", slug: "ahir-hand-embroidered-kutchi-blouse", q: "kutch" },
      ],
      chips: [{ label: "Dupattas & safa", match: /dupatta|odhani|safa/i }],
      completeTitle: "Complete the garba look",
      forHer: { sub: "Chaniya choli, odhani, ghaghra", slug: "chaniya-choli-garba-set" },
      forHim: { sub: "Kediyu, chorno, safa", slug: "mirror-work-kediyu-chorno-set" },
    },
  },
  {
    id: "DIWALI",
    name: "Diwali",
    startsAt: "2026-11-01",
    endsAt: "2026-11-10", // Bhai Dooj; Diwali itself is Sun 8 Nov
    endsOn: "Bhai Dooj",
    tagline: "The festival of lights,",
    closingGreeting: "Happy Bhai Dooj",
    percentOff: 20,
    freeShipping: true,
    countdown: false,
    edit: {
      eyebrow: "For the festival of lights",
      title: "The Diwali Edit",
      slugs: [
        "red-banarasi-kalga-silk-saree",
        "gold-tissue-silk-saree",
        "royal-blue-banarasi-bandhani-saree",
        "rani-pink-chanderi-silk-saree",
        "maroon-zari-stripe-silk-saree",
        "phulkari-embroidered-punjabi-jutti",
        "aubergine-silk-brocade-jacket",
        "palampore-floral-long-coat",
        "muga-silk-stripe-kurta",
        "zardozi-velvet-mojari",
        "paithani-silk-saree",
        "banarasi-silk-saree",
        "kanjivaram-bridal-silk-saree",
        "zardozi-velvet-bridal-lehenga",
        "rajputi-brocade-sherwani",
        "baluchari-silk-saree",
        "gota-patti-bridal-lehenga",
        "jodhpuri-bandhgala-suit",
        "mysore-crepe-silk-saree",
        "eri-muga-silk-nehru-jacket",
        "kurta-churidar-with-nehru-jacket",
        "zari-embroidered-punjabi-jutti",
      ],
    },
    phone: {
      tabLabel: "Diwali",
      storeTitle: "Diwali Store",
      storeIntro: "Silk, zari and brocade for the five days of Diwali, and gifts for Bhai Dooj.",
      icon: "diya",
      accent: "#f29a1f",
      categories: [
        { label: "Silk sarees", slug: "banarasi-silk-saree", q: "silk saree" },
        { label: "Lehengas", slug: "zardozi-velvet-bridal-lehenga", q: "lehenga" },
        { label: "Sherwanis", slug: "rajputi-brocade-sherwani", q: "sherwani" },
        { label: "Nehru jackets", slug: "eri-muga-silk-nehru-jacket", q: "nehru jacket" },
        { label: "Dupattas", slug: "phulkari-hand-embroidered-dupatta", q: "dupatta" },
        { label: "Juttis", slug: "zari-embroidered-punjabi-jutti", q: "jutti" },
      ],
      chips: [{ label: "Gifts", match: /dupatta|safa|jutti|mojari|shawl|jacket/i }],
      completeTitle: "Complete the Diwali look",
      forHer: { sub: "Silk sarees and bridal lehengas", slug: "paithani-silk-saree" },
      forHim: { sub: "Sherwanis and Nehru jackets", slug: "rajputi-brocade-sherwani" },
    },
    teaser: {
      from: "2026-10-21",
      title: ["Diwali is", "almost here."],
      body: "20% off every piece and free delivery, from Sun 1 Nov to Bhai Dooj. No code needed: the prices drop by themselves.",
    },
    themeFrom: "2026-10-24",
  },
];

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
export const DAY_MS = 24 * 60 * 60 * 1000;

/** Midnight at the start of a YYYY-MM-DD day in India, as epoch milliseconds. */
function indiaMidnight(day: string): number {
  const [y, m, d] = day.split("-").map(Number);
  return Date.UTC(y, m - 1, d) - IST_OFFSET_MS;
}

export function festivalStart(festival: Festival): number {
  return indiaMidnight(festival.startsAt);
}

/** The moment it stops: midnight at the end of its last day, India time. */
export function festivalEnd(festival: Festival): number {
  return indiaMidnight(festival.endsAt) + DAY_MS;
}

/**
 * How long until the offer opens, in whole India days: "7 days to go", then
 * "starts tomorrow" on the eve, and "starts at midnight" from 6pm that
 * evening. Null once the offer has opened. Days only, never a ticking clock,
 * by request.
 */
export function daysToGo(festival: Festival, now: number = Date.now()): string | null {
  const start = festivalStart(festival);
  if (now >= start) return null;
  const today = Math.floor((now + IST_OFFSET_MS) / DAY_MS);
  const opening = Math.floor((start + IST_OFFSET_MS) / DAY_MS);
  const days = opening - today;
  if (days > 1) return `${days} days to go`;
  return new Date(now + IST_OFFSET_MS).getUTCHours() >= 18 ? "starts at midnight" : "starts tomorrow";
}

/** When the site starts wearing the festival's theme, if it has one. */
export function themeStart(festival: Festival): number | null {
  return festival.themeFrom ? indiaMidnight(festival.themeFrom) : null;
}

/** The festival whose theme the site wears now: from its themeFrom day to the end of its offer. */
export function themeFestival(now: number = Date.now()): Festival | null {
  return FESTIVALS.find((f) => f.themeFrom && now >= indiaMidnight(f.themeFrom) && now < festivalEnd(f)) ?? null;
}

export function activeFestival(now: number = Date.now()): Festival | null {
  return FESTIVALS.find((f) => now >= festivalStart(f) && now < festivalEnd(f)) ?? null;
}

/** The festival whose "coming soon" popup should show now: its teaser has begun and its offer hasn't. */
export function upcomingFestival(now: number = Date.now()): Festival | null {
  return FESTIVALS.find((f) => f.teaser && now >= indiaMidnight(f.teaser.from) && now < festivalStart(f)) ?? null;
}

/** "Sun 1 Nov": a festival's first day, as people in India would write it. */
export function festivalOpensLabel(festival: Festival): string {
  return new Date(festivalStart(festival)).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "Asia/Kolkata",
  });
}

export function findFestival(id: string | null | undefined): Festival | null {
  return FESTIVALS.find((f) => f.id === id) ?? null;
}

/** 1 on the first day, counting up; past the listed days on the closing day. */
export function festivalDay(festival: Festival, now: number = Date.now()): number {
  return Math.floor((now - festivalStart(festival)) / DAY_MS) + 1;
}

/** What a piece costs during the festival. */
export function festivalPrice(price: number, festival: Festival): number {
  return price - Math.round((price * festival.percentOff) / 100);
}

/** "Navratri offer" for an order's festival id, else "Coupon CODE". */
export function offerLabel(code: string): string {
  const festival = findFestival(code);
  return festival ? `${festival.name} offer` : `Coupon ${code}`;
}

/**
 * The festivals pages draw. Pages are prerendered at each deploy, so a
 * festival whose offer had already ended by then can never show, and leaving
 * it out keeps its hidden markup out of every page (Navratri's was a third of
 * Home's HTML). The cut-off is the build's own time (next.config env), so the
 * server and the browser draw the same list. FESTIVALS keeps every entry: old
 * orders still name their festival.
 */
const BUILT_AT = Number(process.env.SUTRA_BUILT_AT) || 0;
export const DRAWN_FESTIVALS = FESTIVALS.filter((f) => festivalEnd(f) > BUILT_AT);
