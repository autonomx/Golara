# Admin analytics production validation runbook

This runbook validates the admin analytics workspace after deploy. It is intended for owner/admin operators before treating `/admin/analytics` as an operational source of truth.

Use it to validate the production analytics path end to end: database migration, storefront event capture, checkout funnel capture, custom range parity, aggregate exports, customer cohort aggregates, advanced aggregate customer cohort reporting, retention status, cleanup preview evidence, scheduled report owner-only management and preview evidence, saved view evidence, and dashboard group header evidence.

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
- scheduled report owner management, read access, locked recording controls, aggregate dry-run preview, aggregate payload preview, activation-readiness, deterministic schedule planning, disabled worker shell, disabled transport contract, gated delivery executor contract, and retry planning
- saved dashboard view presets, persistence plans, inactive storage schema, and metadata-only read model
- dashboard group headers
- privacy and retention status
- raw-event cleanup preview without deletion

## Preconditions

- Production deployment is live.
- The production database has been migrated.
- The `SiteAnalyticsEvent` table/model is available in production.
- The `AdminAnalyticsScheduledReport` table exists.
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
8. Confirm the cleanup preview card is visible and reports eligible stale-event count, deletion disabled, production evidence status, and preview reason.
9. Visit storefront product and category pages, submit a search, add to cart, start checkout, select a payment method, and complete a staging/test checkout.
10. Return to `/admin/analytics` and choose the preset range that includes the test activity.
11. Confirm site event totals, product/category signals, checkout signals, and business/order analytics appear for the selected range.
12. Confirm customer cohort panels and advanced cohort panels show aggregate data only.
13. Enter a custom `start` and `end` window and confirm dashboard labels, section links, and Business/Site CSV URLs preserve that custom window.
14. Download Business CSV and Site CSV and confirm both contain aggregate rows only.
15. Confirm neither CSV contains visitor session details, full referrer URLs, analytics event payloads, customer names, phone numbers, emails, addresses, raw customer identifiers, or per-customer rows.
16. Open `/admin/analytics/scheduled-reports` as an owner.
17. Confirm the scheduled-report management page is owner-only.
18. Confirm public and staff sessions cannot access scheduled-report management or scheduled-report routes.
19. Confirm locked recording controls target only the three approved recording endpoints.
20. Confirm the read endpoint is owner-only and runtime-gated.
21. Confirm dry-run preview is aggregate-only and requires its runtime preview flag.
22. Confirm payload preview is aggregate-only and requires its runtime preview flag.
23. Confirm activation-readiness requires dry-run evidence, owner approval, kill-switch permission, disable-state validation, repository persistence gates, and delivery-disabled confirmation.
24. Confirm weekly/monthly schedule planning is deterministic and does not register a scheduler.
25. Confirm the worker shell is disabled by default and has no timer, cron, queue, or background registration.
26. Confirm the default transport adapter is disabled and no live provider, email, webhook, or network transport is configured.
27. Confirm delivery execution remains gated and blocked by default unless every required gate and an injected adapter are intentionally provided.
28. Confirm retry planning includes failed delivery records only, caps attempts, is owner-visible, and does not start automatic retry execution.
29. Confirm scheduled-report metadata does not contain per-customer rows, raw event rows, visitor/session identifiers, delivery recipient lists, or export contents.
30. Confirm saved view presets preserve the selected range and existing section anchors.
31. Confirm saved view persistence plans expose allowed scopes, metadata-only required fields, blocked fields, owner approval required, and owner approval not recorded.
32. Confirm the `AdminAnalyticsSavedView` storage schema is present, metadata-only, and defaults owner approval and activation to disabled.
33. Confirm the saved view read model returns metadata-only DTOs, rejects invalid rows, and keeps operator activation disabled.
34. Confirm saved view save/update/remove/read endpoints, active repository access, and management UI remain disabled.
35. Confirm dashboard group headers render for Overview, Business, Site, Products and categories, Operations, and Privacy/docs.
36. Confirm group-header links preserve the selected range, existing section anchors, section index expectations, and table fallback requirements.
37. Confirm collapsible groups and tabbed workspace behavior remain disabled until a separate UI pass.
38. Confirm the cleanup preview does not delete raw events and that deletion remains disabled until production migration evidence and analytics-volume evidence are recorded.

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
- Scheduled report owner management checked:
- Scheduled report public/staff access blocked:
- Scheduled report read endpoint checked:
- Scheduled report locked recording controls checked:
- Scheduled report recording endpoints checked:
- Scheduled report dry-run preview checked:
- Scheduled report dry-run preview aggregate-only:
- Scheduled report payload preview checked:
- Scheduled report payload preview aggregate-only:
- Scheduled report activation-readiness checked:
- Scheduled report schedule planning checked:
- Scheduled report scheduler registered: must be no
- Scheduled report worker shell checked:
- Scheduled report automatic worker registered: must be no
- Scheduled report transport contract checked:
- Scheduled report live transport configured: must be no
- Scheduled report gated delivery executor checked:
- Scheduled report default delivery blocked:
- Scheduled report retry planning checked:
- Scheduled report automatic retry loop registered: must be no
- Scheduled report aggregate-only metadata checked:
- Saved view preset preview checked:
- Saved view persistence plan checked:
- Saved view storage schema checked:
- Saved view read model checked:
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

The analytics page should show aggregate business, site, range, export, customer cohort, advanced cohort, scheduled-report owner-only management/preview/planning/disabled-execution-contract signals, saved-view signals, dashboard group header signals, retention signals, and cleanup-preview signals without exposing non-aggregate visitor or customer detail. Empty panels are acceptable only when the selected range has no matching traffic, orders, or production migration evidence.

## Blockers

Do not treat analytics as source-of-truth if any of these are true:

- the site analytics table is missing in production
- storefront events are not being stored
- checkout funnel events are missing after a test checkout
- owner CSV exports fail or contain no expected aggregate rows
- selected range labels, section links, and CSV URLs disagree
- customer cohort panels or exports expose per-customer detail
- advanced cohort panels or CSV exports expose names, phones, emails, addresses, raw identifiers, or per-customer rows
- scheduled report owner-only routes are accessible to public or staff sessions
- scheduled report previews or payloads expose per-customer rows, raw event rows, visitor/session identifiers, delivery recipient lists, or export contents
- scheduled report recording controls target anything other than the approved recording endpoints
- scheduled report activation readiness bypasses dry-run evidence, owner approval, kill-switch permission, disable-state validation, or delivery-disabled confirmation
- scheduled report schedule planning registers a scheduler, timer, queue, or background job
- scheduled report worker shell runs automatically by default
- scheduled report transport contract configures a live transport by default
- scheduled report delivery execution can run without every required gate and an intentionally injected adapter
- scheduled report retry planning creates an automatic or unbounded retry loop
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
- Scheduled reports are partially production-ready for owner-only management, preview, planning, disabled execution contracts, and retry visibility. They are not production-ready for automatic scheduling or live delivery until a future audited transport and scheduler enablement slice passes exact-head validation.
