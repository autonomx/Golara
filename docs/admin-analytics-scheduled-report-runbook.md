# Admin analytics scheduled report runbook

This runbook covers the scheduled report configuration-plan, storage-schema, Prisma mapping-contract, read-model, repository-read contract, and read-adapter foundations for `/admin/analytics`.

## Current scope

The current scheduled report implementation is a configuration, inactive storage, Prisma mapping-contract, metadata-only read-model, repository-read contract, and read-adapter foundation only.

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

It does not create active saved schedules, delivery jobs, email sends, timers, queues, background execution, route handlers, generated Prisma client access, Prisma repository wiring, repository writes, or management UI.

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
17. Confirm generated Prisma client access remains disabled.
18. Confirm the read-model foundation normalizes metadata-only schedule rows.
19. Confirm invalid cadences, missing range queries, and unsupported report types are omitted by the read model.
20. Confirm read-model output keeps operator activation disabled.
21. Confirm read-model output keeps delivery readiness disabled.
22. Confirm the repository-read contract exposes metadata-only select fields.
23. Confirm the repository-read contract requires owner approval, active state, and delivery disabled filters before any future read path.
24. Confirm the read adapter builds the same owner-approved, active, delivery-disabled query args.
25. Confirm the read adapter caps rows and normalizes aggregate-only report types.
26. Confirm the read adapter keeps operator activation disabled.
27. Confirm the read adapter keeps delivery readiness disabled.
28. Confirm active repository wiring remains disabled.
29. Confirm activation remains false.
30. Confirm delivery is disabled.
31. Confirm schedule execution remains disabled.
32. Confirm dry-run evidence is listed as a future activation requirement.

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
- Prisma mapping generated-client access enabled: must be no
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
- generated Prisma client access with audit evidence and the required metadata-only filters
- repository write path with owner-managed approval and disable controls
- read endpoint with owner-scoped policy enforcement
- delivery provider or channel plan
- retry and failure visibility
- unsubscribe or disable workflow when delivery uses email
- aggregate-only payload guard
- tests proving delivery can be disabled globally
- dry-run evidence that records the exact CSV paths and selected reporting window

Do not enable delivery until the config-plan evidence, storage-schema evidence, Prisma mapping evidence, read-model evidence, repository-read contract evidence, read-adapter evidence, owner approval workflow, delivery disable switch, and aggregate payload guard are documented.
