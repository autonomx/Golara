# Admin analytics production validation runbook

This runbook validates the admin analytics workspace after deploy. It is intended for owner/admin operators before treating `/admin/analytics` as an operational source of truth.

Use it to validate the production analytics path end to end: database migration, storefront event capture, checkout funnel capture, custom range parity, aggregate exports, customer cohort aggregates, and retention status.

## Scope

Validate that the analytics page can show trustworthy aggregate data for:

- business/order analytics
- site analytics events
- checkout funnel events
- product and category sales
- custom preset and start/end date ranges
- aggregate customer cohort metrics
- aggregate CSV exports
- privacy and retention status

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
9. Visit storefront product and category pages.
10. Submit a catalog search.
11. Submit an add-to-cart flow.
12. Start checkout.
13. Select a payment method.
14. Complete a checkout in staging/test mode or with an approved manual/cash method.
15. Return to `/admin/analytics` and choose the preset range that includes the test activity.
16. Record the selected range label shown on the page.
17. Confirm site event totals increase.
18. Confirm product views, category views, add-to-cart, checkout started, payment method selected, and checkout completed signals appear where expected.
19. Confirm business/order analytics update after eligible orders exist.
20. Confirm aggregate customer cohort panels update after eligible customer-linked orders exist.
21. Enter a custom `start` and `end` window that includes the same activity.
22. Confirm dashboard labels, section links, and Business/Site CSV URLs preserve that custom window.
23. Download Business CSV and confirm aggregate business rows exist for the selected window.
24. Download Site CSV and confirm aggregate site/funnel rows exist for the selected window.
25. Confirm Business CSV includes only aggregate customer cohort rows for guest, known, first-time, and returning-customer buckets.
26. Confirm neither CSV contains visitor session details, full referrer URLs, analytics event payloads, customer names, phone numbers, emails, or per-customer rows.

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
- Retention status checked:
- Result: pass / fail / blocked
- Follow-up issue or PR:

## Expected result

The analytics page should show aggregate business, site, range, export, and customer cohort signals without exposing non-aggregate visitor or customer detail. Empty panels are acceptable only when the selected range has no matching traffic, orders, or production migration evidence.

## Blockers

Do not treat analytics as source-of-truth if any of these are true:

- the site analytics table is missing in production
- storefront events are not being stored
- checkout funnel events are missing after a test checkout
- owner CSV exports fail or contain no expected aggregate rows
- selected range labels, section links, and CSV URLs disagree
- customer cohort panels or exports expose per-customer detail
- retention status cannot read the event table
- Do Not Track or analytics disable behavior is not respected

## Notes

- Exports must stay aggregate-only.
- Customer cohort reporting must remain aggregate-only and privacy-safe.
- Raw event deletion remains disabled until a separate guarded cleanup job is implemented and production evidence exists.