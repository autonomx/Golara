# Admin analytics roadmap status

This document summarizes the `/admin/analytics` workspace status.

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
- Read-only raw site-event retention status and cleanup readiness guidance.
- Role-aware visibility for owner-only exports and retention diagnostics.
- Operator checklist for reviewing analytics and interpreting exports.

## Planned next

- Automated raw site-event cleanup after production migration evidence is verified.
- Advanced customer cohort reporting beyond the current aggregate order/revenue buckets.
- Scheduled analytics reports.
- Saved dashboard views.

## Production validation checklist

Before treating site analytics as complete in production, verify:

1. The site analytics event migration has been applied to the production database.
2. `NEXT_PUBLIC_SITE_ANALYTICS_ENABLED` is not set to `false` for storefront traffic that should be counted.
3. Admin, API, and framework routes are excluded from tracking.
4. Do Not Track is honored in the browser reporter.
5. CSV exports remain aggregate-only.
6. Raw event retention status is visible to owner sessions.
7. Custom preset and start/end ranges produce matching dashboard, section-link, and export windows.
8. Customer cohort panels and CSV rows remain aggregate-only.