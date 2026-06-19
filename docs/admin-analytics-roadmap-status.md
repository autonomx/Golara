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
- Site analytics event foundation with privacy-safe first-party events.
- Traffic attribution using capped UTM fields and external referrer domains.
- Owner-only aggregate Business CSV and Site CSV exports.
- Scheduled report preview foundation that reuses the selected analytics range and aggregate Business/Site CSV paths.
- Saved dashboard view preset preview foundation that reuses the selected analytics range and existing section anchors.
- Dashboard group header UI that uses the layout grouping contract while preserving the selected range, section index, anchors, and table fallback requirements.
- Privacy and retention policy visibility.
- Read-only raw site-event retention status, cleanup preview, and cleanup readiness guidance.
- Role-aware visibility for owner-only exports and retention diagnostics.
- Operator checklist for reviewing analytics and interpreting exports.

## Intentionally pending

- Automated raw site-event deletion after production migration evidence and cleanup preview evidence are verified.
- Advanced customer cohort reporting beyond the current aggregate order/revenue buckets.
- Scheduled report persistence, delivery configuration, and owner approval workflow.
- Saved dashboard view persistence, role-policy persistence, and owner/staff management UI.
- Collapsible dashboard groups or tabbed workspace behavior.

## Customer cohort analytics note

Customer cohort analytics are live only as aggregate, privacy-safe reporting. The current implementation avoids exposing customer names, phones, emails, or raw identifiers in charts or CSV exports.

The live cohort slice includes aggregate counts and revenue for:

- known-customer orders
- guest orders
- known-customer count
- first-time known-customer orders
- returning known-customer orders
- returning known-customer revenue and order rate

Any future customer cohort export must remain aggregate-only unless a separate explicit customer-report permission model exists.

## Custom date range note

The range selector now supports both fixed presets and custom start/end dates. Presets and custom ranges resolve through the same contract across business analytics, site analytics, export routes, comparison deltas, section links, and panel labels.

## Scheduled report preview note

The scheduled report foundation is preview-only. It defines weekly and monthly owner report options, selected-range metadata, and aggregate Business/Site CSV paths without creating saved schedules, delivery jobs, email sends, or background execution.

Actual scheduled delivery remains pending until persistence, delivery configuration, and owner approval evidence are designed and validated.

## Saved dashboard view preview note

The saved dashboard view foundation is preview-only. It defines named dashboard view presets, selected-range metadata, role-aware audience labels, and existing section-anchor links without saving view state or adding storage-backed management flows.

Actual saved views remain pending until persistence, role-policy storage, and owner/staff management UI are designed and validated.

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
11. Scheduled report previews preserve the selected range and aggregate Business/Site CSV paths without enabling delivery.
12. Saved dashboard view presets preserve the selected range and existing section anchors without saving view state.
13. Dashboard group headers preserve selected range links, the section index, existing anchors, and table fallback requirements without enabling collapsible groups or tabs.
