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

- Add database connection through Prisma.
- Replace seeded catalog data with database-backed records.
- Build protected admin pages for products, categories, homepage sections, and media uploads.
- Add form validation, image upload, slug generation, and publish/unpublish controls.

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
