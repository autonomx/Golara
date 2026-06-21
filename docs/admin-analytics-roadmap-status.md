# Admin analytics roadmap status

This document tracks the current state of the `/admin/analytics` workspace and the next safe implementation phases.

## Live now

- Dedicated `/admin/analytics` page in the shared admin shell.
- 7, 30, 90, and 365 day range presets.
- Custom start/end date ranges with shared dashboard, comparison, section-link, and CSV export resolution.
- Business KPI cards and previous-range deltas.
- Order, revenue, and average order value trend charts.
- Orders by status and revenue by currency.
- Fulfillment status, payment method mix, and discount usage impact.
- Product view-to-cart conversion from first-party storefront events.
- Product sales and category sales from eligible checkout order lines.
- Aggregate customer cohort metrics for guest, known, first-time, and returning-customer order buckets.
- Advanced aggregate customer cohort reporting for AOV/share buckets, known-customer order-count bands, and recency bands.
- Site analytics event foundation with privacy-safe first-party events.
- Traffic attribution using capped UTM fields and external referrer domains.
- Owner-only aggregate Business CSV and Site CSV exports.
- Scheduled report owner management surface with locked controls for recording dry-run evidence, owner approval, and disable state.
- Scheduled report owner-only read and recording endpoints guarded by runtime flags and owner checks.
- Scheduled report dry-run preview endpoint and aggregate-only dry-run evidence builder, gated by `ADMIN_ANALYTICS_SCHEDULED_REPORT_DRY_RUN_PREVIEW_ENABLED`.
- Scheduled report delivery payload preview endpoint and aggregate-only payload materialization helper, gated by `ADMIN_ANALYTICS_SCHEDULED_REPORT_DELIVERY_PAYLOAD_PREVIEW_ENABLED`.
- Scheduled report activation-readiness helper that can produce metadata-only activation args only after owner approval, dry-run evidence, kill-switch, disable-state, and delivery-disabled gates pass.
- Scheduled report deterministic schedule planning for weekly/monthly reports, owner-page plan visibility, and disabled-by-default scheduler state.
- Scheduled report disabled worker shell that returns locked/skipped status by default and has no automatic timer, cron, or background registration.
- Scheduled report disabled/default transport contract, secret-backed outbox/channel validation, manual owner-run orchestration, staging smoke validation, owner-visible history, clock-readiness planning, and ops hardening.
- Scheduled report gated delivery executor contract with audit/failure result shapes, rollback documentation, and default blocked state unless every gate and an injected adapter are provided.
- Scheduled report retry planning for failed delivery results only, capped attempts, owner-visible retry status, and no automatic retry loop.
- Saved dashboard view management surface, owner/staff metadata read route, mutation-policy contract, approved POST route plans, injected-delegate storage-apply helper, owner action core, and dedicated `/admin/analytics/saved-views` status page.
- Dashboard grouping contract, server-rendered analytics workspace tabs, and native collapsible dashboard group UI using selected-range links while preserving section anchors, section index, and accessible chart table fallback requirements.
- Privacy and retention policy visibility.
- Raw site-event retention status, cleanup preview, owner-only cleanup plan helper, hard-gated executor, live delegate factory, owner-only cleanup route, and dedicated `/admin/analytics/site-retention` status/control page. The delegate is attached only when `SITE_ANALYTICS_RETENTION_CLEANUP_DELEGATE_ENABLED` is enabled and the database/table are available; deletion still requires the plan flag, execution flag, production evidence, and manual owner confirmation.
- Role-aware visibility for owner-only exports and retention diagnostics.
- Operator checklist for reviewing analytics and interpreting exports.

## Intentionally pending

- Future customer segmentation beyond aggregate order-count and recency bands, only after a separate privacy review.
- Scheduled report live scheduler/timer/background registration, automatic worker execution, real delivery transport provider wiring, live email/provider delivery, and automatic retry execution.
- Scheduled report repository writes remain gated and owner-only; the current surface records only through explicitly gated endpoints and helpers, not arbitrary write paths.
- Saved dashboard views still do not use generated Prisma client writes from the live routes by default. Current routes are owner-only and plan/core-backed; storage application remains injected-delegate tested until the generated schema/client path is safely wired.

## Customer cohort analytics note

Customer cohort analytics are live only as aggregate, privacy-safe reporting. The current implementation avoids exposing customer names, phones, emails, addresses, or raw identifiers in charts or CSV exports.

The live cohort slice includes aggregate counts, revenue, AOV, share, and banded reporting for:

- known-customer orders
- guest orders
- known-customer count
- first-time known-customer orders
- returning-customer orders
- returning-customer revenue and order rate
- average order value by aggregate cohort
- revenue share by aggregate cohort
- known-customer order-count bands
- known-customer recency bands

Any future customer cohort export must remain aggregate-only unless a separate explicit customer-report permission model exists.

## Custom date range note

The range selector now supports both fixed presets and custom start/end dates. Presets and custom ranges resolve through the same contract across business analytics, site analytics, export routes, comparison deltas, section links, and panel labels.

## Scheduled report status note

Scheduled reports are production-hardened for owner-only management, previews, payload materialization, planning, disabled execution contracts, manual owner-run readiness, retry visibility, staging smoke validation, and operator hardening. They are not yet production-ready for automatic scheduling or live provider delivery.

The implemented safe surface includes:

- metadata-only storage and read-model foundations
- owner-only management page
- owner-only read endpoint
- owner-only gated recording endpoints for dry-run evidence, owner approval, and disable state
- locked management forms targeting only the approved recording endpoints
- activation-readiness evaluation without activating schedules
- aggregate-only dry-run preview generation and evidence recording
- aggregate-only delivery payload materialization preview
- deterministic weekly/monthly next-run planning
- disabled-by-default worker-shell evaluation
- disabled default transport adapter and secret-backed outbox/channel validation
- manual owner-run orchestration that still rejects scheduled/queued execution
- staging smoke validation for the gate matrix
- owner-visible history/read-model helpers
- clock-readiness and ops-hardening plans with no live timer or alert loop
- gated delivery executor contract with audit/failure result shapes
- retry planning for failed delivery records only, with capped attempts and no automatic loop

The safety boundary remains:

- no live scheduler/timer/cron/background registration
- no automatic worker execution
- no live email/provider delivery by default
- no payload leaving the system by default
- no unbounded retry loop
- no public or staff scheduled-report access
- no arbitrary repository write path
- no per-customer rows, raw event rows, visitor/session identifiers, delivery recipient lists, or export contents stored in scheduled-report metadata

A future delivery-enablement slice must configure a real provider adapter, enable all owner/approval/dry-run/kill-switch/activation gates, and add deployment rollback evidence before scheduled reports can be considered fully production-ready for live delivery.

## Saved dashboard view storage note

Saved dashboard views now have a visible management and route-planning surface. The implementation includes named presets, allowed scopes, role-aware metadata normalization, blocked report/customer/event-row fields, metadata-only DTOs, owner/staff read gating, approved owner POST targets, an injected-delegate storage-apply helper, and a shared action core.

The live owner routes remain safe by default: they use the action core in plan-only mode unless a storage delegate is explicitly provided. The current generated-client integration is intentionally pending because the main Prisma schema/client path has not been safely wired through the connector; the schema-fragment parity guard remains the source of truth for the intended metadata-only table shape.

## Dashboard workspace note

The dashboard layout grouping contract now powers server-rendered workspace tabs and native collapsible groups on `/admin/analytics`. It renders Overview, Business, Site, Products and categories, Operations, and Privacy/docs tabs as regular range-aware links, then keeps the native `<details>`/`<summary>` groups below.

The UI keeps the section index, range links, existing anchors, CSV exports, server rendering, mobile readability, and accessible chart table fallbacks intact. It does not use client-side tab state, local storage, or rewritten analytics calculations.

## Retention cleanup status note

Retention cleanup now has a gated live delegate track. The implemented surface includes read-only stale-event preview, owner-only cleanup plan helper, hard-gated executor, bounded live delegate factory, owner-only POST route, and a dedicated owner status page with manual confirmation copy.

Deletion is still fail-closed by default. It requires `SITE_ANALYTICS_RETENTION_CLEANUP_PLAN_ENABLED`, `SITE_ANALYTICS_RETENTION_CLEANUP_EXECUTION_ENABLED`, `SITE_ANALYTICS_RETENTION_CLEANUP_DELEGATE_ENABLED`, production retention evidence, database/table availability, an accepted plan with stale events, and the exact manual owner confirmation phrase. The route starts no background jobs and the delegate caps each batch at 1000 rows.
