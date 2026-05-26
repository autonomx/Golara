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
- Customer accounts.
- Full cart/session flow.
- Lighthouse CI.
- Full Playwright suite.
- Admin auth provider upgrade.
- Advanced search and filters.
- Analytics events.
- Seasonal landing pages.

## Phase 6 — Real PSP integration and callback verification

Status: complete as a PSP foundation.

See `docs/PHASE_6_CLOSEOUT.md` for the closeout summary, production activation checklist, deferred items, and recommended Phase 7 direction.

Implemented foundation:

- `zarinpal` configurable payment provider option.
- Zarinpal-style server-side payment request adapter.
- Environment-driven request, verify, handoff, merchant, description, and amount-conversion settings.
- Gateway handoff redirect from checkout creation when the payment attempt requires customer redirection.
- Callback routing through `/orders/return`.
- Zarinpal `Status=OK` and `Status=NOK` callback mapping.
- Server-side paid callback verification before marking an order paid.
- Verification failure maps to failed payment instead of trusted paid state.
- Idempotent retry-safe payment attempt and order result handling.
- Manual and `domestic_redirect` fallback providers remain available.
- Admin order detail payment diagnostics.
- Safe bounded provider metadata summaries for staff.
- Sandbox/live configuration checklist.
- Manual sandbox smoke flow.
- Mock callback matrix and deterministic fixtures for future automated tests.
- Localized public payment status labels.
- Customer-facing payment guidance for manual, redirect-pending, verified, failed/unverified, and cancelled states.

Deferred follow-up track:

- Additional PSP adapters such as Zibal or IDPay, only if merchant requirements demand them.
- Retry-payment button / second gateway-attempt flow.
- Full automated Playwright or unit-test coverage for mocked request/verify callbacks.
- Live merchant-dashboard screenshots or provider-specific runbooks.
- Public lookup rate limiting and security review.
- Full Persian storefront localization.

## Phase 7 — Cart and session checkout flow

Status: complete as a cart/session checkout foundation.

See `docs/PHASE_7_CLOSEOUT.md` for the closeout summary, deferred items, and recommended Phase 8 direction.

Implemented foundation:

- `CartSession` and `CartItem` Prisma models.
- Product-to-cart item relation.
- Server-side cart repository.
- Token generation and configurable cart TTL.
- Active cart lookup with product/category active filtering.
- Add, update, remove, clear, and expire-old-cart helpers.
- Quantity bounds from 1 to 99.
- HTTP-only cart token cookie helpers.
- Add-to-cart, update, remove, and clear cart server actions.
- Safe relative return-path handling for cart actions.
- Public `/cart` page with item rows, quantity controls, removal, clear action, empty state, item count, and subtotal summary.
- Public `/cart/checkout` page with delivery/contact form and order summary.
- Cart item conversion into the existing order draft repository.
- Server-recomputed order totals remain the source of truth.
- Existing PSP payment attempt and gateway handoff path reused for cart checkout.
- Cart and cart cookie cleared after successful order draft creation.
- Product detail add-to-cart form with quantity selection.
- Product card add-to-cart button.
- Shared header `/cart` link and server-rendered cart count badge.

Deferred follow-up track:

- Cart checkout localization and field-level validation polish.
- Basic cart smoke tests or Playwright/Vitest coverage.
- Search and customer account header interactions.
- Cart expiry cleanup job/schedule.
- Full Persian storefront localization.

## Phase 8 — Customer accounts and order history

Status: in progress.

Phase 8 adds customer accounts and order history on top of the existing phone-first customer profile and public order token system.

### Phase 8.1-8.3 — Customer account/session foundation

Status: implemented foundation.

Implemented foundation:

- `CustomerAccount` and `CustomerSession` Prisma models.
- Customer account relation to existing phone-first `CustomerProfile`.
- Provider/provider-account identity seam without locking a final auth vendor.
- Hashed customer session tokens.
- Session expiry, revocation, provider, user-agent, and optional IP hash fields.
- Repository helpers for account linking, session creation, session lookup, session revocation, session expiry, and customer order-history lookup.

### Phase 8.4-8.6 — Customer session cookie and route shell

Status: implemented foundation.

Implemented foundation:

- HTTP-only customer session cookie helpers.
- Account route shell.
- Signed-in account profile summary when a valid customer session exists.
- Saved-address summaries from the customer profile.
- Sign-in placeholder surface when no session exists.
- Logout action that revokes the active session and clears the cookie.

### Phase 8.7-8.9 — Customer order history

Status: PR in progress.

Implemented foundation:

- Authenticated customer order-history page.
- Active customer session requirement.
- Order cards scoped to the signed-in customer profile.
- Order status, fulfillment status, payment summary, totals, item counts, and top line items.
- Links back to privacy-safe public order status pages when public lookup tokens exist.
- Empty and database-unavailable states.

### Phase 8.10-8.12 — Saved address/contact management

Planned:

- Customer saved address list.
- Default address management.
- Checkout prefill from authenticated customer profile.

Deferred beyond Phase 8:

- Full Persian storefront localization.
- Lighthouse CI and full Playwright suite.
