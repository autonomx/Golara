# Admin analytics implementation backlog

This backlog tracks the remaining admin analytics work after the custom range, aggregate cohort, advanced cohort, retention preview, scheduled report preview/config-plan, saved view preset/persistence-plan, layout grouping preview, and dashboard group header UI passes.

## Current live baseline

- Dedicated `/admin/analytics` page in the shared admin shell.
- Preset ranges: 7, 30, 90, and 365 days.
- Validated custom start/end date ranges that share the same resolved range across dashboard panels, section links, comparisons, and CSV exports.
- Business charts for order status, revenue by currency, trends, fulfillment, payment mix, discounts, products, and categories.
- Aggregate customer cohort order/revenue buckets for guest, known, first-time, and returning-customer segments.
- Advanced aggregate customer cohort reporting for AOV/share buckets, known-customer order-count bands, and recency bands.
- First-party site analytics for page, product, category, search, cart, checkout, payment-method, attribution, and funnel signals.
- Aggregate Business CSV and Site CSV exports.
- Scheduled report preview and draft configuration-plan foundation for weekly/monthly owner report options using the selected range and aggregate CSV paths.
- Saved dashboard view preset and persistence-plan foundation using the selected range, existing section anchors, allowed scopes, and metadata-only future-save rules.
- Dashboard group header UI using the selected range, section index, existing anchors, and chart table fallback requirements.
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

### Advanced aggregate customer cohort reporting

Completed baseline:

- Metrics remain aggregate-only.
- No names, emails, phone numbers, addresses, or raw customer identifiers are exported.
- `/admin/analytics` includes an Advanced cohorts section with selected-range AOV/share, order-count band, and recency band charts.
- Business CSV exports include advanced aggregate cohort rows for AOV/share buckets, known-customer order-count bands, and known-customer recency bands.
- New buckets use non-identifying dimensions and never render per-customer rows.

### Scheduled report preview and configuration-plan foundation

Completed baseline:

- Weekly and monthly owner report options are represented as preview/config-plan metadata.
- Preview and config plans reuse the selected analytics range and aggregate Business/Site CSV paths.
- Draft config plans require owner approval, but approval is not recorded yet.
- Config plans remain inactive.
- Delivery is disabled.
- Schedule persistence is disabled.
- No cron, email transport, timer, or background execution path is introduced.

### Saved dashboard view preset and persistence-plan foundation

Completed baseline:

- Named view presets are represented as metadata.
- View presets reuse the selected analytics range and existing section anchors.
- Presets include owner/staff audience labels, allowed manager audience, and owner/staff/store-wide scopes.
- Future saved-view metadata is limited to view key, view label, scope, selected range query, and section anchors.
- Report rows, customer rows, event rows, and contact fields are blocked from saved-view records.
- Owner approval is required before active saved views, but approval is not recorded yet.
- View saving is disabled.
- Client-side and server-side saved state are disabled.
- Save/update/remove endpoints and management UI are disabled.
- No persistence model, save endpoint, or analytics-calculation change is introduced.

### Dashboard layout grouping preview foundation

Completed baseline:

- Dashboard layout groups are represented as metadata.
- Groups reuse the selected analytics range and existing section anchors.
- The contract covers Overview, Business, Site, Products and categories, Operations, and Privacy/docs.
- Existing section index, range links, anchors, and chart table fallback requirements are preserved.

### Dashboard group header UI

Completed baseline:

- Static group headers render on `/admin/analytics` from the layout grouping contract.
- Group cards link to existing dashboard anchors with the selected analytics range preserved.
- The existing section index now includes the Dashboard groups anchor.
- The page remains server-rendered and mobile-readable.
- Collapsible groups are disabled.
- Tabbed workspace behavior is disabled.

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

### 2. Scheduled report storage and delivery execution

Goal: let owners save and run recurring aggregate analytics reports after the config-plan contract is validated.

Acceptance criteria:

- Scheduled reports use the same resolved range contract as the dashboard/export routes.
- Delivery remains owner-controlled.
- Report contents remain aggregate-only.
- Saving schedules requires a persistence model, owner approval evidence, and disable controls.
- Delivery requires an explicit provider/channel plan, retry/failure visibility, and testable global disable switch.
- Dry-run evidence records the exact selected range and aggregate CSV paths before delivery is enabled.

### 3. Saved dashboard view active persistence

Goal: let operators save preferred dashboard range/filter layouts after the persistence-plan contract is validated.

Acceptance criteria:

- Saved views do not change source analytics calculations.
- Views preserve the existing section index and range links.
- Access remains role-aware.
- Saved metadata is limited to view labels, selected range/filter metadata, and section anchors.
- Active save/update/remove endpoints require owner approval evidence and management UI.
- Role-policy enforcement is explicit for owner-private, staff-shared, and store-wide owner-managed scopes.

### 4. Collapsible groups or tabs

Goal: reduce page length only if the static group-header UI is not enough.

Acceptance criteria:

- Preserve the existing section index and range links.
- Keep accessible table fallbacks for charts.
- Keep the page server-rendered and mobile-readable.
- Record accessibility and mobile-layout evidence before enabling collapsible groups or tabbed workspace behavior.

## Sequencing recommendation

1. Production validation evidence for custom ranges, exports, aggregate and advanced cohort panels, retention preview, scheduled report config plans, saved view persistence plans, and dashboard group headers.
2. Automated retention cleanup preview, then guarded execution after production evidence exists.
3. Scheduled report storage and delivery execution.
4. Saved dashboard view active persistence.
5. Collapsible groups or tabs only if the static group-header UI is not enough.
