# Golara

Golara is a modern editable flower and luxury gift storefront. The project is intentionally not Joomla-based: it provides Joomla-like site editing through a custom admin/CMS layer while keeping the public storefront fast, clean, and easy to extend.

## Current scope

Golara now has a production-shaped ecommerce foundation:

- Next.js App Router storefront
- Thin route files with section UI moved into focused components
- RTL-ready visual system foundation
- Seeded flower/category/product fallback content for database-free previews
- Prisma/PostgreSQL data model
- Prisma seed script
- Async storefront data repository
- Admin forms for homepage content, categories, media, and products
- Media library URL registration and local/dev uploads to `public/uploads`
- Product image picker backed by media records
- Product inquiry forms that create customer inquiry records
- Admin inquiry inbox with filters, follow-ups, notes, export, and print views
- Admin audit log and readiness panel
- Environment-based admin login gate and role seam
- Server-action write protection for CMS/admin writes
- Revalidation after CMS writes
- Product-page order draft checkout
- Phone-first customer profile and delivery address records
- Public order status pages with privacy-safe token lookup
- Admin order list/detail, fulfillment fields, timeline, and packing slip views
- Configurable payment provider seam with manual, domestic redirect, and Zarinpal-style gateway options
- Server-side gateway callback verification before marking orders paid
- Admin payment diagnostics and public payment-state guidance
- Persistent cart/session data model and repository
- HTTP-only cart token cookie helpers and cart server actions
- Public `/cart` page with quantity updates, removal, clear action, and subtotal summary
- Public `/cart/checkout` flow that converts cart items into the existing order draft and PSP path
- CI for file-line checks, Prisma generation, typecheck, and build

The storefront still works without a database by reading seeded fallback data. Admin writes, inquiries, orders, payment attempts, and cart sessions require `DATABASE_URL`. CMS/admin writes also require `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`, and an authenticated admin session.

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Enable editable CMS and ecommerce mode

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

Visit http://localhost:3000/admin/login to sign in, then open http://localhost:3000/admin to edit homepage content, categories, media, products, review customer inquiries, and manage checkout orders.

## Payment providers

Golara defaults to manual/fallback payment behavior unless a gateway is configured. The current PSP foundation includes a Zarinpal-style request/verify adapter behind environment variables.

Example gateway configuration:

```bash
CHECKOUT_DOMESTIC_GATEWAY_PROVIDER="zarinpal"
ZARINPAL_MERCHANT_ID="replace-with-merchant-id"
NEXT_PUBLIC_SITE_URL="https://your-production-domain.example"
CHECKOUT_REQUIRE_PROVIDER_VERIFICATION="true"
```

Optional provider overrides:

```bash
ZARINPAL_REQUEST_URL="https://payment.zarinpal.com/pg/v4/payment/request.json"
ZARINPAL_VERIFY_URL="https://payment.zarinpal.com/pg/v4/payment/verify.json"
ZARINPAL_START_URL="https://payment.zarinpal.com/pg/StartPay"
ZARINPAL_AMOUNT_MULTIPLIER="1"
ZARINPAL_DESCRIPTION="Golara order"
```

Before enabling live payments, confirm merchant dashboard settings, callback URL behavior, amount units, sandbox/live endpoints, and repeated callback behavior. See `docs/PHASE_6_CLOSEOUT.md` and `docs/PHASE_6_7_9_PROVIDER_TEST_HARNESS.md`.

## Cart and checkout flow

Phase 7 adds the first cart/session checkout path:

- Cart sessions are persisted in the database.
- The browser stores only an HTTP-only `golara_cart` token cookie.
- `/cart` displays cart items, quantity updates, removal, clear action, item count, and subtotal.
- `/cart/checkout` collects delivery/contact details and converts active cart items into the existing server-recomputed order draft flow.
- The same payment provider seam handles payment attempts for cart checkout.

Product/card add-to-cart UI wiring remains a follow-up. The cart server actions are already available for that wiring.

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
