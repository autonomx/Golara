# Admin analytics production validation runbook

Use this checklist after deployment before relying on `/admin/analytics` for operational reporting.

## What to validate

- The Analytics page opens in the shared admin shell.
- Range controls are available for 7, 30, 90, and 365 days.
- Custom start/end date fields are available.
- The selected range label matches the dashboard window being reviewed.
- Section links preserve the selected preset or custom range.
- Dashboard group headers render for Overview, Business, Site, Products and categories, Operations, and Privacy/docs.
- Dashboard group links preserve the selected range and existing section anchors.
- Collapsible groups and tabbed workspace behavior remain disabled until a separate UI pass.
- Owner sessions can see aggregate CSV exports.
- Business CSV and Site CSV URLs preserve the selected range.
- Scheduled report previews preserve the selected range and aggregate Business/Site CSV paths.
- Scheduled report delivery and schedule persistence remain disabled.
- Saved view presets preserve the selected range and existing section anchors.
- Saved view persistence and client/server saved state remain disabled.
- The site analytics event table is available in production.
- Storefront product, category, search, cart, checkout, payment method, and order-confirmation activity appears in the selected range.
- Business/order charts update after eligible checkout orders exist.
- Product and category sales panels update after eligible order lines exist.
- Aggregate customer cohort panels update after eligible customer-linked orders exist.
- Advanced cohort panels show aggregate AOV/share, known-customer order-count band, and recency band charts.
- Business CSV and Site CSV download successfully.
- CSV exports contain aggregate rows only.
- Customer cohort CSV rows remain aggregate-only for guest, known, first-time, and returning-customer buckets.
- Advanced cohort CSV rows remain aggregate-only for AOV/share buckets, known-customer order-count bands, and recency bands.
- Visitor session details, full referrer URLs, analytics event payloads, customer names, phone numbers, emails, addresses, raw customer identifiers, and per-customer rows are not exported.
- Retention status can read event counts and stale-event counts.
- Cleanup preview reports eligible stale-event count, deletion disabled, production evidence status, and preview reason.
- Cleanup preview does not delete raw events.

## Evidence record

Record one validation note per pass:

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

## If a panel is empty

An empty panel is acceptable when the selected range has no matching traffic, orders, sales, or customer-linked orders. It is not acceptable if validation traffic and orders were created inside the selected range and the production event table is available.

## Privacy expectations

Analytics must stay first-party and aggregate-only. Admin and API routes should not be tracked, browser Do Not Track should be respected, advanced cohort reporting should remain limited to aggregate AOV/share/order-count/recency buckets, scheduled report delivery should remain disabled until owner approval and delivery controls exist, saved view presets should remain preview-only until persistence and role policy exist, dashboard group headers should stay static until collapsible groups or tabs are validated separately, and raw event cleanup should remain preview-only until a separate guarded cleanup process is shipped after production evidence exists.
