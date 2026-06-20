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
- Scheduled report previews and config plans preserve the selected range and aggregate Business/Site CSV paths.
- Scheduled report config plans are draft-only, owner-only, inactive, and require owner approval.
- Scheduled report storage schema exists for metadata-only records and keeps owner approval, active state, and delivery state disabled by default.
- Scheduled report read model returns metadata-only DTOs, rejects invalid rows, keeps operator activation disabled, and keeps delivery readiness disabled.
- Scheduled report repository-read contract defines metadata-only fields and required future owner-approved, active-state, and delivery-disabled filters.
- Scheduled report owner-approval policy requires owner role, selected-range evidence, aggregate-only report types, dry-run evidence, global disable control evidence, and delivery-disabled confirmation.
- Scheduled report global kill-switch policy requires disable-control ownership, control location, safe default state, owner override policy, dry-run evidence, rollback procedure, and audit log destination.
- Scheduled report dry-run evidence policy requires evidence id, timestamp, selected range, aggregate report types, Business/Site CSV preview paths, global disable confirmation, owner approval confirmation, delivery-disabled confirmation, and reviewer identity.
- Scheduled report dry-run evidence recording, global state recording, owner override, delivery, execution, active repository access, endpoints, approval recording, and management UI remain disabled.
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
- Scheduled report owner-approval policy checked:
- Scheduled report owner approval recording enabled:
- Scheduled report owner role requirement present:
- Scheduled report aggregate-only report type requirement present:
- Scheduled report global disable control requirement present:
- Scheduled report global kill-switch policy checked:
- Scheduled report global disable state recording enabled:
- Scheduled report global disable safe default state:
- Scheduled report owner override enabled:
- Scheduled report rollback procedure requirement present:
- Scheduled report audit log destination requirement present:
- Scheduled report dry-run evidence policy checked:
- Scheduled report dry-run evidence recording enabled:
- Scheduled report dry-run evidence id requirement present:
- Scheduled report dry-run timestamp requirement present:
- Scheduled report dry-run selected range requirement present:
- Scheduled report dry-run Business/Site CSV preview path requirements present:
- Scheduled report dry-run global disable confirmation requirement present:
- Scheduled report dry-run owner approval confirmation requirement present:
- Scheduled report dry-run delivery-disabled confirmation requirement present:
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

Analytics exports must stay aggregate-only. Scheduled report config, storage, read model, repository-read contract, owner-approval policy, global kill-switch policy, and dry-run evidence policy must stay inactive until owner approval recording, dry-run evidence recording, delivery controls, global disable controls, rollback procedure, and active management paths exist. Saved view foundations must stay inactive until owner approval recording, role policy, endpoints, active repository access, and management UI exist. Dashboard group headers should stay static until collapsible groups or tabs are validated separately. Raw event cleanup should remain preview-only until a separate guarded cleanup process is shipped after production evidence exists.
