# Admin analytics implementation backlog

This backlog tracks the remaining admin analytics work after the custom range, aggregate cohort, advanced cohort, retention preview, scheduled report hardening, saved view management, retention cleanup gates, and native collapsible dashboard group passes.

## Current live baseline

- Dedicated `/admin/analytics` page in the shared admin shell.
- Preset ranges: 7, 30, 90, and 365 days.
- Validated custom start/end date ranges that share the same resolved range across dashboard panels, section links, comparisons, and CSV exports.
- Business charts for order status, revenue by currency, trends, fulfillment, payment mix, discounts, products, and categories.
- Aggregate customer cohort order/revenue buckets for guest, known, first-time, and returning-customer segments.
- Advanced aggregate customer cohort reporting for AOV/share buckets, known-customer order-count bands, and recency bands.
- First-party site analytics for page, product, category, search, cart, checkout, payment-method, attribution, and funnel signals.
- Aggregate Business CSV and Site CSV exports.
- Scheduled report owner management, read/recording endpoints, locked controls, dry-run preview, payload preview, activation readiness, schedule planning, disabled worker shell, disabled/outbox transport contracts, manual owner-run readiness, staging smoke validation, history, clock-readiness, ops hardening, gated delivery executor, and capped retry planning.
- Saved dashboard view management surface, mutation policy, metadata read route, approved owner POST route plans, injected-delegate storage application, owner action core, and visible status page.
- Native collapsible dashboard group UI using the selected range, section index, existing anchors, and chart table fallback requirements.
- Privacy and retention documentation.
- Raw event retention status, cleanup preview, owner-only cleanup plan helper, hard-gated injected-delegate executor, no-delegate owner route, and dedicated owner status page.
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

### Scheduled report hardening track

Completed baseline:

- Weekly and monthly owner report options are represented as preview/config-plan metadata.
- Owner-only management, read, recording, dry-run preview, payload preview, activation-readiness, schedule planning, disabled worker shell, disabled/default transport, outbox channel validation, manual owner-run readiness, staging smoke validation, history view, clock-readiness, ops-hardening, gated delivery execution, and retry planning slices are implemented.
- Dry-run, payload, activation, delivery, retry, and schedule contracts remain aggregate-only.
- Automatic scheduling, automatic workers, live provider delivery, and automatic retry loops remain disabled by default.

### Saved dashboard view management track

Completed baseline:

- Named view presets are represented as metadata.
- View presets reuse the selected analytics range and existing section anchors.
- Presets include owner/staff audience labels, allowed manager audience, and owner/staff/store-wide scopes.
- Future saved-view metadata is limited to view labels, selected range/filter metadata, section anchors, scope, audience, owner approval flag, and active flag.
- Report rows, customer rows, event rows, contact fields, visitor/session identifiers, and export contents are blocked from saved-view records.
- The inactive `AdminAnalyticsSavedView` migration table exists for metadata-only future saves.
- The read-model foundation normalizes future table rows into metadata-only DTOs.
- Owner/staff read surfaces, mutation policy, route plans, injected-delegate storage application, action core, and status page are implemented.
- Live routes remain plan-only by default unless a storage delegate is explicitly provided.

### Native collapsible dashboard grouping

Completed baseline:

- Dashboard layout groups are represented as metadata.
- Groups reuse the selected analytics range and existing section anchors.
- The contract covers Overview, Business, Site, Products and categories, Operations, and Privacy/docs.
- Existing section index, range links, anchors, and chart table fallback requirements are preserved.
- Native `<details>`/`<summary>` group controls render on `/admin/analytics` without client-side state.
- Tabbed workspace behavior remains disabled.

### Retention cleanup gate track

Completed baseline:

- Retention status and cleanup preview remain owner-visible.
- The cleanup plan helper is owner-only, production-evidence gated, dry-run-only, and non-destructive.
- The executor requires an accepted plan, explicit execution flag, manual owner confirmation, and an injected delegate.
- The owner-only route and status page are wired, but the route passes `delegate: null` by default.
- No background job, queue, timer, or automatic deletion path is registered.

## Remaining backlog items

### 1. Automated raw-event retention cleanup live delegate

Goal: attach a production-safe delete delegate for raw site analytics events that are older than the retention target.

Acceptance criteria:

- Cleanup is disabled by default.
- The current preview/plan route still reports how many rows would be affected.
- Production migration evidence is required before enabling deletion.
- Manual owner confirmation is required for each live cleanup run.
- The route must cap each batch and report the deleted count.
- Aggregate exports remain available without exposing raw visitor/session data.
- Owner-only admin visibility remains in place.

Notes:

- The current admin page and route show retention status, plan, and manual confirmation, but the route does not attach a delete delegate by default.
- Add operational rollback documentation before enabling the live delegate.

### 2. Scheduled report live delivery enablement

Goal: let owners approve, manage, and run recurring aggregate analytics reports after the safe contracts and staging smoke checks are validated.

Acceptance criteria:

- Scheduled reports use the same resolved range contract as the dashboard/export routes.
- Delivery remains owner-controlled.
- Report contents remain aggregate-only.
- Active repository access requires owner approval evidence, dry-run evidence, and disable controls.
- Live delivery requires an explicit provider/channel adapter, rollback evidence, retry/failure visibility, and testable global disable switch.
- Dry-run evidence records the exact selected range and aggregate CSV paths before delivery is enabled.
- Automatic scheduling must have lock/concurrency protection before it can run unattended.

### 3. Saved dashboard generated-client persistence

Goal: let the live saved-view routes use generated-client metadata writes after the storage schema is safely wired into the main Prisma client.

Acceptance criteria:

- Saved views do not change source analytics calculations.
- Views preserve the existing section index and range links.
- Access remains role-aware.
- Saved metadata is limited to view labels, selected range/filter metadata, section anchors, scope, audience, owner approval flag, and active flag.
- Active save/update/remove/read endpoints require owner approval evidence and management UI.
- Role-policy enforcement is explicit for owner-private, staff-shared, and store-wide owner-managed scopes.
- Generated-client access remains metadata-only and avoids raw analytics rows.

### 4. Tabbed workspace behavior

Goal: add true tabbed workspace behavior only if native collapsible groups are insufficient.

Acceptance criteria:

- Preserve the existing section index and range links.
- Keep accessible table fallbacks for charts.
- Keep the page server-rendered and mobile-readable.
- Record accessibility and mobile-layout evidence before enabling tabs.

## Sequencing recommendation

1. Status cleanup and production validation evidence for the merged saved-view, retention-gate, and collapsible-group tracks.
2. Retention cleanup live delegate with explicit rollback evidence.
3. Scheduled report live delivery provider and controlled manual live pilot.
4. Scheduled report automatic scheduler only after live manual delivery is proven.
5. Saved dashboard generated-client persistence when the main Prisma schema/client path can be safely edited.
6. Tabbed workspace behavior only if native collapsible groups are not enough.
