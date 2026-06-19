# Admin analytics production validation runbook

This runbook validates the admin analytics workspace after deploy. It is intended for owner/admin operators before treating `/admin/analytics` as an operational source of truth.

Use it to validate the production analytics path end to end: database migration, storefront event capture, checkout funnel capture, custom range parity, aggregate exports, customer cohort aggregates, advanced aggregate customer cohort reporting, retention status, cleanup preview evidence, scheduled report config-plan/storage-schema/read-model/repository-contract evidence, saved view persistence-plan/storage-schema/read-model evidence, and dashboard group header evidence.

## Scope

Validate that the analytics page can show trustworthy aggregate data for:

- business/order analytics
- site analytics events
- checkout funnel events
- product and category sales
- custom preset and start/end date ranges
- aggregate customer cohort metrics
- advanced aggregate customer cohort AOV/share, order-count band, and recency band metrics
- aggregate CSV exports
- scheduled report previews, draft config plans, inactive storage schema, metadata-only read model, and repository-read contract
- saved dashboard view presets, persistence plans, inactive storage schema, and metadata-only read model
- dashboard group headers
- privacy and retention status
- raw-event cleanup preview without deletion

## Preconditions

- Production deployment is live.
- The production database has been migrated.
- The `SiteAnalyticsEvent` table/model is available in production.
- The `AdminAnalyticsScheduledReport` table exists before any future scheduled-report activation work begins.
- The `AdminAnalyticsSavedView` table exists before any future saved-view activation work begins.
- Admin owner access is available.
- Storefront analytics is not disabled with `NEXT_PUBLIC_SITE_ANALYTICS_ENABLED=false`.
- The storefront can receive realistic visits or staging checkout traffic.
- The validation operator has a known reporting window that includes the test traffic and eligible checkout order.

## Validation steps

1. Open `/admin/analytics` as an owner.
2. Confirm the analytics page loads with the shared admin sidebar.
3. Confirm the selected range controls include 7, 30, 90, and 365 days.
4. Confirm custom `start` and `end` fields are visible.
5. Confirm the role banner shows owner controls.
6. Confirm Business CSV and Site CSV links are visible.
7. Confirm raw-event retention status is visible.
8. Confirm the retention panel does not report a missing site analytics table after production migration.
9. Confirm the cleanup preview card is visible and reports eligible stale-event count, deletion disabled, production evidence status, and preview reason.
10. Visit storefront product and category pages.
11. Submit a catalog search.
12. Submit an add-to-cart flow.
13. Start checkout.
14. Select a payment method.
15. Complete a checkout in staging/test mode or with an approved manual/cash method.
16. Return to `/admin/analytics` and choose the preset range that includes the test activity.
17. Record the selected range label shown on the page.
18. Confirm site event totals increase.
19. Confirm product views, category views, add-to-cart, checkout started, payment method selected, and checkout completed signals appear where expected.
20. Confirm business/order analytics update after eligible orders exist.
21. Confirm aggregate customer cohort panels update after eligible customer-linked orders exist.
22. Confirm the Advanced cohorts panel renders aggregate AOV/share, known-customer order-count band, and recency band charts.
23. Enter a custom `start` and `end` window that includes the same activity.
24. Confirm dashboard labels, section links, and Business/Site CSV URLs preserve that custom window.
25. Download Business CSV and confirm aggregate business rows exist for the selected window.
26. Download Site CSV and confirm aggregate site/funnel rows exist for the selected window.
27. Confirm Business CSV includes only aggregate customer cohort rows for guest, known, first-time, and returning-customer buckets.
28. Confirm Business CSV includes advanced aggregate cohort rows for AOV/share buckets, known-customer order-count bands, and known-customer recency bands.
29. Confirm scheduled report previews and config plans preserve the selected range and aggregate Business/Site CSV paths.
30. Confirm scheduled report config plans are draft-only, owner-only, inactive, and require owner approval.
31. Confirm the `AdminAnalyticsScheduledReport` storage schema is present, metadata-only, and defaults owner approval, active state, and delivery state to disabled.
32. Confirm the scheduled report read model returns metadata-only DTOs, rejects invalid rows, keeps operator activation disabled, and keeps delivery readiness disabled.
33. Confirm the scheduled report repository-read contract defines metadata-only select fields, owner-approved filter, active-state filter, and delivery-disabled filter.
34. Confirm scheduled report delivery, schedule execution, active repository reads/writes, endpoints, and management UI remain disabled.
35. Confirm saved view presets preserve the selected range and existing section anchors.
36. Confirm saved view persistence plans expose allowed scopes, metadata-only required fields, blocked fields, owner approval required, and owner approval not recorded.
37. Confirm the `AdminAnalyticsSavedView` storage schema is present, metadata-only, and defaults owner approval and activation to disabled.
38. Confirm the saved view read model returns metadata-only DTOs, rejects invalid rows, and keeps operator activation disabled.
39. Confirm saved view save/update/remove/read endpoints, active repository access, and management UI remain disabled.
40. Confirm dashboard group headers render for Overview, Business, Site, Products and categories, Operations, and Privacy/docs.
41. Confirm group-header links preserve the selected range, existing section anchors, section index expectations, and table fallback requirements.
42. Confirm collapsible groups and tabbed workspace behavior remain disabled until a separate UI pass.
43. Confirm neither CSV contains visitor session details, full referrer URLs, analytics event payloads, customer names, phone numbers, emails, addresses, raw customer identifiers, or per-customer rows.
44. Confirm the cleanup preview does not delete raw events and that deletion remains disabled until production migration evidence and analytics-volume evidence are recorded.

## Evidence record

Record one evidence note per validation pass:

- Deployment or commit SHA:
- Environment:
- Operator:
- Validation date/time:
- Preset range checked:
- Custom start date:
- Custom end date:
- Business CSV checked:
- Site CSV checked:
- Customer cohort aggregate rows checked:
- Advanced cohort AOV/share rows checked:
- Advanced cohort order-count band rows checked:
- Advanced cohort recency band rows checked:
- Scheduled report preview checked:
- Scheduled report config plans checked:
- Scheduled report config status:
- Scheduled report storage schema checked:
- Scheduled report read model checked:
- Scheduled report read model metadata-only output checked:
- Scheduled report read model invalid rows omitted:
- Scheduled report read model operator activation disabled:
- Scheduled report read model delivery readiness disabled:
- Scheduled report repository-read contract checked:
- Scheduled report repository-read select fields metadata-only:
- Scheduled report repository-read required filters checked:
- Scheduled report repository-read active path disabled:
- Scheduled report storage table:
- Scheduled report metadata-only fields checked:
- Scheduled report owner approval required:
- Scheduled report owner approved:
- Scheduled report active state disabled:
- Scheduled report delivery disabled:
- Scheduled report execution disabled:
- Scheduled report endpoints disabled:
- Scheduled report management UI disabled:
- Scheduled report dry-run evidence required:
- Saved view preset preview checked:
- Saved view persistence plan checked:
- Saved view storage schema checked:
- Saved view read model checked:
- Saved view storage table:
- Saved view allowed scopes checked:
- Saved view metadata-only fields checked:
- Saved view blocked fields checked:
- Saved view owner approval required:
- Saved view owner approval recorded:
- Saved view active flag disabled:
- Saved view read model operator activation disabled:
- Saved view repository disabled:
- Saved view read endpoint disabled:
- Saved view save/update/remove endpoints disabled:
- Saved view management UI disabled:
- Saved view selected range preserved:
- Saved view section anchors preserved:
- Dashboard group headers checked:
- Dashboard group selected range preserved:
- Dashboard group section anchors preserved:
- Dashboard group table fallback requirement preserved:
- Collapsible groups disabled:
- Tabs disabled:
- Retention status checked:
- Cleanup preview eligible stale-event count:
- Cleanup preview deletion status:
- Cleanup preview production evidence status:
- Cleanup preview reason:
- Result: pass / fail / blocked
- Follow-up issue or PR:

## Expected result

The analytics page should show aggregate business, site, range, export, customer cohort, advanced cohort, scheduled-report config-plan/storage-schema/read-model/repository-contract, saved-view persistence-plan/storage-schema/read-model, dashboard group header, retention, and cleanup-preview signals without exposing non-aggregate visitor or customer detail. Empty panels are acceptable only when the selected range has no matching traffic, orders, or production migration evidence.

## Blockers

Do not treat analytics as source-of-truth if any of these are true:

- the site analytics table is missing in production
- storefront events are not being stored
- checkout funnel events are missing after a test checkout
- owner CSV exports fail or contain no expected aggregate rows
- selected range labels, section links, and CSV URLs disagree
- customer cohort panels or exports expose per-customer detail
- advanced cohort panels or CSV exports expose names, phones, emails, addresses, raw identifiers, or per-customer rows
- scheduled report previews or config plans do not preserve selected range export paths
- scheduled report storage stores analytics rows, customer rows, raw events, visitor/session identifiers, delivery recipient lists, or export contents
- scheduled report read model returns analytics rows, customer rows, raw events, visitor/session identifiers, delivery recipient lists, export contents, or delivery payloads
- scheduled report read model marks DTOs active for operators or delivery ready before active repository access, approval workflow, dry-run evidence, and delivery controls exist
- scheduled report repository-read contract omits owner-approved, active-state, or delivery-disabled filters for future active reads
- scheduled report delivery, execution, active repository access, endpoints, or management UI are enabled before owner approval, dry-run evidence, global disable controls, and audit logging are designed
- scheduled report config plans are active before owner approval and dry-run evidence exist
- saved view presets or persistence plans do not preserve selected range and section anchors
- saved view persistence plans allow report rows, customer rows, event rows, or contact fields
- saved view storage stores analytics rows, customer rows, raw events, contact fields, visitor/session identifiers, or export contents
- saved view read model returns analytics rows, customer rows, raw events, contact fields, visitor/session identifiers, or export contents
- saved view read model marks DTOs active for operators before active repository access and approval workflow exist
- saved view endpoints, active repository access, or management UI are enabled before owner approval recording, role policy, and audit logging are designed
- dashboard group headers do not preserve selected range links and existing section anchors
- collapsible groups or tabs are enabled before mobile layout and accessibility evidence are recorded
- retention status cannot read the event table
- cleanup preview cannot report eligibility status for stale raw events
- cleanup preview indicates deletion is enabled before production evidence is recorded
- Do Not Track or analytics disable behavior is not respected

## Notes

- Exports must stay aggregate-only.
- Customer cohort reporting must remain aggregate-only and privacy-safe.
- Advanced cohort reporting must stay limited to non-identifying AOV/share/order-count/recency buckets unless a separate privacy review and permission model exists.
- Scheduled report config plans, storage schema, read model, and repository-read contract must remain inactive and disabled for delivery, execution, active repository access, endpoints, and management UI until owner approval recording, dry-run evidence, delivery controls, global disable controls, and retry/failure visibility are implemented.
- Saved view persistence plans, storage schema, and read model must remain inactive and disabled for save/update/remove/read endpoints, active repository access, and management UI until owner approval recording, role policy, and audit logging are implemented.
- Dashboard group headers must remain static links until collapsible groups or tabs are implemented and validated separately.
- Raw event deletion remains disabled until a separate guarded cleanup job is implemented, cleanup preview evidence is recorded, and production evidence exists.
