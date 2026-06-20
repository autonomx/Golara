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
- Scheduled report owner-only management is available and public/staff access is blocked.
- Scheduled report read and recording endpoints remain owner-only and runtime-gated.
- Scheduled report locked controls target only the approved recording endpoints.
- Scheduled report dry-run preview remains aggregate-only and requires its preview flag.
- Scheduled report payload preview remains aggregate-only and requires its preview flag.
- Scheduled report activation-readiness requires dry-run evidence, owner approval, kill-switch permission, disable-state validation, repository persistence gates, and delivery-disabled confirmation.
- Scheduled report weekly/monthly schedule planning is deterministic and does not register a scheduler.
- Scheduled report worker shell is disabled by default and has no timer, cron, queue, or background registration.
- Scheduled report default transport adapter is disabled and no live provider, email, webhook, or network transport is configured.
- Scheduled report delivery execution is gated and blocked by default unless every required gate and an injected adapter are intentionally provided.
- Scheduled report retry planning includes failed delivery records only, caps attempts, is owner-visible, and does not start automatic retry execution.
- Scheduled report metadata does not contain per-customer rows, raw event rows, visitor/session identifiers, delivery recipient lists, or export contents.
- Saved view presets preserve the selected range and existing section anchors.
- Saved view persistence plans expose allowed scopes, metadata-only required fields, blocked fields, owner approval required, and owner approval not recorded.
- Saved view storage schema exists for metadata-only records and keeps owner approval plus active state disabled by default.
- Saved view read model returns metadata-only DTOs and keeps operator activation disabled.
- Saved view save/update/remove/read endpoints, active repository access, and management UI remain disabled.
- The site analytics event table is available in production.
- Storefront product, category, search, cart, checkout, payment method, and order-confirmation activity appears in the selected range.
- Business/order charts update after eligible checkout orders exist.
- Product and category sales panels update after eligible order lines exist.
- Aggregate customer cohort panels update after eligible customer-linked orders exist.
- Advanced cohort panels show aggregate AOV/share, known-customer order-count band, and recency band charts.
- Business CSV and Site CSV download successfully.
- CSV exports contain aggregate rows only.
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
- Scheduled report owner management checked:
- Scheduled report public/staff access blocked:
- Scheduled report read endpoint checked:
- Scheduled report locked controls checked:
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
- Saved view allowed scopes checked:
- Saved view metadata-only fields checked:
- Saved view blocked fields checked:
- Saved view owner approval required:
- Saved view active flag disabled:
- Saved view read model operator activation disabled:
- Saved view endpoints disabled:
- Saved view management UI disabled:
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

## Safety expectations

Analytics exports must stay aggregate-only. Scheduled reports are partially production-ready for owner-only management, preview, planning, disabled execution contracts, and retry visibility. They are not production-ready for automatic scheduling or live delivery until a future audited transport and scheduler enablement slice passes exact-head validation. Saved view foundations must stay inactive until owner approval recording, role policy, endpoints, active repository access, and management UI exist. Dashboard group headers should stay static until collapsible groups or tabs are validated separately. Raw event cleanup should remain preview-only until a separate guarded cleanup process is shipped after production evidence exists.
