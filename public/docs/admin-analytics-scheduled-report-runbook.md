# Admin analytics scheduled report runbook

This runbook covers the scheduled report configuration-plan, storage-schema, applied Prisma schema mapping, checked Prisma schema fragment, generated-client type visibility, read-model, repository-read contract, read-adapter, and disabled Prisma reader-factory foundations for `/admin/analytics`.

## Current scope

The current scheduled report implementation is configuration, inactive storage, applied Prisma schema mapping, checked Prisma schema fragment, generated-client type visibility, metadata-only read-model, repository-read contract, read-adapter, and disabled Prisma reader-factory foundation only.

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
- `prisma/schema.prisma` model mapping that exactly matches the checked fragment
- generated-client model type visibility for the injected-reader boundary
- metadata-only read-model normalization for future stored schedule rows
- metadata-only repository-read query-plan fields
- a read adapter that applies the same safe query args to a future reader
- a disabled Prisma reader-factory contract that names the future delegate and returns no reader while runtime access remains disabled
- required future read filters for owner approval, active state, and delivery disabled state
- allowed cadence and aggregate report type validation
- disabled operator activation and delivery readiness
- explicit disabled delivery state
- explicit disabled schedule activation state

It does not save active schedules, expose read routes, enable runtime application access through the generated Prisma client, wire active repository access, run active reads, add schedule execution, send reports, or add owner management UI. The `schema.prisma` model mapping is applied, the generated model type is visible to the adapter boundary, and the disabled reader factory returns no reader until runtime repository access is explicitly enabled in a later audited slice.

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
15. Confirm the `schema.prisma` model mapping exactly matches the checked fragment.
16. Confirm generated-client model type visibility is present for the injected reader boundary.
17. Confirm generated-client runtime access remains disabled.
18. Confirm the read model normalizes metadata-only schedule rows.
19. Confirm invalid cadences, missing range queries, and unsupported report types are omitted.
20. Confirm operator activation and delivery readiness remain disabled.
21. Confirm the repository-read contract exposes metadata-only select fields.
22. Confirm the repository-read contract requires owner approval, active state, and delivery disabled filters.
23. Confirm the read adapter builds the same safe query args.
24. Confirm the read adapter keeps operator activation and delivery readiness disabled.
25. Confirm the disabled Prisma reader factory is available and returns no reader.
26. Confirm active repository wiring remains disabled.
27. Confirm activation remains disabled.
28. Confirm delivery is disabled.
29. Confirm schedule execution is disabled.

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
- `schema.prisma` model matches checked fragment: yes/no
- generated-client model type visible: yes/no
- generated-client runtime access enabled: must be no
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
- disabled Prisma reader factory checked: yes/no
- disabled Prisma reader factory returned reader: must be no
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
- generated Prisma client runtime access with required filters
- repository write path with owner-managed controls
- read endpoint with owner-scoped policy enforcement
- delivery provider or channel plan
- retry and failure visibility
- aggregate-only payload guard
- tests proving delivery can be disabled globally
- dry-run evidence for the exact CSV paths and selected reporting window

Do not enable delivery until config-plan evidence, storage-schema evidence, Prisma mapping evidence, checked schema-fragment evidence, generated-type evidence, read-model evidence, repository-read contract evidence, read-adapter evidence, disabled reader-factory evidence, and owner approval workflow are documented.
