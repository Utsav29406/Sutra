# Sutra Mobile

Everything that only phones see on wearsutra.vercel.app. A phone here means a
screen narrower than **768px**, which is Tailwind's `md` breakpoint. Tablets
and desktop never load any of this differently.

Sutra Mobile is part of the same website, not a separate one. The cart,
checkout, sign-in, prices, orders and the database are shared with desktop, so
a fix there works everywhere at once. Only the phone layout lives here.

## What's in this folder

This folder sits at the project root, next to `src/`. Code anywhere imports
it as `@/sutra-mobile/...` (set in `tsconfig.json`), and Tailwind reads its
classes (set in `tailwind.config.ts`).

| File | What it does |
|---|---|
| `MobileTabBar.tsx` | The bottom bar: Home, Shop, Bag, Wishlist, plus the festival's raised middle tab during a festival. Hidden on product, checkout and admin pages, which have their own bottom bars. |
| `sutra-mobile.css` | Every phone-only style: the edge-to-edge product grid, small still mandalas, smooth scrolling (no blur), short-screen sign-in cards, the 16px fields that stop iPhone zooming, and the festival look (toran, tonight card, night colour). |
| `usePhone.ts` | `usePhone()` returns true on a phone. Use it only when CSS can't do the job (the star background and the mandalas use it). |
| `festival/gate.ts` | A tiny script that runs before the page paints. It finds today's festival and night from `lib/festival.ts`, and colours the phone in that night's colour. |
| `festival/PhoneFestivalHome.tsx` | Home on phones during a festival: category circles, the tonight card with the countdown, the nine nights, "Wear royal blue tonight", Shop by budget, the Garba Edit, For her / For him. |
| `festival/FestivalStore.tsx` | The Garba Store page (`/festival`), opened by the middle tab. It also works on desktop if someone opens the link. |
| `festival/FestivalParts.tsx` | Small shared pieces: the dandiya and diya icons, the "Navratri price" tag, the festival price line on cards, the small cards in sideways rows, and the toran. |

## The three ways to make something phone-only

Use one of these every time, and desktop can't change by accident:

1. **Tailwind classes in the component:** `max-md:...` (applies only on phones) and `md:hidden` (shows only on phones).
2. **CSS in `sutra-mobile.css`** inside `@media (max-width: 767.98px) { ... }`.
3. **`usePhone()`** in JavaScript, when the behaviour itself must change.

## Phone tweaks inside shared files

These pages are shared with desktop, so their phone-only bits stay in place
using `max-md:` and `md:hidden`. If something looks wrong on a phone, look here
(paths are inside `src/`):

| File | Phone-only changes |
|---|---|
| `components/Header.tsx` | Logo, festival night pill and account icon in the top row, and the search row below. The bag shows only where the bottom bar is hidden. |
| `components/ProductCard.tsx` | Flipkart-style card: green rating badge, "x% off", and the festival price first during a festival. |
| `components/ProductDetail.tsx` | Full-width photo with the heart on it, and the "↓32% ₹4,999 ₹3,399" price row. The pinned Add to Bag / Buy Now bar, the offer-applied note and "Complete the garba look". |
| `app/shop/ShopClient.tsx` | The sticky Sort / Filter bar and the Sort sheet from the bottom. |
| `components/AuthShell.tsx`, `AuthFlip.tsx`, `app/forgot-password/page.tsx` | Compact sign-in and sign-up cards. |
| `app/checkout/page.tsx` | The pinned total and Place Order bar. |
| `components/ChatWidget.tsx`, `CartDrawer.tsx`, `GoogleSignIn.tsx`, `app/account/page.tsx` | Small spacing and position fixes. |
| `app/page.tsx` | Wraps the everyday hero, banner and offer strips in `data-fest-hide`, so phones swap them for the festival Home. |

## The festival look

The dates, the offer and the phone look all come from **one place**:
`src/lib/festival.ts`. The server also reads that file to check order totals,
so the price a phone shows is always the price charged.

### Change which pieces show on a night

Edit `slugs` for that day in `src/lib/festival.ts`. A slug is the end of the
product's link: `wearsutra.vercel.app/product/`**`pochampally-ikat-saree`**.

```ts
{ colour: "Purple", hex: "#8e4fc7", goddess: "Maa Mahagauri",
  slugs: ["your-purple-piece", "another-purple-piece"] },
```

### Add the next festival

Add an entry to `FESTIVALS` in `src/lib/festival.ts` (the values below are an
example: check the real dates and picks). It switches itself on
at the start date and off after the end date, on phones and desktop alike.

```ts
{
  id: "DIWALI",
  name: "Diwali",
  startsAt: "2026-11-06",          // first day, India time
  endsAt: "2026-11-10",            // last day, India time
  endsOn: "Bhai Dooj",
  tagline: "Five days of light,",
  closingGreeting: "Happy Bhai Dooj",
  percentOff: 10,
  freeShipping: true,
  edit: { eyebrow: "For the festival of lights", title: "The Diwali Edit", slugs: ["...", "..."] },
  // no `days`: the phone uses `accent` as its colour instead
  phone: {
    tabLabel: "Diwali",
    storeTitle: "Diwali Store",
    storeIntro: "Silks and zari for the five days of Diwali.",
    icon: "diya",
    accent: "#f3b23a",
    categories: [{ label: "Silk Sarees", slug: "banarasi-silk-saree", q: "silk saree" }],
    chips: [{ label: "Sarees", match: /saree/i }],
    completeTitle: "Complete the Diwali look",
    forHer: { sub: "Silk sarees, lehengas", slug: "banarasi-silk-saree" },
    forHim: { sub: "Kurtas, sherwanis", slug: "rajputi-brocade-sherwani" },
  },
},
```

Leave old festivals in the list: they turn themselves off.

## Run and check it

```bash
npm install        # once
npm run dev        # http://localhost:3000
```

In Chrome, press F12, then the phone icon (Toggle device toolbar), and pick
an iPhone or a 390px width. Phones also get the festival look while one is
running; to see a different night, change the date on your computer.

Deploy the same way as the rest of the site (see the README at the project root).
