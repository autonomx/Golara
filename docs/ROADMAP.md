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

## Phase 3 — Inquiry operations and admin hardening

Status: foundation complete.

See `docs/PHASE_3_CLOSEOUT.md` for the closeout checklist, operational launch path, and Phase 4 deferrals.

Implemented foundation:

- Customer inquiry creation from product detail pages.
- Admin inquiry inbox with status management, notes, follow-ups, filters, search, pagination, CSV export, and print view.
- Reusable inquiry validation and field-level customer-facing errors.
- Notification abstraction with log and webhook delivery modes.
- Production readiness checklist and admin readiness panel.
- Admin audit logging for CMS and inquiry mutations.
- Audit-log viewer with action, entity, actor, and free-text filters.
- Admin identity seam with password-backed label, email, role, and provider metadata.
- Owner/staff role enforcement for current password-backed sessions.
- Media storage helper/provider seam with local and Cloudinary upload providers.
- CI file-line guard to prevent oversized source files.

Deferred to Phase 4:

- Replace password-only admin auth with account/provider auth.
- Per-user admin accounts and real multi-user role management.
- Customer accounts.
- Cart, checkout, payments, taxes, discounts, inventory, and delivery scheduling.
- Optional storage providers beyond Cloudinary.

## Phase 4 — Production ecommerce

Status: ecommerce foundation complete; provider-specific PSP and full cart are deferred follow-ups.

See `docs/PHASE_4_CLOSEOUT.md` for the closeout checklist, implemented foundation, and remaining production hardening track.

Iran-market checkout direction is documented in `docs/IRAN_CHECKOUT_FLOW.md`.

Implemented foundation:

- Product-page order draft form and server checkout action.
- Phone-first customer profile records.
- Customer delivery addresses and order contact details.
- Server-side order draft creation with recomputed totals.
- Payment attempt records and configurable provider handoff seam.
- Manual payment mode and external handoff mode.
- Return/result route scaffold requiring order number plus public token.
- Idempotent return/result handling for repeated provider returns.
- Public order lookup tokens and customer-safe `/orders/[token]` status page.
- Public result banners for paid/failed/cancelled states.
- Public fulfillment status display.
- English/Persian public order status labels, copy, and RTL polish.
- Admin order list, filters, pagination, CSV export, and print view.
- Admin order detail page, timeline events, staff notes, and packing slips.
- Fulfillment status, courier/staff fields, fulfillment updates, and audit-log events.
- Public order status QA checklist.

Deferred Phase 4 follow-up track:

- Provider-specific Zarinpal/Zibal/IDPay-style create-request implementation.
- Provider-specific signed callback verification before marking paid.
- Provider idempotency keys and retry handling.
- Full multi-item cart/session flow.
- Customer login/account dashboard and order history.
- Public lookup rate limiting and security review.
- Automated e2e coverage for checkout/order routes.

## Phase 5 — Polish and growth

Status: complete as a polish foundation.

See `docs/PHASE_5_CLOSEOUT.md` for the closeout summary, completed foundations, deferred items, and recommended Phase 6 directions.

Implemented foundation:

- Metadata and structured-data foundations.
- Sitemap and robots routes.
- Visible path navigation.
- Image loading and priority hints.
- Skip links and skip-link targets.
- Card, form, button, and link focus-state passes.
- Public order status accessibility polish.
- Admin form focus consistency.
- Smoke-test foundation planning.

Deferred follow-up track:

- Full Persian storefront copy.
- Real PSP integration and callback verification.
- Customer accounts.
- Full cart/session flow.
- Lighthouse CI.
- Full Playwright suite.
- Admin auth provider upgrade.
- Advanced search and filters.
- Analytics events.
- Seasonal landing pages.
