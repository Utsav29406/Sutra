# Sutra: Indian Traditional Wear

The code running at [wearsutra.vercel.app](https://wearsutra.vercel.app/).
Next.js 15, Tailwind 3 and a PostgreSQL database (Neon), hosted on Vercel.

## Folders

| Folder | What's inside |
|---|---|
| `sutra-mobile/` | **Sutra Mobile**: everything only phones see, with its own [README](sutra-mobile/README.md). |
| `src/app/` | The pages (home, shop, product, checkout, account, admin…) and the API routes under `src/app/api/`. |
| `src/components/` | Pieces shared by phone and desktop: header, footer, product card, product page, cart, chat, intro animation. |
| `src/lib/` | Products (`products.ts`), festival offers and dates (`festival.ts`), prices, search and the shopping stores. Server-only code is in `src/lib/server/`. |
| `public/images/` | Product and category photos. `public/images/opt/` holds their small AVIF and WebP copies, made by `scripts/build-images.mjs`. |
| `sql/` | Database schema and helper scripts. |
| `scripts/` | Photo copies (`build-images.mjs`), email, invoice and icon helpers. |

## Run it on your computer

Node.js 20 or newer is needed.

```bash
npm install          # once, or after package.json changes
npm run dev          # http://localhost:3000, reloads as you edit
npm run build        # check that it builds before deploying
```

`.env.local` holds the settings and passwords. It is never uploaded. The site uses:

| Setting | For |
|---|---|
| `POSTGRES_URL` | The PostgreSQL database on Neon (accounts, orders, reviews). |
| `DATABASE_URL` | The old TiDB (MySQL) database. Only `sql/migrate-from-mysql.mjs` reads it. |
| `OTP_SECRET` | Signing sign-in sessions and email codes. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Order and password-reset emails (Gmail with an App Password). |
| `GEMINI_API_KEY` | The Sutra Help chat. |
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | "Continue with Google". |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY` | The captcha on sign-up and forgot password. |

The live site reads the same settings from Vercel (Project → Settings →
Environment Variables). Change them there for the live site. Settings starting
with `NEXT_PUBLIC_` only take effect after a new deploy.

## Deploy

This folder is linked to the Vercel project `sutra` (the `.vercel` folder).

```bash
npx vercel deploy --prod
```

That builds on Vercel and replaces wearsutra.vercel.app. Run `npm run build`
first to catch errors on your own computer.

## Database

The shop runs on PostgreSQL (Neon), set by `POSTGRES_URL`. The tables are in
`sql/schema.sql`; `src/lib/db.ts` is the only code that talks to the database.

- `node sql/run.mjs` prints a summary of every table; `node sql/run.mjs "SELECT * FROM orders"` runs a query.
- `node sql/apply-schema.mjs` creates any missing tables from `sql/schema.sql` (safe to re-run).
- `node sql/health.mjs` is a read-only check-up: tables and row counts, columns against `sql/schema.sql`, orphaned rows, password hashes, and whether the admin still has the old default password.
- `node sql/set-password.mjs` sets a new password for the admin account (or `node sql/set-password.mjs someone@example.com` for another). It asks for the password with your typing hidden.
- `node sql/migrate-from-mysql.mjs` copied every row from the old TiDB database (`DATABASE_URL`) into PostgreSQL in one transaction and checked each table matches. It only reads TiDB. `--replace` empties PostgreSQL's tables first. `sql/schema-mysql.sql` is the old MySQL schema, kept for reference.

`.env.example` lists every setting `.env.local` needs, with no values.

These scripts work on the **live** database whenever `.env.local` points at
it, so be careful with anything that changes data.

## Common jobs

- **Add or edit a product:** `src/lib/products.ts`, with its photo in `public/images/products/`. `npm run build` makes the photo's small copies by itself. If you replace a photo but keep its file name, run `node scripts/build-images.mjs --force` once.
- **Show a product photo in new code:** use `<Photo>` (`src/components/Photo.tsx`), not `<img>`, so phones get the small copy.
- **Festival offer, dates and picks:** `src/lib/festival.ts`. See the [Sutra Mobile README](sutra-mobile/README.md#add-the-next-festival).
- **Phone layout:** `sutra-mobile/`.
