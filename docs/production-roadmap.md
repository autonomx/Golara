# Golara Production Readiness Roadmap

Last updated: 2026-05-31
Current main baseline: Phase 26 merged
Current production path: inquiry-first launch. Payment-provider implementation remains deferred until explicitly approved.

## Current readiness state

Golara is past baseline deploy readiness and is in admin/inquiry operations hardening.

Completed foundations:

- Production deploy guard and Vercel build wrapper are in place.
- Runtime, file-line, Prisma generation, typecheck, unit test, build, and route-smoke CI gates are active on each PR.
- Media storage readiness supports local and Cloudinary modes.
- Admin authentication has role and identity groundwork.
- Staff/owner role-boundary tests are in place.
- Inquiry-first checkout/payment decision is documented as the active production path.
- Inquiry workflow helpers, reports, CSV exports, printable reports, follow-up context, and staff recommended actions are in place.
- Inquiry assignment metadata, queue helpers, board filters, export/print filters, filter counts, return-state preservation, assignment-aware empty states, and assignment actions are in place.

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

## Remaining production readiness phases

### Phase 27 — staff account management readiness

Status: current implementation phase.

Goal: move from account/model groundwork to production-operable staff access.

Scope:

- Add owner-facing staff account list/readiness view.
- Add documented path for creating or rotating staff access.
- Add disable/deactivate semantics if supported by current auth model.
- Confirm staff/owner labels and emails are consistently normalized for assignment matching.
- Add tests for account normalization and role boundaries.

Acceptance criteria:

- Owner can understand who has admin access.
- Staff identities used by inquiry assignment are stable and visible.
- Disabling or rotating access has a clear runbook or UI path.

### Phase 28 — inquiry notification reliability

Status: planned.

Goal: make production inquiry notifications observable and recoverable.

Scope:

- Finalize production notification mode and provider configuration.
- Add notification delivery audit records or structured logs.
- Add failure visibility in admin/readiness output.
- Add resend or retry runbook for failed inquiry notifications.
- Add tests for notification-mode readiness and failure-safe behavior.

Acceptance criteria:

- New inquiries have a reliable notification path.
- Failed notifications are visible to staff or operators.
- Production readiness clearly reports whether inquiry notification config is launch-ready.

### Phase 29 — production data safety and migration runbook

Status: planned.

Goal: make production database changes and recovery operationally safe.

Scope:

- Document production migration procedure.
- Document backup/restore expectations.
- Add launch checklist items for database URL, Prisma generation, migration application, and rollback.
- Verify deploy-readiness guard covers the required production env vars.
- Add tests where practical for readiness reporting.

Acceptance criteria:

- There is a clear migration/deploy runbook.
- There is a clear backup/restore expectation before launch.
- Required production env vars are documented and checked.

### Phase 30 — final launch audit

Status: planned.

Goal: perform a final inquiry-first launch readiness pass.

Scope:

- Run deploy-readiness check.
- Run Vercel build wrapper locally or in CI where applicable.
- Verify admin login and role boundaries.
- Verify media provider readiness.
- Verify inquiry creation, follow-up, assignment, export, print, and notification path.
- Verify public routes and key admin routes via smoke coverage.
- Update launch notes with known deferred items.

Acceptance criteria:

- All required CI gates pass.
- Launch checklist is complete.
- Deferred work is explicitly listed and does not block inquiry-first launch.

## Deferred post-launch phases

### Payment provider implementation

Status: deferred pending explicit approval.

Notes:

- Inquiry-first remains the production path.
- Payment provider selection, checkout payment capture, refunds, reconciliation, webhook handling, and payment security review should be planned as a separate phase only after approval.

### Full commerce order automation

Status: deferred.

Notes:

- Admin order readiness exists separately from inquiry-first operations.
- Full order lifecycle automation should follow payment-provider approval and production inquiry validation.

## Current launch blocker summary

Blocking before inquiry-first production launch:

1. Staff account management/readiness path.
2. Inquiry notification reliability and failure visibility.
3. Production data safety and migration/rollback runbook.
4. Final launch audit.

Not blocking inquiry-first launch:

- Payment provider implementation, as long as the site remains inquiry-first.
- Full automated checkout/order-payment lifecycle.
