# Admin analytics scheduled report runbook

This runbook covers the scheduled report configuration-plan, storage-schema, applied Prisma schema mapping, checked Prisma schema fragment, generated-client type visibility, read-model, repository-read contract, and read-adapter foundations for `/admin/analytics`.

## Current scope

The current scheduled report implementation is a configuration, inactive storage, applied Prisma schema mapping, checked Prisma schema fragment, generated-client type visibility, metadata-only read-model, repository-read contract, and read-adapter foundation only.

It defines:

- weekly owner report preview
- monthly owner report preview
- selected analytics range metadata
- aggregate Business CSV path
- aggregate Site CSV path
- owner-approval requirement metadata
- draft-only weekly and monthly configuration plans
- inactive `AdminAnalyticsScheduledReport` storage table for future schedule metadata
- metadata-only persisted fields for report key, cadence, selected range query, report types, owner approval, active state, delivery state, and dry-run summary
- Prisma model-block contract for the scheduled-report table fields, defaults, JSON columns, and indexes
- checked `prisma/schema.admin-analytics-scheduled-report.prisma` fragment that exactly matches the guarded model block
- `prisma/schema.prisma` model mapping that exactly matches the checked fragment
- generated-client model type visibility for the repository adapter's injected-reader boundary
- metadata-only read-model normalization for future stored schedule rows
- repository-read query-plan metadata for future safe reads
- a read adapter that accepts a future repository reader and applies the same safe query args
- required future read filters for owner approval, active state, and delivery disabled state
- safe future select fields limited to schedule metadata
- allowed cadence and aggregate report type validation
- disabled operator activation even when future approval and active flags are present
- disabled delivery readiness even when future delivery flags are present
- explicit disabled delivery state
- explicit disabled schedule activation state
- activation blockers for future implementation

It does not create active saved schedules, delivery jobs, email sends, timers, queues, background execution, route handlers, runtime application access through the generated Prisma client, active Prisma repository wiring, repository writes, or management UI. The `schema.prisma` model mapping is applied, the generated model type is visible to the adapter boundary, and runtime repository access remains disabled.

## Validation steps

1. Open `/admin/analytics` as an owner.
2. Select a preset range and record the selected range label.
3. Select a custom `start` and `end` date and record the selected range label.
4. Build or inspect the scheduled report preview for the selected range.
5. Confirm the Business CSV path preserves the selected range query.
6. Confirm the Site CSV path preserves the selected range query.
7. Confirm weekly and monthly report options both use aggregate Business/Site report types.
8. Confirm weekly and monthly config plans are draft-only.
9. Confirm owner approval is required and not yet recorded.
10. Confirm the config plans preserve the selected range query.
11. Confirm the `AdminAnalyticsScheduledReport` migration table exists before future activation work begins.
12. Confirm schedule storage fields are metadata-only.
13. Confirm owner approval defaults to disabled.
14. Confirm active state defaults to disabled.
15. Confirm delivery state defaults to disabled.
16. Confirm the Prisma mapping contract lists the future model fields, JSON columns, defaults, and indexes.
17. Confirm the checked Prisma schema fragment exactly matches the guarded model block.
18. Confirm the `schema.prisma` model mapping exactly matches the checked fragment.
19. Confirm generated Prisma client model type visibility is present for the injected reader boundary.
20. Confirm generated Prisma client runtime access remains disabled.
21. Confirm the read-model foundation normalizes metadata-only schedule rows.
22. Confirm invalid cadences, missing range queries, and unsupported report types are omitted by the read model.
23. Confirm read-model output keeps operator activation disabled.
24. Confirm read-model output keeps delivery readiness disabled.
25. Confirm the repository-read contract exposes metadata-only select fields.
26. Confirm the repository-read contract requires owner approval, active state, and delivery disabled filters before any future read path.
27. Confirm the read adapter builds the same owner-approved, active, delivery-disabled query args.
28. Confirm the read adapter caps rows and normalizes aggregate-only report types.
29. Confirm the read adapter keeps operator activation disabled.
30. Confirm the read adapter keeps delivery readiness disabled.
31. Confirm active repository wiring remains disabled.
32. Confirm activation remains false.
33. Confirm delivery is disabled.
34. Confirm schedule execution remains disabled.
35. Confirm dry-run evidence is listed as a future activation requirement.

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
- storage table name
- storage metadata-only fields checked: yes/no
- Prisma mapping contract checked: yes/no
- Prisma schema fragment checked: yes/no
- Prisma schema fragment matches guarded model block: yes/no
- `schema.prisma` model matches checked fragment: yes/no
- generated-client model type visible: yes/no
- generated-client runtime access enabled: must be no
- read model checked: yes/no
- read model status
- read model metadata-only output checked: yes/no
- read model invalid rows omitted: yes/no
- read model operator activation enabled: must be no
- read model delivery ready: must be no
- repository-read contract checked: yes/no
- repository-read contract status
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
- management UI enabled: must be no
- dry-run evidence requirement present: yes/no

## Future delivery requirements

Before enabling actual scheduled delivery, add and validate:

- owner approval capture and disable controls
- generated Prisma client runtime access with audit evidence and the required metadata-only filters
- repository write path with owner-managed approval and disable controls
- read endpoint with owner-scoped policy enforcement
- delivery provider or channel plan
- retry and failure visibility
- unsubscribe or disable workflow when delivery uses email
- aggregate-only payload guard
- tests proving delivery can be disabled globally
- dry-run evidence that records the exact CSV paths and selected reporting window

Do not enable delivery until the config-plan evidence, storage-schema evidence, Prisma mapping evidence, checked schema-fragment evidence, generated-type evidence, read-model evidence, repository-read contract evidence, read-adapter evidence, owner approval workflow, delivery disable switch, and aggregate payload guard are documented.
