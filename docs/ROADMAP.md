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
- Server-side paid callback verification before marking orders paid.
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

Status: complete as a customer account foundation.

See `docs/PHASE_8_CLOSEOUT.md` for the closeout summary, limitation note, deferred items, and recommended Phase 9 direction.

Implemented foundation:

- `CustomerAccount` and `CustomerSession` Prisma models.
- Customer account relation to existing phone-first `CustomerProfile`.
- Provider/provider-account identity seam without locking a final auth vendor.
- Hashed customer session tokens.
- Session expiry, revocation, provider, user-agent, and optional IP hash fields.
- Repository helpers for account linking, session creation, session lookup, session revocation, session expiry, and customer order-history lookup.
- HTTP-only customer session cookie helpers.
- Account route shell.
- Signed-in account profile summary when a valid customer session exists.
- Saved-address summaries from the customer profile.
- Sign-in placeholder surface when no session exists.
- Logout action that revokes the active session and clears the cookie.
- Authenticated customer order-history page.
- Order cards scoped to the signed-in customer profile.
- Customer-owned saved address page.
- Add, update, make-default, and delete address actions.
- Customer ownership checks for every address mutation.
- Default address management.
- Cart checkout prefill from signed-in customer profile and default saved address.

Deferred follow-up track:

- Real phone-first login or provider-backed sign-in flow.
- Customer profile/contact editing.
- Privacy/security review docs for authenticated order and address access.
- Field-level checkout validation polish and localization.
- Full Persian storefront localization.

## Phase 9 — Customer authentication and account hardening

Status: complete as a phone-first customer sign-in foundation.

See `docs/PHASE_9_CLOSEOUT.md` for the closeout summary, production limitation note, deferred items, and recommended Phase 10 direction.

Implemented foundation:

- Phone-first OTP selected as the primary customer sign-in model.
- Authentication decision and implementation path documented.
- `CustomerOtpChallenge` Prisma model.
- Salted hashed OTP code storage.
- OTP expiry, consumed timestamp, attempt count, and maximum attempts.
- OTP issue, verify, consume, failed-attempt, and expiry repository helpers.
- Development OTP delivery logging seam.
- `/account/login` phone entry page.
- OTP verification step.
- OTP request and verification server actions.
- Customer profile/account linking after successful verification.
- Customer session creation and HTTP-only customer session cookie set after verification.
- Safe relative return redirects after login.
- `/account` links unauthenticated customers to the real login page.
- OTP resend cooldown checks before issuing new challenges.
- Rolling OTP request-window limit per destination and purpose.
- Structured cooldown and rate-limit request-block reasons.
- Login page copy explaining resend cooldown and request limits.

Deferred follow-up track:

- Production message delivery provider integration.
- IP-level and broader request throttling.
- Customer profile/contact editing.
- Privacy/security review docs for authenticated account and order access.
- Field-level login and checkout validation polish.
- Full Persian storefront localization.

## Phase 10 — Production sign-in delivery and account security

Status: complete as a production sign-in and account-security foundation.

See `docs/PHASE_10_CLOSEOUT.md` for the closeout summary, production limitations, manual launch checklist, deferred items, and recommended Phase 11 direction.

Implemented foundation:

- Reusable customer message provider seam.
- Log delivery mode for local/development use.
- Disabled mode for deployments that need sign-in disabled until provider configuration is ready.
- Webhook-style delivery mode.
- Optional bearer token support for the webhook adapter.
- OTP issuance now uses the message provider seam.
- OTP challenge creation is blocked when delivery fails.
- Delivery provider/reference metadata is stored with OTP challenges.
- Account surface inventory.
- Current protections checklist.
- Account takeover risk review.
- Account-page data exposure review.
- Session cookie handling review.
- Delivery provider secret-handling review.
- Production launch checklist.
- Signed-in customer profile edit page.
- Display name, email, and locale update action.
- Verified phone-change deferral note.
- Account overview edit-profile link.
- Account, profile, and checkout revalidation after profile changes.

Deferred follow-up track:

- Concrete SMS provider adapter and production delivery runbook.
- IP-level and broader abuse throttling.
- Automated Playwright or equivalent smoke coverage.
- Verified phone-change flow.
- Field-level login and checkout validation polish.
- Full Persian storefront localization.
- Lighthouse CI.

## Phase 11 — Localization and Persian storefront readiness

Status: planned.

Recommended direction:

- Move from partial Persian labels to broader customer-facing Persian copy.
- Keep English fallback behavior intact.
- Prioritize public customer surfaces before admin surfaces.
- Add RTL manual QA notes for customer-facing pages.
- Avoid a full i18n framework rewrite unless the copy surface demands it.

Suggested bundles:

- Phase 11.1-11.3 — Localization copy registry.
- Phase 11.4-11.6 — Account/login Persian copy pass.
- Phase 11.7-11.9 — Cart/checkout Persian copy pass.
- Phase 11.10-11.12 — Public storefront Persian copy pass.
