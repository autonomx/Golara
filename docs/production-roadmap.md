# Golara Production Readiness Roadmap

Last updated: 2026-05-31
Current main baseline: Phase 30 merged
Current production path: inquiry-first launch. Payment-provider implementation remains deferred until explicitly approved.

## Current readiness state

Golara has completed the inquiry-first production-readiness roadmap through Phase 30. The codebase is ready for an operator-led production sign-off using `docs/LAUNCH_AUDIT.md`.

Important distinction:

- Production-readiness work is complete in the repository.
- Actual production launch still requires environment-specific operator sign-off: secrets, database, Cloudinary, notification mode, data-safety confirmations, deploy-readiness output, and manual smoke audit.

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

These are environment/operator tasks, not repository blockers:

1. Configure production secrets and environment variables.
2. Configure production PostgreSQL and verify backup/restore.
3. Configure production-safe media storage.
4. Choose and verify inquiry notification mode.
5. Run `APP_MODE="production" npm run check:deploy-readiness` with production-like environment variables.
6. Complete the manual smoke audit in `docs/LAUNCH_AUDIT.md`.
7. Record the go/no-go decision in the launch sign-off template.

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

### Provider-backed per-user admin auth

Status: deferred.

Notes:

- Current runtime admin auth remains password-gated with environment-backed identity metadata.
- Owner-visible account readiness inventory and staff procedure controls are sufficient for the inquiry-first launch scope only.
- Provider-backed, per-user login should be planned before broader staff scaling.

### Email and WhatsApp notification providers

Status: deferred.

Notes:

- Current supported inquiry notification modes are log and webhook.
- Email and WhatsApp provider delivery should be added behind the notification seam when a provider and operating model are selected.

## Current launch blocker summary

Repository blockers before inquiry-first production launch:

- None known after Phase 30 closeout.

Environment/operator blockers before inquiry-first production launch:

- Complete `docs/LAUNCH_AUDIT.md` for the target production deployment.
- Pass production deploy-readiness with production-like environment variables.
- Complete manual smoke audit and go/no-go sign-off.

Not blocking inquiry-first launch:

- Payment provider implementation, as long as the site remains inquiry-first.
- Full automated checkout/order-payment lifecycle.
- Provider-backed per-user admin auth, as long as password-gated admin access and staff procedures are controlled for the inquiry-first launch.
- Email and WhatsApp notification providers, as long as log or webhook notification mode is operationally accepted.
