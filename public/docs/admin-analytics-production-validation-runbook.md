# Admin analytics production validation runbook

Use this checklist after deployment before relying on `/admin/analytics` for operational reporting.

## What to validate

- The Analytics page opens in the shared admin shell.
- Range controls are available for 7, 30, 90, and 365 days.
- Owner sessions can see aggregate CSV exports.
- The site analytics event table is available in production.
- Storefront product, category, search, cart, checkout, payment method, and order-confirmation activity appears in the selected range.
- Business/order charts update after eligible checkout orders exist.
- Product and category sales panels update after eligible order lines exist.
- Business CSV and Site CSV download successfully.
- CSV exports contain aggregate rows only.
- Raw visitor sessions, full referrer URLs, and raw analytics event payloads are not exported.
- Retention status can read raw event counts and stale-event counts.

## If a panel is empty

An empty panel is acceptable when the selected range has no matching traffic, orders, or sales. It is not acceptable if validation traffic and orders were created inside the selected range and the production event table is available.

## Privacy expectations

Analytics must stay first-party and aggregate-only. Admin and API routes should not be tracked, browser Do Not Track should be respected, and raw event cleanup should not be enabled until a separate guarded cleanup process is shipped.
