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

## Phase 3.1 — Inquiry management

Status: implemented foundation.

- Add status controls for new/contacted/confirmed/fulfilled/cancelled.
- Add internal staff notes on customer inquiries.
- Show delivery date and delivery notes in the inquiry inbox.
- Keep inquiry management isolated in a small server action and focused board component.

## Phase 3.2 — Notification hooks v1

Status: implemented foundation.

- Add a small inquiry notification abstraction.
- Notify after inquiry creation in log-only mode.
- Add environment placeholders for future email and WhatsApp providers.
- Keep notification provider wiring isolated from storefront forms.

## Phase 3.3 — Inquiry validation UX v1

Status: implemented foundation.

- Add reusable server-side inquiry validation.
- Keep inquiry route action thin: parse, validate, write, notify, redirect.
- Add user-facing validation messages for name, phone, email, and message length.
- Add matching native form hints such as minLength and inputMode.

## Phase 3.4 — Inquiry follow-up history

Status: implemented foundation.

- Add a separate follow-up history model for inquiries.
- Load follow-up timeline data in the inquiry repository.
- Add append-only follow-up notes with channel labels.
- Render follow-up history inside the focused inquiry board component.

## Phase 3.5 — Inquiry inbox filters

Status: implemented foundation.

- Add inquiry status counts from the repository.
- Add status-filtered inquiry reads.
- Thread the selected status through the thin admin route.
- Add inquiry inbox filter pills with counts for each status.

## Phase 3.6 — Inquiry CSV export

Status: implemented foundation.

- Add a protected CSV export route for inquiries.
- Export all inquiries or the currently filtered inquiry status.
- Add an export link to the focused inquiry board UI.

Remaining before production:
- Replace log-only notifications with email/WhatsApp providers.
- Add richer validation and inline form errors.
- Replace password-only auth with user accounts or a provider such as Auth.js, Clerk, or Supabase Auth.
- Add role checks and audit logging.
- Replace local file uploads with production object storage such as S3, Cloudinary, or Supabase Storage.

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
