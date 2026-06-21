# Golara

**Golara is a polished floral commerce platform for premium bouquets, curated gifts, events, and custom orders.** It gives customers a refined bilingual shopping experience and gives the business team an admin workspace for catalog, inquiries, orders, translations, media, analytics, and operational readiness.

![Golara luxury floral storefront homepage](public/site/golara-homepage-hero.jpg)

## A storefront built for premium floral shopping

Golara is designed for customers who want more than a basic product grid. The public site presents flowers and gifts with a calm luxury feel, strong photography, bilingual English/Persian support, clear product discovery, and inquiry-friendly ordering for bespoke arrangements.

The experience is built around the real buying journey: discover a collection, browse occasion-ready categories, inspect product details, add available items to cart, or request help for custom and quote-based pieces.

![Golara category and product browsing experience](public/site/golara-category.jpg)

## Why Golara feels different

- **Luxury-first presentation** with large visuals, editorial copy, and a premium brand tone.
- **Bilingual storefront support** for English and Persian content, layout direction, and localized catalog labels.
- **Flexible commerce flow** for normal cart checkout, inquiry-first products, custom requests, weddings, events, and high-touch orders.
- **Rich product discovery** with category pages, product cards, filters, sorting, quick add, mobile add-to-cart, and reassurance messaging.
- **Customer inquiry capture** for name, phone, optional email, preferred date, delivery notes, and product-specific requests.
- **Operational admin tools** for products, categories, media, translations, inquiries, customers, orders, analytics, and launch readiness.
- **Production-oriented safeguards** including CI gates, route smoke tests, performance checks, and CodeQL security scanning.

## For shoppers

Golara gives shoppers a clear path from inspiration to purchase or consultation:

1. Land on a premium visual homepage.
2. Browse flowers, boxes, gifts, and occasion collections.
3. Filter and sort products without losing the brand experience.
4. Add available products to cart or submit an inquiry for custom work.
5. Continue in English or Persian with localized content and direction-aware UI.

## For the business team

The admin experience is built to help a floral team run the site without editing code. Admin users can manage catalog records, review operational signals, track inquiries, inspect order activity, maintain translations, and keep media organized.

![Golara admin operations dashboard](public/site/golara-admin.jpg)

Admin highlights include:

- Overview dashboard with operations, readiness, and quick-access sections.
- Product and category management for storefront catalog upkeep.
- Inquiry CRM workflow with statuses, notes, follow-up history, print view, and CSV export.
- Customer and order views for day-to-day service work.
- Media library tools for uploaded and registered images.
- Translation/content tools for bilingual storefront management.
- Analytics insights and trend controls for storefront activity.

## Technology foundation

Golara is built as a modern full-stack web app:

- **Next.js App Router** for storefront and admin routes.
- **TypeScript** for safer application code.
- **Tailwind CSS** for responsive visual polish.
- **Prisma** with PostgreSQL-ready data modeling.
- **Seeded fallback content** for database-free preview workflows.
- **GitHub Actions CI** for typecheck, tests, build, performance, and route smoke.
- **CodeQL** for JavaScript/TypeScript security scanning.

## Local setup

Install dependencies and run the development server:

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Enable editable/admin mode

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

Prepare the database and seed content:

```bash
npm run db:push
npm run db:seed
npm run dev
```

Visit the admin area:

```text
http://localhost:3000/admin/login
http://localhost:3000/admin
```

## Media handling

Golara supports two media flows for development and content setup:

- Register an existing image URL.
- Upload an image file into `public/uploads` for local/dev use.

For production serverless deployments, local uploads should be replaced with object storage such as S3, Cloudinary, or Supabase Storage.

## Roadmap

See [`docs/ROADMAP.md`](docs/ROADMAP.md) and the admin roadmap documents under [`docs/`](docs/) for implementation phases and follow-up tracks.
