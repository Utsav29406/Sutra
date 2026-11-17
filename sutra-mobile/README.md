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
| `MobileTabBar.tsx` | The floating bottom bar: Home, Shop, Search, Bag. Search opens the search row in the header. Hidden on product, checkout and admin pages, which have their own bottom bars. |
| `sutra-mobile.css` | Every phone-only style: the edge-to-edge product grid, small still mandalas, smooth scrolling (no blur), the near-solid floating navbar, short-screen sign-in cards and the 16px fields that stop iPhone zooming. |
| `usePhone.ts` | `usePhone()` returns true on a phone. Use it only when CSS can't do the job (the star background and the mandalas use it). |

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
| `components/Header.tsx` | Logo, wishlist and account in the top row; the search row opens below when Search is tapped. Search and the bag show up top only where the bottom bar is hidden. |
| `components/ProductCard.tsx` | Flipkart-style card: green rating badge and "x% off". |
| `components/ProductDetail.tsx` | Full-width photo with the heart on it, the "↓32% ₹4,999 ₹3,399" price row, and the pinned Add to Bag / Buy Now bar. |
| `app/shop/ShopClient.tsx` | The sticky Sort / Filter bar and the Sort sheet from the bottom. |
| `components/AuthShell.tsx`, `AuthFlip.tsx`, `app/forgot-password/page.tsx` | Compact sign-in and sign-up cards. |
| `app/checkout/page.tsx` | The pinned total and Place Order bar. |
| `components/ChatWidget.tsx`, `CartDrawer.tsx`, `GoogleSignIn.tsx`, `app/account/page.tsx` | Small spacing and position fixes. |
| `components/CircleParts.tsx` | `CircleHomeCard`, the Sutra Gold card on phone Home (`md:hidden`), placed after the offers strip in `app/HomeClient.tsx`. |

## Run and check it

```bash
npm install        # once
npm run dev        # http://localhost:3000
```

In Chrome, press F12, then the phone icon (Toggle device toolbar), and pick
an iPhone or a 390px width.

Deploy the same way as the rest of the site (see the README at the project root).
