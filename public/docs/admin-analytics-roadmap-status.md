# Admin analytics roadmap status

This document summarizes the `/admin/analytics` workspace status.

## Live now

- Dedicated Analytics admin page.
- 7, 30, 90, and 365 day range presets.
- Custom start/end date ranges with shared dashboard, comparison, section-link, and CSV export resolution.
- Business KPI cards and previous-range deltas.
- Order, revenue, and average order value trend charts.
- Orders by status and revenue by currency.
- Fulfillment status, payment mix, and discount usage impact.
- Product view-to-cart conversion from first-party storefront events.
- Product sales and category sales from eligible checkout order lines.
- Aggregate customer cohort metrics for guest, known, first-time, and returning-customer order buckets.
- Advanced aggregate customer cohort reporting for AOV/share buckets, known-customer order-count bands, and recency bands.
- Site analytics event foundation with privacy-safe first-party events.
- Traffic attribution using capped UTM fields and external referrer domains.
- Owner-only aggregate Business CSV and Site CSV exports.
- Scheduled report owner management surface, owner-only read endpoint, locked recording controls, gated recording endpoints, dry-run preview, payload preview, activation-readiness evaluation, deterministic schedule planning, disabled worker shell, disabled transport contract, gated delivery executor contract, and capped retry planning.
- Saved dashboard view preset preview, persistence-plan foundation, inactive table, and metadata read model for future saves.
- Dashboard group header UI using the selected range and existing section anchors.
- Privacy and retention policy visibility.
- Read-only raw site-event retention status, cleanup preview, and cleanup readiness guidance.
- Role-aware visibility for owner-only exports and retention diagnostics.
- Operator checklist for reviewing analytics and interpreting exports.

## Planned next

- Automated raw site-event deletion after production migration evidence and cleanup preview evidence are verified.
- Future customer segmentation beyond aggregate order-count and recency bands, only after a separate privacy review.
- Scheduled report schedule activation from the owner page, live scheduler/timer/background registration, automatic worker execution, live transport configuration, live email/provider delivery, and automatic retry execution.
- Saved dashboard active save/update/remove/read endpoints, owner approval recording, role-policy enforcement, active repository access, and owner/staff management UI.
- Collapsible dashboard groups or tabbed workspace behavior.

## Customer cohort note

Advanced customer cohort reporting is aggregate-only. It shows AOV/share buckets, known-customer order-count bands, and recency bands without exposing names, emails, phones, addresses, raw customer identifiers, or per-customer rows.

## Scheduled report note

Scheduled reports are partially production-ready for owner-only management, preview, payload materialization, planning, disabled execution contracts, and retry visibility. They are not yet production-ready for automatic scheduling or live delivery.

The available safe surface includes owner-only read/recording endpoints, locked management controls, aggregate-only dry-run preview, aggregate-only payload preview, activation-readiness evaluation, weekly/monthly schedule planning, a disabled worker shell, a disabled default transport adapter, a gated delivery executor contract, and retry planning for failed delivery records only.

The disabled boundary remains important:

- no live scheduler, timer, cron, or background registration
- no automatic worker execution
- no live email/provider/transport configuration
- no payload leaving the system by default
- no unbounded retry loop
- no public or staff scheduled-report access
- no arbitrary repository write path
- no per-customer rows, raw event rows, visitor/session identifiers, delivery recipient lists, or export contents in scheduled-report metadata

## Saved dashboard view storage note

The saved dashboard view foundation includes a persistence-plan contract, inactive `AdminAnalyticsSavedView` storage table, and metadata-only read-model foundation. It defines named dashboard view presets, selected-range metadata, role-aware audience labels, allowed scopes, owner-managed fields, metadata-only storage, and safe DTO normalization while keeping save/update/remove/read endpoints, active repository access, and management UI disabled.

## Dashboard group header note

The dashboard layout contract now renders static group headers for Overview, Business, Site, Products and categories, Operations, and Privacy/docs. These headers reuse the selected range and existing section anchors without enabling collapsible groups or tabs.

## Production validation checklist

Before treating site analytics as complete in production, verify:

1. The site analytics event migration has been applied to the production database.
2. `NEXT_PUBLIC_SITE_ANALYTICS_ENABLED` is not set to `false` for storefront traffic that should be counted.
3. Admin, API, and framework routes are excluded from tracking.
4. Do Not Track is honored in the browser reporter.
5. CSV exports remain aggregate-only.
6. Raw event retention status is visible to owner sessions.
7. Cleanup preview reports eligible stale-event counts without deleting data.
8. Custom preset and start/end ranges produce matching dashboard, section-link, and export windows.
9. Customer cohort panels and CSV rows remain aggregate-only.
10. Advanced cohort panels and CSV rows show only aggregate AOV/share/order-count/recency bands.
11. Scheduled report owner-only management, read, recording, dry-run preview, payload preview, activation-readiness, schedule planning, disabled worker shell, disabled transport contract, gated delivery executor, and retry planning preserve aggregate-only data and stay behind their explicit gates.
12. Scheduled reports still do not run automatic scheduling, live delivery transport, automatic workers, or unbounded retries.
13. Saved dashboard view presets, persistence plans, storage table, and read model preserve selected range metadata, existing section anchors, allowed scopes, blocked fields, disabled endpoints, inactive activation flags, and metadata-only DTOs.
14. Dashboard group headers preserve selected range links, the section index, existing anchors, and table fallback requirements without enabling collapsible groups or tabs.
