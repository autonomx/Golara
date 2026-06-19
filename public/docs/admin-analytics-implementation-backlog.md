# Admin analytics backlog

This page summarizes remaining Analytics improvements.

## Live now

- Dedicated Analytics admin page.
- Range presets for 7, 30, 90, and 365 days.
- Validated custom start and end dates using the same resolved range for dashboard panels, section links, comparisons, and CSV exports.
- Business, order, product, category, payment, fulfillment, discount, customer cohort, and site analytics.
- First-party storefront event reporting.
- Aggregate CSV exports.
- Scheduled report preview, draft configuration-plan, inactive storage-schema, and metadata-only read-model foundation for weekly/monthly owner report options using the selected range and aggregate CSV paths.
- Saved dashboard view preset, persistence-plan, inactive storage-schema, and metadata-only read-model foundation using the selected range, existing section anchors, allowed scopes, and metadata-only future-save rules.
- Dashboard group header UI using the selected range and existing section anchors.
- Privacy and retention guidance.
- Read-only retention status and cleanup preview.

## Planned next

- Production validation evidence for custom ranges, exports, aggregate cohort panels, retention preview, scheduled report storage/read-model, saved view storage/read-model, and dashboard group headers.
- Retention maintenance workflow.
- Scheduled report active repository paths and delivery execution.
- Saved dashboard view active persistence.
- Collapsible dashboard groups or tabs, only if static group headers are not enough.

## Export safety

Analytics exports remain aggregate-only.

## Scheduled report safety

Scheduled report config plans, inactive storage schema, and metadata-only read model preserve the selected range and aggregate CSV paths. They require owner approval but do not activate schedules, expose read routes, or send reports yet.

## Saved view safety

Saved view presets, persistence plans, inactive storage table, and metadata-only read model preserve the selected range, existing section anchors, allowed scopes, and metadata-only future-save rules. Active save/update/remove/read endpoints, active repository access, and management UI remain disabled.

## Layout refinement safety

Dashboard group headers are static links generated from the layout contract. They preserve selected range links, the existing section index, anchors, and accessible chart table fallback requirements without enabling collapsible groups or tabs.
