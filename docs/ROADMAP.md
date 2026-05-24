# Golara implementation roadmap

## Phase 0 — Repository foundation

- Initialize Next.js project structure.
- Add lint/typecheck/build scripts.
- Establish visual direction and product/category seed data.

## Phase 1 — Public storefront MVP

- Build homepage, product catalog, category pages, and product detail pages.
- Add responsive layout, luxury floral styling, and product availability badges.
- Add WhatsApp inquiry CTA as the first purchase path.

## Phase 2 — Editable CMS/admin

Status: implemented foundation.

- Add database connection through Prisma.
- Replace direct seeded catalog imports with a CMS repository that reads Prisma when `DATABASE_URL` is configured.
- Preserve seeded fallback mode so previews and CI do not need a live database.
- Build admin forms for products, categories, and homepage sections.
- Add slug generation, publish/unpublish controls, product badges, image URL editing, seed data, and revalidation after writes.

## Phase 2.1 — Admin write protection

Status: implemented foundation.

- Add an environment-based admin password gate.
- Add `/admin/login` and logout server actions.
- Require authentication before CMS write actions.
- Keep unauthenticated `/admin` in read-only/status mode.

Remaining before production:
- Replace password-only auth with user accounts or a provider such as Auth.js, Clerk, or Supabase Auth.
- Add role checks and audit logging.
- Replace image URL fields with a real media upload/storage flow.
- Add richer validation and inline form errors.

## Phase 3 — Customer/order flow

- Add inquiry/order records.
- Add customer details, delivery date, notes, and fulfillment status.
- Add admin order board.
- Add email/WhatsApp notification hooks.

## Phase 4 — Production ecommerce

- Add authentication for customers and admins.
- Add cart/checkout if needed.
- Integrate payment provider.
- Add delivery scheduling, taxes, discounts, and inventory controls.

## Phase 5 — Polish and growth

- Persian/RTL mode.
- SEO metadata and Open Graph images.
- Analytics events.
- Seasonal landing pages.
- Advanced search and filters.
- Performance, accessibility, and security hardening.
