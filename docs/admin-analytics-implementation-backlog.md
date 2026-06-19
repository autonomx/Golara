# Admin analytics implementation backlog

This backlog tracks the remaining admin analytics work after the custom range, aggregate cohort, retention preview, scheduled report preview, saved view preset preview, and layout grouping preview foundation passes.

## Current live baseline

- Dedicated `/admin/analytics` page in the shared admin shell.
- Preset ranges: 7, 30, 90, and 365 days.
- Validated custom start/end date ranges that share the same resolved range across dashboard panels, section links, comparisons, and CSV exports.
- Business charts for order status, revenue by currency, trends, fulfillment, payment mix, discounts, products, and categories.
- Aggregate customer cohort order/revenue buckets for guest, known, first-time, and returning-customer segments.
- First-party site analytics for page, product, category, search, cart, checkout, payment-method, attribution, and funnel signals.
- Aggregate Business CSV and Site CSV exports.
- Scheduled report preview foundation for weekly/monthly owner report options using the selected range and aggregate CSV paths.
- Saved dashboard view preset preview foundation using the selected range and existing section anchors.
- Dashboard layout grouping preview foundation using the selected range, section index, existing anchors, and chart table fallback requirements.
- Privacy and retention documentation.
- Read-only raw event retention status and cleanup preview.
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

### Scheduled report preview foundation

Completed baseline:

- Weekly and monthly owner report options are represented as preview-only plans.
- Preview plans reuse the selected analytics range and aggregate Business/Site CSV paths.
- Delivery is disabled.
- Schedule persistence is disabled.
- No cron, email transport, timer, or background execution path is introduced.

### Saved dashboard view preset foundation

Completed baseline:

- Named view presets are represented as preview-only metadata.
- View presets reuse the selected analytics range and existing section anchors.
- Presets include owner/staff audience labels.
- View saving is disabled.
- Client-side and server-side saved state are disabled.
- No persistence model, save endpoint, or analytics-calculation change is introduced.

### Dashboard layout grouping preview foundation

Completed baseline:

- Dashboard layout groups are represented as preview-only metadata.
- Groups reuse the selected analytics range and existing section anchors.
- The contract covers Overview, Business, Site, Products and categories, Operations, and Privacy/docs.
- Group header UI is disabled.
- Collapsible groups are disabled.
- Tabbed workspace behavior is disabled.
- Existing section index, range links, anchors, and chart table fallback requirements are preserved.

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

- The current admin page shows retention status and cleanup preview only; it does not delete raw events.
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

### 3. Scheduled report persistence and delivery

Goal: let owners save recurring aggregate analytics reports after export and range semantics are stable.

Acceptance criteria:

- Scheduled reports use the same resolved range contract as the dashboard/export routes.
- Delivery remains owner-controlled.
- Report contents remain aggregate-only.
- Saving schedules requires a persistence model and owner approval evidence.
- Delivery requires an explicit provider/channel plan and testable disable switch.

### 4. Saved dashboard view persistence

Goal: let operators save preferred dashboard range/filter layouts after the preview contract is validated.

Acceptance criteria:

- Saved views do not change source analytics calculations.
- Views preserve the existing section index and range links.
- Access remains role-aware.
- Saved metadata is limited to view labels, selected range/filter metadata, and section anchors.
- Persistence includes owner/staff management and delete/update behavior.

### 5. Dashboard group header UI

Goal: keep the analytics page readable as more panels are added.

Acceptance criteria:

- Use the preview grouping contract as the source for group labels and anchor groupings.
- Preserve the existing section index and range links.
- Keep accessible table fallbacks for charts.
- Keep the page server-rendered and mobile-readable.
- Do not introduce collapsible groups or tabs until the group-header pass is validated.

## Sequencing recommendation

1. Production validation evidence for custom ranges, exports, aggregate cohort panels, retention preview, scheduled report previews, saved view presets, and layout grouping preview.
2. Automated retention cleanup preview, then guarded execution.
3. Advanced aggregate cohort reporting.
4. Scheduled report persistence and delivery.
5. Saved dashboard view persistence.
6. Dashboard group header UI, then collapsible groups or tabs only if needed.
