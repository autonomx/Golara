# Admin analytics roadmap status

This document summarizes the `/admin/analytics` workspace status.

## Live now

- Dedicated Analytics admin page.
- 7, 30, 90, and 365 day range presets.
- Custom start/end date ranges with shared dashboard, comparison, section-link, and CSV export resolution.
- Business KPI cards and previous-range deltas.
- Order, revenue, and average order value trend charts.
- Orders by status and revenue by currency.
- Fulfillment status, payment mix, and discount usage impact.
- Product view-to-cart conversion from first-party storefront events.
- Product sales and category sales from eligible checkout order lines.
- Aggregate customer cohort metrics for guest, known, first-time, and returning-customer order buckets.
- Advanced aggregate customer cohort reporting for AOV/share buckets, known-customer order-count bands, and recency bands.
- Site analytics event foundation with privacy-safe first-party events.
- Traffic attribution using capped UTM fields and external referrer domains.
- Owner-only aggregate Business CSV and Site CSV exports.
- Scheduled report owner management, read/recording endpoints, locked controls, dry-run preview, payload preview, activation readiness, schedule planning, disabled worker shell, disabled transport/outbox contracts, manual owner-run readiness, staging smoke validation, gated delivery executor contract, capped retry planning, and ops hardening.
- Saved dashboard view management surface, owner/staff metadata read route, approved owner POST route plans, injected-delegate storage apply helper, gated storage delegate, owner action core, and dedicated saved-view status page.
- Server-rendered analytics workspace tabs plus native collapsible dashboard groups using the selected range and existing section anchors.
- Privacy and retention policy visibility.
- Raw site-event retention status, cleanup preview, owner-only cleanup plan helper, hard-gated executor, bounded live delegate factory, owner-only cleanup route, and dedicated retention status/control page. Deletion is still fail-closed unless plan, execution, delegate, production evidence, database/table, stale-event, and manual owner confirmation gates all pass.
- Role-aware visibility for owner-only exports and retention diagnostics.
- Operator checklist for reviewing analytics and interpreting exports.

## Planned next

- Future customer segmentation beyond aggregate order-count and recency bands, only after a separate privacy review.
- Scheduled report live scheduler/timer/background registration, automatic worker execution, real transport provider wiring, live email/provider delivery, and automatic retry execution.
- Saved dashboard generated model/client alignment. Current owner routes use the gated storage delegate and retain metadata-only policy checks.

## Customer cohort note

Advanced customer cohort reporting is aggregate-only. It shows AOV/share buckets, known-customer order-count bands, and recency bands without exposing names, emails, phones, addresses, raw customer identifiers, or per-customer rows.

## Scheduled report note

Scheduled reports are production-hardened for owner-only management, previews, payload materialization, planning, disabled execution contracts, manual owner-run readiness, retry visibility, staging smoke validation, and operator hardening. They are not yet production-ready for automatic scheduling or live provider delivery.

The disabled boundary remains important:

- no live scheduler, timer, cron, or background registration
- no automatic worker execution
- no live email/provider delivery by default
- no payload leaving the system by default
- no unbounded retry loop
- no public or staff scheduled-report access
- no arbitrary repository write path
- no per-customer rows, raw event rows, visitor/session identifiers, delivery recipient lists, or export contents in scheduled-report metadata

## Saved dashboard view storage note

Saved dashboard views now have a visible management and route-planning surface. The implementation includes named presets, allowed scopes, role-aware metadata normalization, blocked report/customer/event-row fields, metadata-only DTOs, owner/staff read gating, approved owner POST targets, injected-delegate storage application, a shared action core, and a gated storage delegate attached to the owner routes.

Owner route storage remains fail-closed unless the saved-view storage delegate flag and all saved-view access, endpoint, and role-policy gates pass. The table-shape fragment and guards remain the reference for metadata-only rows.

## Dashboard workspace note

The dashboard layout contract now renders server-side workspace tabs for Overview, Business, Site, Products and categories, Operations, and Privacy/docs, then keeps native collapsible groups below them. Tabs are regular selected-range links, so existing anchors, section index, server rendering, mobile readability, and chart table fallbacks remain intact.

## Retention cleanup note

Retention cleanup now has a gated live delegate track. The implemented surface includes read-only stale-event preview, owner-only cleanup plan helper, hard-gated executor, bounded live delegate factory, owner-only POST route, and a dedicated owner status page with manual confirmation copy.

Deletion is still disabled by default and requires `SITE_ANALYTICS_RETENTION_CLEANUP_PLAN_ENABLED`, `SITE_ANALYTICS_RETENTION_CLEANUP_EXECUTION_ENABLED`, `SITE_ANALYTICS_RETENTION_CLEANUP_DELEGATE_ENABLED`, production retention evidence, database/table availability, an accepted stale-event plan, and the exact manual owner confirmation phrase. The route starts no background jobs and the delegate caps each batch at 1000 rows.

## Production validation checklist

Before treating site analytics as complete in production, verify:

1. The site analytics event migration has been applied to the production database.
2. `NEXT_PUBLIC_SITE_ANALYTICS_ENABLED` is not set to `false` for storefront traffic that should be counted.
3. Admin, API, and framework routes are excluded from tracking.
4. Do Not Track is honored in the browser reporter.
5. CSV exports remain aggregate-only.
6. Raw event retention status is visible to owner sessions.
7. Cleanup preview and owner cleanup route checks report eligible stale-event counts without deleting data unless every retention cleanup gate is explicitly enabled and confirmed.
8. Custom preset and start/end ranges produce matching dashboard, section-link, and export windows.
9. Customer cohort panels and CSV rows remain aggregate-only.
10. Advanced cohort panels and CSV rows show only aggregate AOV/share/order-count/recency bands.
11. Scheduled report owner-only management, read, recording, dry-run preview, payload preview, activation-readiness, schedule planning, disabled worker shell, disabled transport/outbox contracts, manual owner-run readiness, gated delivery executor, and retry planning preserve aggregate-only data and stay behind their explicit gates.
12. Scheduled reports still do not run automatic scheduling, live provider delivery, automatic workers, or unbounded retries.
13. Saved dashboard view management, read routes, owner action plans, storage application contracts, gated storage delegate, and visible status page preserve selected range metadata, existing section anchors, allowed scopes, blocked fields, inactive activation flags, and metadata-only DTOs.
14. Server-rendered analytics workspace tabs and native collapsible groups preserve selected range links, the section index, existing anchors, and table fallback requirements.
