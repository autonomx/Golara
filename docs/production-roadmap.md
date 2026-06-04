# Golara Production Readiness Roadmap

Last updated: 2026-06-04
Current main baseline: Phase 33 refund/void and payment-operation foundations are in progress after Phase 32 payment webhook and settlement foundations.
Current production path: inquiry-first launch remains available; full commerce rollout is now progressing through the deferred production feature roadmap.

## Current readiness state

Golara has completed the inquiry-first production-readiness roadmap through Phase 30. The codebase is ready for an operator-led production sign-off using `docs/LAUNCH_AUDIT.md` if the site remains inquiry-first.

Important distinction:

- Production-readiness work is complete for the inquiry-first launch path.
- Recent admin/storefront work has expanded the demo-commerce/admin surface: product/category/media management, homepage management, displayed occasion tiles, featured picks, demo orders/inquiries/customers/discounts, settings pages, analytics panels, and hideable storefront header search.
- Actual production launch still requires environment-specific operator sign-off: secrets, database, Cloudinary or another production-safe media store, notification mode, data-safety confirmations, deploy-readiness output, and manual smoke audit.
- Full payment-provider checkout is in progress. Phase 31 added live Stripe/ZarinPal checkout foundations, Phase 32 added webhook, settlement, admin visibility, guard coverage, and smoke-test runbook foundations, and Phase 33 now has read-only refund/void/payment-operation foundations plus strict no-go evidence checklists. Provider-generated staging/production validation, migration verification, live refund/void execution, outbound alert delivery, and full end-to-end commerce QA are still not complete.

Completed foundations:

- Production deploy guard and Vercel build wrapper are in place.
- Runtime, file-line, Prisma generation, typecheck, unit test, build, and route-smoke CI gates are active on each PR.
- Media storage readiness supports local and Cloudinary modes.
- Admin authentication has role and identity groundwork.
- Staff/owner role-boundary tests are in place.
- Inquiry-first checkout/payment decision is documented as the active production path.
- Inquiry workflow helpers, reports, CSV exports, printable reports, follow-up context, and staff recommended actions are in place.
- Inquiry assignment metadata, queue helpers, board filters, export/print filters, filter counts, return-state preservation, assignment-aware empty states, and assignment actions are in place.
- Owner-facing staff account readiness, assignment identity visibility, and staff access rotation/deactivation guidance are in place.
- Inquiry notification delivery now returns structured results, exposes readiness blockers/warnings, and includes retry runbook guidance.
- Production data-safety deploy guard blockers, migration runbook, backup/restore expectations, and rollback plan are in place.
- Final launch audit sign-off artifact is in place at `docs/LAUNCH_AUDIT.md`.
- Admin Saleor-parity foundations now cover catalog, PIM, inventory, fulfillment, customers, orders, discounts, settings, integrations, and analytics.
- Homepage admin now supports editing hero content/media, CTAs, trust chips, section copy, footer copy, displayed occasion tiles, and featured picks.
- Payment gateway adapter foundations include manual/inquiry fallback adapters, Stripe/Iranian mock adapters, live Stripe Checkout Session foundations, ZarinPal adapter foundations, and idempotency-key support.
- Payment webhook and settlement foundations include provider-neutral normalization, signed route helpers, idempotent event persistence, trusted matched state transitions, durable settlement reconciliation storage, admin settlement/alert visibility, source-labeled settlement summaries, unit-runner guards, and a provider smoke-test runbook.
- Payment operation foundations include provider-neutral refund/void planning, no-mutation previews, migration-gated operation-record repository/service foundations, injected provider adapter contracts, read-only admin operation diagnostics, provider readiness diagnostics, operator runbooks, go/no-go criteria, provider evidence examples, and a target-environment smoke-test checklist. The current refund/void execution decision remains **NO-GO**.

## Completed recent phases

### Phase 20 — deploy/media readiness

- Object storage provider seam.
- Media storage readiness tests.
- Deploy readiness guard.
- Vercel deploy preflight wrapper.

### Phase 24 — admin auth readiness

- Admin identity/provider abstraction.
- Admin account model groundwork.
- Staff/owner role tests.
- Admin auth production checklist updates.

### Phase 25 — inquiry-first operations hardening

- Phase 25.1 — checkout/payment decision record.
- Phase 25.2 — inquiry workflow hardening.
- Phase 25.3 — inquiry reporting export follow-ups.
- Phase 25.4 — inquiry staff ownership groundwork.
- Phase 25.5 — inquiry assignment queue groundwork.
- Phase 25.6 — inquiry assignment reporting.
- Phase 25.7 — inquiry assignment filtering.
- Phase 25.8 — inquiry assignment filter shortcuts.
- Phase 25.9 — inquiry assignment return state.
- Phase 25.10 — inquiry board filter.
- Phase 25.11 — inquiry assignment filter links.
- Phase 25.12 — inquiry assignment counts.
- Phase 25.13 — inquiry assignment empty state.

### Phase 26 — inquiry assignment actions

- Staff can assign inquiries to themselves.
- Staff can assign inquiries to owner/staff role queues.
- Staff can unassign inquiries.
- Assignment changes create system follow-up timeline entries and audit metadata.
- Assignment controls preserve current admin board filters, search, and page state.

### Phase 27 — staff account management readiness

- Owner-only staff readiness panel is visible in `/admin`.
- Active/inactive admin accounts, role counts, missing emails, assignment keys, source, and last-login metadata are visible.
- Account readiness helpers normalize staff/owner identity and assignment keys.
- Staff access rotation/deactivation runbook is documented in the checklist and admin panel.

### Phase 28 — inquiry notification reliability

- Notification delivery returns structured status, mode, channel, fallback, webhook status, error code, and detail.
- Admin readiness shows notification blockers/warnings from the real notification readiness object.
- Admin readiness includes inquiry notification retry runbook guidance.
- Notification tests cover log mode, webhook success, missing URL, non-2xx, network error, unsupported mode, and runbooks.

### Phase 29 — production data safety and migration runbook

- Production deploy-readiness guard blocks until migration, backup/restore, and rollback confirmations are set.
- `.env.example` documents the production data-safety confirmation flags.
- Production checklist documents migration, backup/restore, and rollback procedures.
- Data-safety and deploy-readiness tests cover the new blockers.

### Phase 30 — final launch audit

- `docs/LAUNCH_AUDIT.md` provides the final inquiry-first launch sign-off artifact.
- Production checklist links to the final launch audit.
- Final go/no-go requirements are documented.
- Deferred items are explicitly listed as non-blocking for inquiry-first launch.

## Remaining before real production launch

These are environment/operator tasks, not repository blockers for the inquiry-first launch path:

1. Configure production secrets and environment variables.
2. Configure production PostgreSQL and verify backup/restore.
3. Configure production-safe media storage.
4. Choose and verify inquiry notification mode.
5. Run `APP_MODE="production" npm run check:deploy-readiness` with production-like environment variables.
6. Complete the manual smoke audit in `docs/LAUNCH_AUDIT.md`.
7. Record the go/no-go decision in the launch sign-off template.

## Deferred production feature roadmap

The following phases are the next roadmap for moving from inquiry-first/demo-commerce readiness to a full production commerce system. These are not blockers if Golara launches as inquiry-first, but they are blockers for a real card/gateway checkout launch.

### Phase 31 — live payment gateway implementation

Status: in progress; live Stripe/ZarinPal checkout foundations exist, but full live provider validation remains tied to the Phase 32 webhook/smoke-test work and later end-to-end QA.

Goal: replace manual/inquiry-only payment behavior with real provider-backed checkout while keeping the existing payment settings/readiness admin controls.

Checklist:

- [x] Choose first live provider path: Stripe for overseas/card checkout first; Iranian/local gateway remains a later provider path behind the existing config.
- [x] Add provider adapter interface for creating checkout sessions/payment intents.
- [x] Add provider-specific implementation foundation for the selected first gateway: Stripe Checkout Sessions.
- [x] Store provider session/payment intent IDs on checkout payment attempts.
- [x] Redirect customers to provider-hosted checkout or render the provider-approved payment UI from the live checkout flow.
- [x] Add checkout return/success/cancel pages.
- [x] Convert provider success/failure into order payment state transitions.
- [x] Add idempotency-key support so repeated checkout submissions can avoid duplicate provider sessions/charges once wired into checkout submission.
- [~] Add unit and route tests for success, failure, cancel, duplicate, and provider-error paths. Unit coverage exists for adapter/session creation, return route parsing, and order confirmation copy; live provider browser validation remains pending.
- [x] Update `.env.example`, production checklist, and admin readiness blockers for the selected provider. `.env.example` and existing readiness blockers cover Stripe secret requirements; Phase 32 smoke-test runbook now covers webhook/callback validation details.

Progress notes:

- Added `createStripeCheckoutSessionAdapter` for Stripe Checkout Session creation using `STRIPE_SECRET_KEY`.
- Added `createLivePaymentGatewayAdapters` so live Stripe can be selected without removing manual/inquiry fallback adapters.
- Added Stripe request shaping for amount, currency, customer email, success/cancel URLs, client reference, metadata, and idempotency key.
- Added ZarinPal adapter foundations and return parsing for status/authority callback parameters.
- Added unit coverage with injected provider clients; no live provider network calls run in tests.

Success criteria:

- A customer can place an order and complete payment through a real configured provider.
- Admin can see provider reference IDs, payment state, and payment attempt history.
- Failed or cancelled payment attempts do not mark orders as paid.
- Inquiry-first/manual mode remains available as a fallback mode.

### Phase 32 — payment webhooks and settlement reconciliation

Status: in progress; foundation implemented, wired into the unit runner, and documented, but live/staging provider validation and target-environment migration verification remain pending.

Goal: make payment state authoritative from provider webhooks, not only browser returns.

Checklist:

- [x] Add signed webhook endpoint for the selected provider.
- [x] Verify webhook signatures/secrets before processing events.
- [x] Add idempotent webhook event storage and replay protection.
- [x] Map provider events to internal payment attempt and order states.
- [~] Add settlement/captured/failed/refunded/chargeback-style state support where provider supports it. Paid/failed/cancelled/pending settlement reconciliation is implemented; refunds, chargebacks, provider dashboard imports, and provider-backed payment operations remain later work.
- [x] Add admin visibility for webhook events and reconciliation mismatches.
- [x] Add tests for duplicate webhooks, invalid signatures, unknown payment IDs, and out-of-order events. Source/unit guards are wired into `tests/unit/run-tests.ts`; live provider replay/order validation remains pending.
- [x] Add provider smoke-test runbook for staging/production validation.

Progress notes:

- Added provider-neutral webhook normalization for Stripe Checkout Session and ZarinPal-style payment events.
- Added Stripe and ZarinPal webhook routes under `app/api/webhooks/payments/*` with raw-body signature verification when secrets are configured.
- Added idempotent `CheckoutPaymentEvent` persistence, stable payload digests, replay protection, and trusted matched checkout state transitions.
- Added durable `PaymentSettlementReconciliation` migration and raw-SQL repository integration from webhook service creation and duplicate refresh paths.
- Added read-only admin settlement and payment alert pages, sidebar navigation, durable-first settlement summaries, and explicit durable/fallback source labeling.
- Wired all Phase 32 supplemental guards into `tests/unit/run-tests.ts`, raising the runner count to 113 files.
- Added `docs/production-roadmap-phase32-payment-webhooks.md` and `docs/production-roadmap-phase32-payment-webhook-smoke-tests.md` for progress tracking and operator validation.

Still pending before Phase 32 is complete:

- Execute the smoke-test runbook against live/staging Stripe and ZarinPal provider dashboards.
- Validate Stripe and ZarinPal webhook signature behavior against provider-generated requests.
- Apply and verify the settlement reconciliation migration in the target environment.

Success criteria:

- Provider webhook state can safely update orders after the customer leaves checkout.
- Duplicate or forged webhooks do not corrupt order/payment state.
- Admin can diagnose payment provider events without checking external dashboards first.

### Phase 33 — refunds, voids, and payment operations

Status: repo-side foundation in progress; current decision is **NO-GO for live refund/void execution**. Read-only planning, persistence contracts, migration-gated repository/service foundations, provider adapter contracts, admin diagnostic surfaces, operator runbooks, go/no-go criteria, provider evidence examples, and smoke-test checklist documentation exist. Live provider execution, admin execution controls, order/payment mutation, inventory/capacity release, concrete provider endpoint URLs, default fetch behavior, provider credentials, production-ready claims, and Prisma model/client access for `PaymentOperationRecord` remain out of scope.

Goal: create a safe, idempotent, auditable foundation for future provider-backed refunds and voids while preserving read-only admin diagnostics and strict target-environment evidence gates before any destructive financial action is enabled.

Checklist:

- [x] Add provider-neutral refund/void operation planning and no-mutation preview helpers.
- [x] Add raw-SQL `PaymentOperationRecord` migration contract and target-environment migration evidence template.
- [x] Add migration-gated operation-record repository/service foundations with idempotency-key duplicate reuse and conflict blocking.
- [x] Add append-only admin audit-log wiring for operation-record lifecycle transitions behind migration confirmation.
- [x] Add provider operation adapter contracts, inert manual/mock/unavailable behavior, symbolic Stripe/ZarinPal request/response mappers, and caller-injected HTTP adapter factories.
- [x] Add read-only admin diagnostics for preview, operation history, provider readiness, and payment-operation navigation.
- [x] Add documentation-only provider endpoint mapping worksheet, operator runbook, admin navigation map, provider readiness evidence example, refund/void smoke-test checklist, and refund/void go/no-go checklist.
- [~] Add tests/source guards for full refund, partial refund, void before capture, provider failure, and duplicate refund protection. Current source/unit guards cover planning, transition planning, migration contract, provider readiness, adapter boundaries, no-execution admin surfaces, documentation safety language, and idempotency/repository semantics; live provider behavior remains pending.
- [ ] Add provider-backed refund and void actions where supported after target-environment evidence and guarded execution criteria are approved.
- [ ] Support partial refunds in live provider execution after provider endpoint mapping and response normalization are validated.
- [ ] Mutate order/payment state only after provider success behavior is explicitly guarded and reviewed.
- [ ] Release inventory/capacity only after policy and post-success transition criteria are explicitly guarded and reviewed.

Progress notes:

- Added `docs/production-roadmap-phase33-payment-operations.md` as the authoritative Phase 33 progress tracker.
- Added read-only admin pages under `/admin/payments/operations`, `/admin/payments/operations/preview`, `/admin/payments/operations/history`, and `/admin/payments/operations/providers`.
- Added migration-gated history route-core helpers and read-only history panel behavior; repository/service reads and writes require `PAYMENT_OPERATION_RECORDS_MIGRATION_CONFIRMED=true` in the target environment.
- Added provider readiness diagnostics that always return `executionEnabled: false` and expose credential environment variable names without secret values.
- Added `docs/production-roadmap-phase33-provider-endpoint-mapping-readiness.md`, `docs/production-roadmap-phase33-provider-readiness-evidence-example.md`, `docs/production-roadmap-phase33-refund-void-smoke-test-checklist.md`, and `docs/production-roadmap-phase33-refund-void-go-no-go-checklist.md` to keep future provider validation evidence explicit before execution work proceeds.
- Added source guards in `tests/unit/payment-operation-provider-readiness.test.ts` to block provider calls, adapter execution wiring, default fetch, direct Prisma access, concrete provider endpoint URLs, admin buttons/click handlers, order/payment mutation SQL, and weakened no-go/evidence language in guarded Phase 33 surfaces.

Still pending before Phase 33 live execution:

- Apply and verify the `PaymentOperationRecord` migration in the target environment.
- Complete provider endpoint mapping evidence for Stripe/ZarinPal without publishing concrete live endpoint URLs in docs/source.
- Complete provider readiness evidence packets and smoke-test checklist review in the target environment.
- Implement guarded admin execution controls only after provider execution, provider error normalization, migration validation, authorization/confirmation UX, and post-success order/payment transition behavior are explicitly guarded.
- Validate live/staging provider refund/void behavior against provider-generated responses.

Success criteria:

- Staff can eventually refund/void from admin without manually editing payment state, but only after target-environment evidence gates and guarded execution controls are satisfied.
- Payment operations remain idempotent, auditable, and reconcilable with the provider.
- Inventory and order state remain consistent after payment reversals through explicitly guarded post-provider-success transitions.

### Phase 34 — real email/SMS/WhatsApp notification providers

Status: settings/readiness foundations exist; real provider delivery should still be verified/implemented.

Checklist:

- [ ] Choose first email provider, such as SMTP, Resend, or SendGrid.
- [ ] Choose SMS/WhatsApp operating model if needed.
- [ ] Add provider adapter for order and inquiry notifications.
- [ ] Add templated messages for order confirmation, staff notification, inquiry acknowledgement, and fulfillment updates.
- [ ] Store delivery attempts with provider references and error details.
- [ ] Add retry controls and admin visibility for failed notification delivery.
- [ ] Add tests for provider success, provider failure, missing credentials, retries, and disabled channels.

Success criteria:

- Customers and staff receive operational notifications through real providers.
- Failed notifications are visible and retryable.
- Log/webhook mode remains available for development and fallback operations.

### Phase 35 — durable outbound webhook worker

Status: configuration/event-log foundations exist; durable delivery worker is still needed.

Checklist:

- [ ] Add outbound webhook dispatcher for configured integrations.
- [ ] Add retry/backoff schedule and terminal failure state.
- [ ] Sign outbound webhook payloads.
- [ ] Add admin retry/cancel controls.
- [ ] Add dead-letter visibility for repeatedly failed deliveries.
- [ ] Add tests for successful delivery, non-2xx response, timeout, retry, and signing.

Success criteria:

- Configured integrations receive durable event delivery.
- Failed deliveries are observable and recoverable.
- Webhook configuration is not just stored; it is operational.

### Phase 36 — provider-backed per-user admin authentication

Status: password-gated admin and role foundations exist; provider-backed per-user auth is deferred.

Checklist:

- [ ] Add provider-backed per-user login for admins/staff.
- [ ] Enforce owner/staff role boundaries on every admin write action.
- [ ] Add session rotation/expiry policies.
- [ ] Add account deactivation enforcement.
- [ ] Add audit visibility for login/logout/admin write events.
- [ ] Add tests for unauthorized, staff, owner, inactive, and missing-identity cases.

Success criteria:

- Each admin user has a distinct identity.
- Owner-only actions cannot be performed by staff users.
- Disabled staff accounts lose access immediately.

### Phase 37 — checkout, order, and fulfillment end-to-end QA

Status: admin foundations exist; full live commerce workflow requires end-to-end validation.

Checklist:

- [ ] Add end-to-end tests for cart → checkout → payment → order → notification → fulfillment.
- [ ] Add inventory reservation/release tests around paid, cancelled, refunded, and failed-payment orders.
- [ ] Add discount interaction tests with real checkout totals.
- [ ] Add tax/shipping calculation tests for supported markets.
- [ ] Add printable/CSV/packing-slip validation for live paid orders.
- [ ] Add manual QA runbook for the complete production order lifecycle.

Success criteria:

- The full customer and staff workflow is tested as one system.
- Payment, inventory, discounts, tax, shipping, notifications, and fulfillment agree on order truth.
- A production operator can follow a documented runbook for launch validation.

### Phase 38 — production operations and monitoring

Status: partial readiness checks exist; full production observability remains needed.

Checklist:

- [ ] Add structured logging for checkout, payments, webhooks, notifications, and admin writes.
- [ ] Add error monitoring integration.
- [ ] Add uptime/health checks for storefront, admin, database, media storage, and provider dependencies.
- [ ] Add backup/restore drill evidence for the target production database.
- [ ] Add incident runbooks for payment failure, provider outage, webhook backlog, notification outage, and migration rollback.
- [ ] Add performance pass for homepage, product listing, admin media, and checkout.

Success criteria:

- Operators can detect and respond to production incidents.
- Payment/provider issues are observable before customers report them.
- Restore and rollback procedures have been tested against the actual production stack.

## Current launch blocker summary

Repository blockers before inquiry-first production launch:

- None known after Phase 30 closeout.

Environment/operator blockers before inquiry-first production launch:

- Complete `docs/LAUNCH_AUDIT.md` for the target production deployment.
- Pass production deploy-readiness with production-like environment variables.
- Complete manual smoke audit and go/no-go sign-off.

Repository blockers before full automated commerce launch:

- Live payment gateway staging/production validation and checkout/order/fulfillment end-to-end QA.
- Payment webhook provider smoke validation and settlement migration verification.
- Provider-backed refunds/voids after Phase 33 no-go criteria, migration evidence, provider endpoint mapping evidence, provider readiness evidence, guarded execution controls, and post-success state transition criteria are satisfied.
- Real notification provider delivery.
- Durable outbound webhook worker.
- Provider-backed per-user admin authentication.
- End-to-end checkout/order/fulfillment QA.
- Production monitoring and incident runbooks.

Not blocking inquiry-first launch:

- Payment provider implementation, as long as the site remains inquiry-first.
- Full automated checkout/order-payment lifecycle.
- Provider-backed per-user admin auth, as long as password-gated admin access and staff procedures are controlled for the inquiry-first launch.
- Email, SMS, and WhatsApp notification providers, as long as log or webhook notification mode is operationally accepted.
