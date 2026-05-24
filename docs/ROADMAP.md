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

## Phase 2.2 — Media library v1

Status: implemented foundation.

- Seed existing product images into the media table.
- Add media URL registration.
- Add local/dev image uploads to `public/uploads`.
- Add a media gallery in `/admin`.
- Add product image picker backed by media records.
- Allow local `/uploads/...` image paths and arbitrary registered external image URLs.
- Add clearer admin success/status banners.

## Phase 3.0 — Customer inquiry flow v1

Status: implemented foundation.

- Add customer inquiry records linked to products.
- Add product detail inquiry forms for name, phone, optional email, preferred date, delivery notes, and message.
- Add admin inquiry inbox for reviewing customer requests.
- Keep route files thin by moving product detail and inquiry UI into focused components.

Remaining before production:
- Add inquiry status updates and internal staff notes.
- Add email/WhatsApp notification hooks.
- Add richer validation and inline form errors.
- Replace password-only auth with user accounts or a provider such as Auth.js, Clerk, or Supabase Auth.
- Add role checks and audit logging.
- Replace local file uploads with production object storage such as S3, Cloudinary, or Supabase Storage.

## Phase 3.1 — Inquiry management

- Add status mutation controls for new/contacted/confirmed/fulfilled/cancelled.
- Add admin notes and customer follow-up history.
- Add notification hooks.

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
