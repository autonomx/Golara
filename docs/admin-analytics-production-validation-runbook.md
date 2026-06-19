# Admin analytics production validation runbook

This runbook validates the admin analytics workspace after deploy. It is intended for owner/admin operators before treating `/admin/analytics` as an operational source of truth.

Use it to validate the production analytics path end to end: database migration, storefront event capture, checkout funnel capture, custom range parity, aggregate exports, customer cohort aggregates, advanced aggregate customer cohort reporting, retention status, cleanup preview evidence, scheduled report preview evidence, saved view preset evidence, and dashboard group header evidence.

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
- scheduled report previews
- saved dashboard view presets
- dashboard group headers
- privacy and retention status
- raw-event cleanup preview without deletion

## Preconditions

- Production deployment is live.
- The production database has been migrated.
- The `SiteAnalyticsEvent` table/model is available in production.
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
29. Confirm scheduled report previews preserve the selected range and aggregate Business/Site CSV paths.
30. Confirm scheduled report delivery and schedule persistence remain disabled.
31. Confirm saved view presets preserve the selected range and existing section anchors.
32. Confirm saved view persistence and client/server saved state remain disabled.
33. Confirm dashboard group headers render for Overview, Business, Site, Products and categories, Operations, and Privacy/docs.
34. Confirm group-header links preserve the selected range, existing section anchors, section index expectations, and table fallback requirements.
35. Confirm collapsible groups and tabbed workspace behavior remain disabled until a separate UI pass.
36. Confirm neither CSV contains visitor session details, full referrer URLs, analytics event payloads, customer names, phone numbers, emails, addresses, raw customer identifiers, or per-customer rows.
37. Confirm the cleanup preview does not delete raw events and that deletion remains disabled until production migration evidence and analytics-volume evidence are recorded.

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
- Scheduled report delivery disabled:
- Scheduled report persistence disabled:
- Saved view preset preview checked:
- Saved view persistence disabled:
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

The analytics page should show aggregate business, site, range, export, customer cohort, advanced cohort, scheduled-report preview, saved-view preset, dashboard group header, retention, and cleanup-preview signals without exposing non-aggregate visitor or customer detail. Empty panels are acceptable only when the selected range has no matching traffic, orders, or production migration evidence.

## Blockers

Do not treat analytics as source-of-truth if any of these are true:

- the site analytics table is missing in production
- storefront events are not being stored
- checkout funnel events are missing after a test checkout
- owner CSV exports fail or contain no expected aggregate rows
- selected range labels, section links, and CSV URLs disagree
- customer cohort panels or exports expose per-customer detail
- advanced cohort panels or CSV exports expose names, phones, emails, addresses, raw identifiers, or per-customer rows
- scheduled report previews do not preserve selected range export paths
- scheduled report delivery or persistence is enabled without owner approval workflow
- saved view presets do not preserve selected range and section anchors
- saved view persistence is enabled before role policy and management UI are designed
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
- Scheduled report previews must remain disabled for delivery until persistence, owner approval, and delivery controls are implemented.
- Saved view presets must remain preview-only until persistence, role policy, and management UI are implemented.
- Dashboard group headers must remain static links until collapsible groups or tabs are implemented and validated separately.
- Raw event deletion remains disabled until a separate guarded cleanup job is implemented, cleanup preview evidence is recorded, and production evidence exists.
