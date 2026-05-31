# Golara Production Readiness Roadmap

Last updated: 2026-05-31
Current main baseline: Phase 29 merged
Current production path: inquiry-first launch. Payment-provider implementation remains deferred until explicitly approved.

## Current readiness state

Golara is at final inquiry-first launch audit.

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

## Remaining production readiness phases

### Phase 30 — final launch audit

Status: current implementation phase.

Goal: perform a final inquiry-first launch readiness pass.

Scope:

- Run deploy-readiness check.
- Run Vercel build wrapper locally or in CI where applicable.
- Verify admin login and role boundaries.
- Verify media provider readiness.
- Verify inquiry creation, follow-up, assignment, export, print, and notification path.
- Verify public routes and key admin routes via smoke coverage.
- Update launch notes with known deferred items.
- Maintain final sign-off artifact in `docs/LAUNCH_AUDIT.md`.

Acceptance criteria:

- All required CI gates pass.
- Launch checklist is complete.
- Deferred work is explicitly listed and does not block inquiry-first launch.
- Release operator has a concrete go/no-go sign-off template.

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

1. Final launch audit.

Not blocking inquiry-first launch:

- Payment provider implementation, as long as the site remains inquiry-first.
- Full automated checkout/order-payment lifecycle.
- Provider-backed per-user admin auth, as long as password-gated admin access and staff procedures are controlled for the inquiry-first launch.
- Email and WhatsApp notification providers, as long as log or webhook notification mode is operationally accepted.
