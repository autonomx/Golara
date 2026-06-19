# Admin analytics scheduled report runbook

This runbook covers the scheduled report configuration-plan, storage-schema, Prisma mapping-contract, checked Prisma schema fragment, read-model, repository-read contract, and read-adapter foundations for `/admin/analytics`.

## Current scope

The current scheduled report implementation is configuration, inactive storage, Prisma mapping-contract, checked Prisma schema fragment, metadata-only read-model, repository-read contract, and read-adapter foundation only.

It defines:

- weekly owner report preview
- monthly owner report preview
- selected analytics range metadata
- aggregate Business CSV path
- aggregate Site CSV path
- owner-approval requirement metadata
- draft-only weekly and monthly configuration plans
- inactive `AdminAnalyticsScheduledReport` storage table for future schedule metadata
- metadata-only persisted fields for selected range, report types, owner approval, active state, delivery state, and dry-run summary
- Prisma model-block contract for the future table fields, JSON columns, defaults, and indexes
- checked `prisma/schema.admin-analytics-scheduled-report.prisma` fragment that exactly matches the guarded model block
- metadata-only read-model normalization for future stored schedule rows
- metadata-only repository-read query-plan fields
- a read adapter that applies the same safe query args to a future reader
- required future read filters for owner approval, active state, and delivery disabled state
- allowed cadence and aggregate report type validation
- disabled operator activation and delivery readiness
- explicit disabled delivery state
- explicit disabled schedule activation state

It does not save active schedules, expose read routes, enable generated Prisma client access, wire active repository access, run active reads, or send reports. The checked schema fragment is not yet applied to `prisma/schema.prisma`.

## Validation steps

1. Open `/admin/analytics` as an owner.
2. Select a preset range and record the selected range label.
3. Select a custom `start` and `end` date and record the selected range label.
4. Inspect the scheduled report preview for the selected range.
5. Confirm the Business CSV path preserves the selected range query.
6. Confirm the Site CSV path preserves the selected range query.
7. Confirm weekly and monthly report options both use aggregate Business/Site report types.
8. Confirm weekly and monthly config plans are draft-only.
9. Confirm owner approval is required and not yet recorded.
10. Confirm the `AdminAnalyticsScheduledReport` migration table exists before future activation work begins.
11. Confirm schedule storage fields are metadata-only.
12. Confirm owner approval, active state, and delivery state default to disabled.
13. Confirm the Prisma mapping contract lists future fields, JSON columns, defaults, and indexes.
14. Confirm the checked Prisma schema fragment exactly matches the guarded model block.
15. Confirm generated Prisma client access remains disabled.
16. Confirm the read model normalizes metadata-only schedule rows.
17. Confirm invalid cadences, missing range queries, and unsupported report types are omitted.
18. Confirm operator activation and delivery readiness remain disabled.
19. Confirm the repository-read contract exposes metadata-only select fields.
20. Confirm the repository-read contract requires owner approval, active state, and delivery disabled filters.
21. Confirm the read adapter builds the same safe query args.
22. Confirm the read adapter keeps operator activation and delivery readiness disabled.
23. Confirm active repository wiring remains disabled.
24. Confirm activation remains disabled.
25. Confirm delivery is disabled.
26. Confirm schedule execution is disabled.

## Evidence record

For each validation run, record:

- reviewer
- environment
- validation date
- selected range label
- selected range query
- Business CSV preview path
- Site CSV preview path
- weekly preview present: yes/no
- monthly preview present: yes/no
- weekly config plan status
- monthly config plan status
- storage table present: yes/no
- storage metadata-only fields checked: yes/no
- Prisma mapping contract checked: yes/no
- Prisma schema fragment checked: yes/no
- Prisma schema fragment matches guarded model block: yes/no
- Prisma mapping generated-client access enabled: must be no
- read model checked: yes/no
- read model metadata-only output checked: yes/no
- read model invalid rows omitted: yes/no
- read model operator activation enabled: must be no
- read model delivery ready: must be no
- repository-read contract checked: yes/no
- repository-read select fields metadata-only: yes/no
- repository-read required filters checked: yes/no
- read adapter checked: yes/no
- read adapter query args checked: yes/no
- read adapter operator activation enabled: must be no
- read adapter delivery ready: must be no
- active repository wiring enabled: must be no
- repository writes enabled: must be no
- owner approval required: must be yes
- owner approved: must be no
- active state enabled: must be no
- delivery enabled: must be no
- schedule execution enabled: must be no
- read endpoint enabled: must be no
- dry-run evidence requirement present: yes/no

## Future delivery requirements

Before enabling actual scheduled delivery, add and validate:

- owner approval and disable controls
- generated Prisma client access with required filters
- repository write path with owner-managed controls
- read endpoint with owner-scoped policy enforcement
- delivery provider or channel plan
- retry and failure visibility
- aggregate-only payload guard
- tests proving delivery can be disabled globally
- dry-run evidence for the exact CSV paths and selected reporting window

Do not enable delivery until config-plan evidence, storage-schema evidence, Prisma mapping evidence, checked schema-fragment evidence, read-model evidence, repository-read contract evidence, read-adapter evidence, and owner approval workflow are documented.
