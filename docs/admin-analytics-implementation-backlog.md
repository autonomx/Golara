# Admin analytics implementation backlog

This backlog tracks the remaining admin analytics work after the custom range and aggregate cohort implementation pass.

## Current live baseline

- Dedicated `/admin/analytics` page in the shared admin shell.
- Preset ranges: 7, 30, 90, and 365 days.
- Validated custom start/end date ranges that share the same resolved range across dashboard panels, section links, comparisons, and CSV exports.
- Business charts for order status, revenue by currency, trends, fulfillment, payment mix, discounts, products, and categories.
- Aggregate customer cohort order/revenue buckets for guest, known, first-time, and returning-customer segments.
- First-party site analytics for page, product, category, search, cart, checkout, payment-method, attribution, and funnel signals.
- Aggregate Business CSV and Site CSV exports.
- Privacy and retention documentation.
- Read-only raw event retention status.
- Owner-only export and retention controls.

## Completed from earlier backlog

### Custom start/end date ranges

Completed baseline:

- `/admin/analytics` accepts validated `start=YYYY-MM-DD` and `end=YYYY-MM-DD` query parameters.
- Invalid or reversed dates fall back safely.
- Excessive ranges are clamped to a documented maximum.
- Business analytics, site analytics, previous-period comparisons, section links, and CSV exports share one resolved-range helper.
- Preset ranges continue to work unchanged.

### Privacy-safe customer analytics baseline

Completed baseline:

- Metrics are aggregate-only.
- Customer cohort cards and exports avoid names, emails, phone numbers, addresses, and raw customer identifiers.
- Cohorts use non-identifying buckets for guest, known, first-time, and returning-customer order/revenue reporting.
- Admin UI explains privacy boundaries through aggregate-only guidance and export copy.

## Remaining backlog items

### 1. Automated raw-event retention cleanup

Goal: add a guarded cleanup job for raw site analytics events that are older than the retention target.

Acceptance criteria:

- Cleanup is disabled by default.
- A preview/dry-run mode reports how many rows would be affected.
- Production migration evidence is required before enabling deletion.
- Aggregate exports remain available without exposing raw visitor/session data.
- Owner-only admin visibility remains in place.

Notes:

- The current admin page shows retention status only; it does not delete raw events.
- Add operational documentation before enabling the job.

### 2. Advanced aggregate customer cohort reporting

Goal: expand customer/order analytics while staying aggregate-only.

Acceptance criteria:

- Metrics remain aggregate-only.
- No names, emails, phone numbers, addresses, or raw customer identifiers are exported.
- New buckets use non-identifying dimensions such as order-count bands or recency bands.
- Admin UI explains privacy boundaries.

Potential metrics:

- Average order value by aggregate cohort.
- Orders by customer recency band.
- Repeat order trend over time.
- Known-customer revenue share by selected range.

### 3. Scheduled analytics reports

Goal: let owners generate recurring aggregate analytics reports after export and range semantics are stable.

Acceptance criteria:

- Scheduled reports use the same resolved range contract as the dashboard/export routes.
- Delivery remains owner-controlled.
- Report contents remain aggregate-only.

### 4. Saved dashboard views

Goal: let operators save preferred dashboard range/filter layouts.

Acceptance criteria:

- Saved views do not change source analytics calculations.
- Views preserve the existing section index and range links.
- Access remains role-aware.

### 5. Dashboard layout refinement

Goal: keep the analytics page readable as more panels are added.

Acceptance criteria:

- Consider tabs or collapsible sections for Business, Site, Products, Sales, Operations, Customers, and Privacy.
- Preserve the existing section index and range links.
- Keep accessible table fallbacks for charts.

## Sequencing recommendation

1. Production validation evidence for custom ranges, exports, and aggregate cohort panels.
2. Automated retention cleanup preview, then guarded execution.
3. Advanced aggregate cohort reporting.
4. Scheduled analytics reports.
5. Saved dashboard views.
6. Dashboard layout refinement when the page starts feeling crowded.