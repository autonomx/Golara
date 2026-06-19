# Admin analytics implementation backlog

This backlog tracks the remaining admin analytics work after the first analytics production pass.

## Current live baseline

- Dedicated `/admin/analytics` page in the shared admin shell.
- Preset ranges: 7, 30, 90, and 365 days.
- Business charts for order status, revenue by currency, trends, fulfillment, payment mix, discounts, products, and categories.
- First-party site analytics for page, product, category, search, cart, checkout, payment-method, attribution, and funnel signals.
- Aggregate Business CSV and Site CSV exports.
- Privacy and retention documentation.
- Read-only raw event retention status.
- Owner-only export and retention controls.

## Backlog items

### 1. Custom start/end date ranges

Goal: add explicit start and end date filtering while preserving the existing preset range behavior.

Acceptance criteria:

- `/admin/analytics` accepts validated `start=YYYY-MM-DD` and `end=YYYY-MM-DD` query parameters.
- Invalid or reversed dates fall back safely.
- Excessive ranges are clamped to a documented maximum.
- Business analytics, site analytics, previous-period comparisons, section links, and CSV exports share one resolved-range helper.
- Preset ranges continue to work unchanged.

Notes:

- Keep this as a focused analytics service-contract refactor.
- Do not mix custom range work with unrelated dashboard UI changes.

### 2. Automated raw-event retention cleanup

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

### 3. Privacy-safe customer analytics

Goal: add customer/order analytics without exposing customer identifiers or raw customer-level exports.

Acceptance criteria:

- Metrics are aggregate-only.
- No names, emails, phone numbers, addresses, or raw customer identifiers are exported.
- Cohorts use non-identifying buckets, such as new vs returning, order count buckets, or recency bands.
- Admin UI explains privacy boundaries.

Potential metrics:

- New vs returning customer order share.
- Repeat-order rate.
- Average order value by cohort.
- Orders by customer recency band.

### 4. Dashboard layout refinement

Goal: keep the analytics page readable as more panels are added.

Acceptance criteria:

- Consider tabs or collapsible sections for Business, Site, Products, Sales, Operations, and Privacy.
- Preserve the existing section index and range links.
- Keep accessible table fallbacks for charts.

## Sequencing recommendation

1. Custom start/end date ranges.
2. Dashboard layout refinement.
3. Automated retention cleanup preview, then guarded execution.
4. Privacy-safe customer analytics.
