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
- Scheduled report preview, owner-approved configuration-plan foundation, inactive storage schema, metadata-only read-model foundation, and repository-read query-plan contract that reuse the selected analytics range and aggregate Business/Site CSV paths.
- Saved dashboard view preset preview, persistence-plan foundation, inactive storage schema, and metadata-only read-model foundation for future saves.
- Dashboard group header UI that uses the layout grouping contract while preserving the selected range, section index, anchors, and table fallback requirements.
- Privacy and retention policy visibility.
- Read-only raw site-event retention status, cleanup preview, and cleanup readiness guidance.
- Role-aware visibility for owner-only exports and retention diagnostics.
- Operator checklist for reviewing analytics and interpreting exports.

## Intentionally pending

- Automated raw site-event deletion after production migration evidence and cleanup preview evidence are verified.
- Future customer segmentation beyond aggregate order-count and recency bands, only after a separate privacy review.
- Scheduled report active repository reads/writes, read endpoints, delivery channel execution, retry visibility, owner approval recording, global disable controls, and owner management UI.
- Saved dashboard active save/update/remove/read endpoints, owner approval recording, role-policy enforcement, active repository access, and owner/staff management UI.
- Collapsible dashboard groups or tabbed workspace behavior.

## Customer cohort analytics note

Customer cohort analytics are live only as aggregate, privacy-safe reporting. The current implementation avoids exposing customer names, phones, emails, addresses, or raw identifiers in charts or CSV exports.

The live cohort slice includes aggregate counts, revenue, AOV, share, and banded reporting for:

- known-customer orders
- guest orders
- known-customer count
- first-time known-customer orders
- returning known-customer orders
- returning known-customer revenue and order rate
- average order value by aggregate cohort
- revenue share by aggregate cohort
- known-customer order-count bands
- known-customer recency bands

Any future customer cohort export must remain aggregate-only unless a separate explicit customer-report permission model exists.

## Custom date range note

The range selector now supports both fixed presets and custom start/end dates. Presets and custom ranges resolve through the same contract across business analytics, site analytics, export routes, comparison deltas, section links, and panel labels.

## Scheduled report configuration note

The scheduled report foundation now includes preview metadata, configuration-plan metadata, an inactive `AdminAnalyticsScheduledReport` storage schema, a metadata-only read-model foundation, and a repository-read query-plan contract. It defines weekly and monthly owner report options, selected-range metadata, aggregate Business/Site CSV paths, owner-approval requirements, metadata-only future schedule fields, safe DTO normalization for future table rows, required future read filters, safe select fields, and activation blockers without saving active schedules, sending reports, creating timers, reading through active repositories, or running background jobs.

The read model keeps `activeForOperators=false` and `deliveryReady=false` even when future approval, active, delivery, and dry-run fields are present. The repository-read contract defines owner-approved, active, delivery-disabled future filters, but active repository access remains disabled. Actual scheduled delivery remains pending until repository access, owner approval recording, dry-run evidence, delivery configuration, retry/failure visibility, disable controls, and management UI are designed and validated.

## Saved dashboard view storage note

The saved dashboard view foundation now includes a persistence-plan contract, an inactive storage schema, and a metadata-only read-model foundation. It defines named dashboard view presets, selected-range metadata, role-aware audience labels, allowed scopes, owner-managed fields, metadata-only persisted columns, blocked report/customer/event-row fields, and safe DTO normalization for future table rows.

The `AdminAnalyticsSavedView` table is for future metadata only. Activation defaults remain disabled: `ownerApproved=false` and `isActive=false`. The read model keeps `activeForOperators=false` and is not called by a page, route, active repository, or management UI yet.

## Dashboard group header note

The dashboard layout grouping contract now powers a static group-header UI on `/admin/analytics`. It renders Overview, Business, Site, Products and categories, Operations, and Privacy/docs groups with selected-range links to the existing dashboard anchors.

The UI keeps the section index, range links, existing anchors, CSV exports, server rendering, and accessible chart table fallbacks intact. Collapsible groups or tabs remain pending until separate mobile layout and accessibility evidence is recorded.

## Retention cleanup preview note

The retention status panel now includes a read-only cleanup preview. It reports the stale raw-event count eligible under the 180-day retention target, whether production migration evidence has been confirmed, whether deletion remains disabled, and the reason future cleanup is still blocked or ready for a guarded job.

The preview must not delete data. Automated deletion remains pending until the preview evidence, production migration evidence, and production analytics volume are verified.

## Production validation checklist

Before treating site analytics as complete in production, verify:

1. The site analytics event migration has been applied to the production database.
2. `NEXT_PUBLIC_SITE_ANALYTICS_ENABLED` is not set to `false` for storefront traffic that should be counted.
3. Admin, API, and framework routes are excluded from tracking.
4. Do Not Track is honored in the browser reporter.
5. CSV exports remain aggregate-only.
6. Raw event retention status is visible to owner sessions.
7. Cleanup preview reports eligible stale-event counts without deleting data.
8. Cleanup remains disabled until production migration evidence is confirmed.
9. Custom preset and start/end ranges produce matching dashboard, section-link, and export windows.
10. Customer cohort panels and CSV rows remain aggregate-only.
11. Advanced aggregate cohort panels and CSV rows show only AOV/share/order-count/recency bands, never per-customer rows.
12. Scheduled report previews, config plans, inactive storage schema, read model, and repository-read contract preserve the selected range and aggregate Business/Site CSV paths without enabling delivery.
13. Saved dashboard view presets, persistence plans, storage schema, and read model preserve selected range metadata, existing section anchors, allowed scopes, blocked fields, disabled endpoints, inactive activation flags, and metadata-only DTOs.
14. Dashboard group headers preserve selected range links, the section index, existing anchors, and table fallback requirements without enabling collapsible groups or tabs.
