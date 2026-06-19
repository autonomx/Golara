# Admin analytics roadmap status

This document summarizes the `/admin/analytics` workspace status.

## Live now

- Dedicated `/admin/analytics` page in the shared admin shell.
- 7, 30, 90, and 365 day range presets.
- Custom start/end date ranges with shared dashboard, comparison, section-link, and CSV export resolution.
- Business KPI cards and previous-range deltas.
- Order, revenue, and average order value trend charts.
- Orders by status and revenue by currency.
- Fulfillment status, payment mix, and discount usage impact.
- Product view-to-cart conversion from first-party storefront events.
- Product sales and category sales from eligible checkout order lines.
- Aggregate customer cohort metrics for guest, known, first-time, and returning-customer order buckets.
- Site analytics event foundation with privacy-safe first-party events.
- Traffic attribution using capped UTM fields and external referrer domains.
- Owner-only aggregate Business CSV and Site CSV exports.
- Scheduled report preview foundation using the selected analytics range and aggregate Business/Site CSV paths.
- Saved dashboard view preset preview foundation using the selected analytics range and existing section anchors.
- Privacy and retention policy visibility.
- Read-only raw site-event retention status, cleanup preview, and cleanup readiness guidance.
- Role-aware visibility for owner-only exports and retention diagnostics.
- Operator checklist for reviewing analytics and interpreting exports.

## Planned next

- Automated raw site-event deletion after production migration evidence and cleanup preview evidence are verified.
- Advanced customer cohort reporting beyond the current aggregate order/revenue buckets.
- Scheduled report persistence, delivery configuration, and owner approval workflow.
- Saved dashboard view persistence, role-policy persistence, and owner/staff management UI.

## Scheduled report preview note

The scheduled report foundation is preview-only. It defines weekly and monthly owner report options, selected-range metadata, and aggregate Business/Site CSV paths without saving schedules or enabling delivery.

## Saved dashboard view preview note

The saved dashboard view foundation is preview-only. It defines named dashboard view presets, selected-range metadata, role-aware audience labels, and existing section-anchor links without saving view state or adding storage-backed management flows.

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
10. Scheduled report previews preserve the selected range and aggregate Business/Site CSV paths without enabling delivery.
11. Saved dashboard view presets preserve the selected range and existing section anchors without saving view state.
