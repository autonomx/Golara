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
- Scheduled report transport adapter contract with a disabled default adapter and no live provider/network wiring.
- Scheduled report gated delivery executor contract with audit/failure result shapes, rollback documentation, and default blocked state unless every gate and an injected adapter are provided.
- Scheduled report retry planning for failed delivery results only, capped attempts, owner-visible retry status, and no automatic retry loop.
- Saved dashboard view preset preview, persistence-plan foundation, inactive storage schema, and metadata-only read-model foundation for future saves.
- Dashboard group header UI that uses the layout grouping contract while preserving the selected range, section index, anchors, and table fallback requirements.
- Privacy and retention policy visibility.
- Read-only raw site-event retention status, cleanup preview, and cleanup readiness guidance.
- Role-aware visibility for owner-only exports and retention diagnostics.
- Operator checklist for reviewing analytics and interpreting exports.

## Intentionally pending

- Automated raw site-event deletion after production migration evidence and cleanup preview evidence are verified.
- Future customer segmentation beyond aggregate order-count and recency bands, only after a separate privacy review.
- Scheduled report schedule activation from the owner page, live scheduler/timer/background registration, automatic worker execution, real delivery transport configuration, live email/provider delivery, and automatic retry execution.
- Scheduled report repository writes remain gated and owner-only; the current surface records only through explicitly gated endpoints and helpers, not arbitrary write paths.
- Saved dashboard active save/update/remove/read endpoints, owner approval recording, role-policy enforcement, active repository access, and owner/staff management UI.
- Collapsible dashboard groups or tabbed workspace behavior.

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

Scheduled reports are now partially production-ready for owner-only management, preview, payload materialization, planning, disabled execution contracts, and retry visibility. They are not yet production-ready for automatic scheduling or live delivery.

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
- disabled default transport adapter contract
- gated delivery executor contract with audit/failure result shapes
- retry planning for failed delivery records only, with capped attempts and no automatic loop

The safety boundary remains:

- no live scheduler/timer/cron/background registration
- no automatic worker execution
- no live email/provider/transport configuration
- no payload leaving the system by default
- no unbounded retry loop
- no public or staff scheduled-report access
- no arbitrary repository write path
- no per-customer rows, raw event rows, visitor/session identifiers, delivery recipient lists, or export contents stored in scheduled-report metadata

A future delivery-enablement slice must configure a real transport adapter, enable all owner/approval/dry-run/kill-switch/activation gates, and add deployment rollback evidence before scheduled reports can be considered fully production-ready for live delivery.

## Saved dashboard view storage note

The saved dashboard view foundation now includes a persistence-plan contract, an inactive storage schema, and a metadata-only read-model foundation. It defines named dashboard view presets, selected-range metadata, role-aware audience labels, allowed scopes, owner-managed fields, metadata-only persisted columns, blocked report/customer/event-row fields, and safe DTO normalization for future table rows.

The `AdminAnalyticsSavedView` table is for future metadata only. Activation defaults remain disabled: `ownerApproved=false` and `isActive=false`. The read model keeps `activeForOperators=false` and is not called by a page, route, active repository, or management UI yet.

## Dashboard group header note

The dashboard layout grouping contract now powers a static group-header UI on `/admin/analytics`. It renders Overview, Business, Site, Products and categories, Operations, and Privacy/docs groups with selected-range links to the existing dashboard anchors.

The UI keeps the section index, range links, existing anchors, CSV exports, server rendering, and accessible chart table fallbacks intact. Collapsible groups or tabs remain pending until separate mobile layout and accessibility evidence is recorded.

## Retention cleanup preview note

The retention status panel now includes a read-only cleanup preview. It reports the stale raw-event count eligible under the 180-day retention target, whether production migration evidence has been confirmed, whether deletion remains disabled, and the reason future cleanup is still blocked or ready for a guarded job.
