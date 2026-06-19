# Admin analytics backlog

This page summarizes remaining Analytics improvements.

## Live now

- Dedicated Analytics admin page.
- Range presets for 7, 30, 90, and 365 days.
- Validated custom start and end dates using the same resolved range for dashboard panels, section links, comparisons, and CSV exports.
- Business, order, product, category, payment, fulfillment, discount, customer cohort, and site analytics.
- First-party storefront event reporting.
- Aggregate CSV exports.
- Scheduled report preview foundation for weekly/monthly owner report options using the selected range and aggregate CSV paths.
- Saved dashboard view preset preview foundation using the selected range and existing section anchors.
- Dashboard group header UI using the selected range and existing section anchors.
- Privacy and retention guidance.
- Read-only retention status and cleanup preview.

## Planned next

- Production validation evidence for custom ranges, exports, aggregate cohort panels, retention preview, scheduled report previews, saved view presets, and dashboard group headers.
- Retention maintenance workflow.
- Advanced aggregate customer cohort reporting.
- Scheduled report persistence and delivery.
- Saved dashboard view persistence.
- Collapsible dashboard groups or tabs, only if static group headers are not enough.

## Export safety

Analytics exports remain aggregate-only.

## Scheduled report safety

Scheduled report previews are not delivery jobs. They preserve the selected range and aggregate CSV paths without saving schedules or sending reports.

## Saved view safety

Saved view presets are preview-only. They preserve the selected range and existing section anchors without saving view state or changing analytics calculations.

## Layout refinement safety

Dashboard group headers are static links generated from the layout contract. They preserve selected range links, the existing section index, anchors, and accessible chart table fallback requirements without enabling collapsible groups or tabs.
