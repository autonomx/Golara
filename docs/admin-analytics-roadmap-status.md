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
- Privacy and retention policy visibility.
- Read-only raw site-event retention status, cleanup preview, and cleanup readiness guidance.
- Role-aware visibility for owner-only exports and retention diagnostics.
- Operator checklist for reviewing analytics and interpreting exports.

## Intentionally pending

- Automated raw site-event deletion after production migration evidence and cleanup preview evidence are verified.
- Advanced customer cohort reporting beyond the current aggregate order/revenue buckets.
- Scheduled analytics reports.
- Saved dashboard views.

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
