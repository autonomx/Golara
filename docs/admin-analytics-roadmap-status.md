# Admin analytics roadmap status

This document tracks the current state of the `/admin/analytics` workspace and the next safe implementation phases.

## Live now

- Dedicated `/admin/analytics` page in the shared admin shell.
- 7, 30, 90, and 365 day range presets.
- Business KPI cards and previous-range deltas.
- Order, revenue, and average order value trend charts.
- Orders by status and revenue by currency.
- Fulfillment status, payment method mix, and discount usage impact.
- Product view-to-cart conversion from first-party storefront events.
- Product sales and category sales from eligible checkout order lines.
- Site analytics event foundation with privacy-safe first-party events.
- Traffic attribution using capped UTM fields and external referrer domains.
- Owner-only aggregate Business CSV and Site CSV exports.
- Privacy and retention policy visibility.
- Read-only raw site-event retention status and cleanup readiness guidance.
- Role-aware visibility for owner-only exports and retention diagnostics.
- Operator checklist for reviewing analytics and interpreting exports.

## Intentionally pending

- Custom start/end date range selector.
- Automated raw site-event cleanup after production migration evidence is verified.
- Customer-level analytics.
- Scheduled analytics reports.
- Saved dashboard views.

## Customer-level analytics note

Customer-level analytics should be added only as aggregate, privacy-safe reporting. The first implementation should avoid exposing customer names, phones, emails, or raw identifiers in charts or CSV exports.

A safe future slice should prefer aggregate counts such as:

- known-customer order count
- guest order count
- repeat-purchase count
- repeat-purchase revenue
- first-time versus returning-customer order ratio

Any customer cohort export must remain aggregate-only unless a separate explicit customer-report permission model exists.

## Custom date range note

The current range selector intentionally uses fixed presets. Custom start/end dates require a shared resolved-range contract across business analytics, site analytics, export routes, comparison deltas, section links, and panel labels. That should be implemented as a dedicated refactor rather than mixed into unrelated analytics polish work.

## Production validation checklist

Before treating site analytics as complete in production, verify:

1. The site analytics event migration has been applied to the production database.
2. `NEXT_PUBLIC_SITE_ANALYTICS_ENABLED` is not set to `false` for storefront traffic that should be counted.
3. Admin, API, and framework routes are excluded from tracking.
4. Do Not Track is honored in the browser reporter.
5. CSV exports remain aggregate-only.
6. Raw event retention status is visible to owner sessions.
7. Cleanup remains disabled until production migration evidence is confirmed.
