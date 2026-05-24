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

## Phase 3.7 — Inquiry print view

Status: implemented foundation.

- Add a protected printable inquiry list page.
- Support all inquiries or current status filter.
- Add a print-view link to the focused inquiry board UI.

## Phase 3.8 — Inquiry pagination controls

Status: implemented foundation.

- Add a paginated inquiry read model.
- Keep CSV export and print view on the full filtered result set.
- Thread inquiry page through the thin admin route.
- Add previous/next controls to the focused inquiry board UI.

## Phase 3.9 — Inquiry search

Status: implemented foundation.

- Add inquiry search support in the repository.
- Search customer fields, messages, notes, and product title.
- Thread inquiry search through the thin admin route.
- Add a compact search form to the focused inquiry board UI.
- Preserve search across status filters and pagination.

## Phase 3.10 — Production readiness docs

Status: implemented foundation.

- Add a production launch checklist in `docs/PRODUCTION_CHECKLIST.md`.
- Document environment variables, database setup, admin CMS readiness, inquiry operations, media storage, deployment preflight, and remaining launch blockers.
- Keep implementation work unblocked by making production decisions explicit before Phase 4.

## Phase 3.11 — Admin readiness panel

Status: implemented foundation.

- Add advisory production-readiness cards to `/admin`.
- Surface database, admin auth, inquiry notification, and media storage readiness.
- Add a quick-nav anchor for the readiness panel.
- Keep the panel advisory-only so CMS write permissions remain controlled by existing database/auth checks.

## Phase 3.12 — Inquiry inline validation UX

Status: implemented foundation.

- Map server validation codes to specific inquiry fields.
- Add inline field help and field-level warning text for name, phone, email, and message errors.
- Keep the existing server action redirect contract intact.

## Phase 3.13 — Inquiry webhook notifications

Status: implemented foundation.

- Add provider-agnostic webhook delivery for new inquiry notifications.
- Document `INQUIRY_NOTIFICATION_MODE="webhook"` and `INQUIRY_NOTIFICATION_WEBHOOK_URL`.
- Keep unsupported notification modes and webhook failures safe by falling back to server logs.
- Update admin readiness messaging for log, webhook, and unsupported notification modes.

## Phase 3.14 — Admin audit log foundation

Status: implemented foundation.

- Add an `AdminAuditLog` Prisma model for CMS/inquiry mutations.
- Add a non-blocking audit helper so logging failures do not break staff workflows.
- Record audit events for media, category, product, homepage, inquiry status, and inquiry follow-up writes.

## Phase 3.15 — Admin audit log viewer

Status: implemented foundation.

- Add a read-only recent staff activity panel to `/admin`.
- Read recent `AdminAuditLog` rows through the CMS repository with seeded fallback safety.
- Add an audit-log quick-nav anchor.
- Leave staff identity, filtering, and role checks for the next auth-focused phases.

## Phase 3.16 — Media storage helper split

Status: implemented foundation.

- Move image URL normalization and local upload persistence into `lib/media/media-storage.ts`.
- Keep `/admin` media actions thin while preserving current local `/uploads/...` behavior.
- Prepare a clearer seam for replacing local uploads with object storage later.

## Phase 3.17 — Audit log filtering v1

Status: implemented foundation.

- Add action, entity, actor, and free-text search filters for the admin audit log.
- Thread audit filter query params through `/admin`.
- Preserve seeded/database fallback behavior for audit reads.

## Phase 3.18 — Admin identity seam

Status: implemented foundation.

- Add `getAdminIdentity()` as the central admin identity shape.
- Keep the current password gate while exposing label, optional email, role, and provider metadata.
- Document temporary `ADMIN_LABEL`, `ADMIN_EMAIL`, and `ADMIN_ROLE` values for password-backed sessions.

## Phase 3.19 — Audit actor attribution

Status: implemented foundation.

- Store actor type, label, email, role, and provider on `AdminAuditLog` rows.
- Record actor metadata from the admin identity seam for CMS and inquiry mutations.
- Show actor information in the admin audit-log table.

## Phase 3.20 — Media storage provider seam

Status: implemented foundation.

- Add a provider-shaped media storage interface behind `lib/media/media-storage.ts`.
- Keep `local` as the only supported provider for now.
- Include the selected provider in media-upload audit metadata.
- Prepare a narrow integration point for S3, Cloudinary, or Supabase Storage later.

Remaining before production:
- Replace password-only auth with account/provider auth.
- Add role enforcement for staff vs owner capabilities.
- Implement a real object storage provider such as S3, Cloudinary, or Supabase Storage.

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
