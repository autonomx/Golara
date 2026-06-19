# Admin analytics production validation runbook

This runbook validates the admin analytics workspace after deploy. It is intended for owner/admin operators before treating `/admin/analytics` as an operational source of truth.

Use it to validate the production analytics path end to end: database migration, storefront event capture, checkout funnel capture, aggregate exports, and retention status.

## Scope

Validate that the analytics page can show trustworthy aggregate data for:

- business/order analytics
- site analytics events
- checkout funnel events
- product and category sales
- aggregate CSV exports
- privacy and retention status

## Preconditions

- Production deployment is live.
- The production database has been migrated.
- The `SiteAnalyticsEvent` table/model is available in production.
- Admin owner access is available.
- Storefront analytics is not disabled with `NEXT_PUBLIC_SITE_ANALYTICS_ENABLED=false`.
- The storefront can receive realistic visits or staging checkout traffic.

## Validation steps

1. Open `/admin/analytics` as an owner.
2. Confirm the analytics page loads with the shared admin sidebar.
3. Confirm the selected range controls include 7, 30, 90, and 365 days.
4. Confirm the role banner shows owner controls.
5. Confirm Business CSV and Site CSV links are visible.
6. Confirm raw-event retention status is visible.
7. Confirm the retention panel does not report a missing site analytics table after production migration.
8. Visit storefront product and category pages.
9. Submit a catalog search.
10. Submit an add-to-cart flow.
11. Start checkout.
12. Select a payment method.
13. Complete a checkout in staging/test mode or with an approved manual/cash method.
14. Return to `/admin/analytics` and choose the selected range that includes the test activity.
15. Confirm site event totals increase.
16. Confirm product views, category views, add-to-cart, checkout started, payment method selected, and checkout completed signals appear where expected.
17. Confirm business/order analytics update after eligible orders exist.
18. Download Business CSV and confirm aggregate business rows exist.
19. Download Site CSV and confirm aggregate site/funnel rows exist.
20. Confirm neither CSV contains raw visitor sessions, full referrer URLs, or raw event payloads.

## Expected result

The analytics page should show aggregate business and site signals without exposing raw visitor/session data. Empty panels are acceptable only when the selected range has no matching traffic, orders, or production migration evidence.

## Blockers

Do not treat analytics as source-of-truth if any of these are true:

- the site analytics table is missing in production
- storefront events are not being stored
- checkout funnel events are missing after a test checkout
- owner CSV exports fail or contain no expected aggregate rows
- retention status cannot read the raw event table
- Do Not Track or analytics disable behavior is not respected

## Notes

- Exports must stay aggregate-only.
- Raw event deletion remains disabled until a separate guarded cleanup job is implemented and production evidence exists.
- Customer-level analytics must remain aggregate-only and privacy-safe before implementation.
