# Golara

Golara is a modern editable flower and luxury gift storefront for premium bouquets, flower boxes, weddings, events, and curated gifts. It combines a polished public shopping experience with a custom admin/CMS layer for managing homepage content, catalog records, media, translations, inquiries, and orders.

![Golara storefront homepage hero](docs/assets/golara-homepage-hero.svg)

## Highlights

- Next.js App Router storefront.
- TypeScript and Tailwind CSS foundation.
- Luxury floral homepage and catalog presentation.
- Bilingual English/Persian UI direction support.
- Editable homepage, category, product, media, and translation content.
- Prisma/PostgreSQL data model with seeded fallback content for previews.
- Admin dashboard for catalog upkeep, customer inquiries, order review, and audit visibility.
- Cart/session checkout path with server-side data handling.
- CI coverage for file-line checks, runtime guardrails, generated Prisma client, typecheck, tests, build, and route smoke.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Enable editable mode

Create `.env.local`:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/golara?schema=public"
ADMIN_PASSWORD="replace-this-password"
ADMIN_SESSION_SECRET="replace-this-session-secret"
NEXT_PUBLIC_SITE_URL="http://localhost:3000"
CHECKOUT_MODE="cart"
CHECKOUT_DOMESTIC_CURRENCY="TOMAN"
CART_SESSION_TTL_DAYS="14"
```

Then run:

```bash
npm run db:push
npm run db:seed
npm run dev
```

Visit http://localhost:3000/admin/login to sign in, then open http://localhost:3000/admin to edit site content and review operational records.

## Media uploads

Two media flows are supported:

- Register an existing image URL.
- Upload an image file into `public/uploads` for local/dev use.

For production deployments on serverless hosts, replace local uploads with object storage such as S3, Cloudinary, or Supabase Storage.

## Inquiry flow

Customers can submit name, phone, optional email, preferred date, delivery notes, and a message from product detail pages. Requests appear in the admin inquiry inbox with status management, notes, follow-up history, filtering, CSV export, and print view.

## Planned stack

- Next.js
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL in production
- Seeded fallback content for database-free previews

## Roadmap

See `docs/ROADMAP.md` for implementation phases and current follow-up tracks.
