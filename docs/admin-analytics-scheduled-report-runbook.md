# Admin analytics scheduled report runbook

This runbook covers the scheduled report configuration-plan, storage-schema, and read-model foundations for `/admin/analytics`.

## Current scope

The current scheduled report implementation is a configuration, inactive storage, and metadata-only read-model contract only.

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
- metadata-only read-model normalization for future stored schedule rows
- allowed cadence and aggregate report type validation
- disabled operator activation even when future approval and active flags are present
- disabled delivery readiness even when future delivery flags are present
- explicit disabled delivery state
- explicit disabled schedule activation state
- activation blockers for future implementation

It does not create active saved schedules, delivery jobs, email sends, timers, queues, background execution, route handlers, repository reads, repository writes, or management UI.

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
16. Confirm the read-model foundation normalizes metadata-only schedule rows.
17. Confirm invalid cadences, missing range queries, and unsupported report types are omitted by the read model.
18. Confirm read-model output keeps operator activation disabled.
19. Confirm read-model output keeps delivery readiness disabled.
20. Confirm activation remains false.
21. Confirm delivery is disabled.
22. Confirm schedule execution remains disabled.
23. Confirm dry-run evidence is listed as a future activation requirement.

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
- read model checked: yes/no
- read model status
- read model metadata-only output checked: yes/no
- read model invalid rows omitted: yes/no
- read model operator activation enabled: must be no
- read model delivery ready: must be no
- owner approval required: must be yes
- owner approved: must be no
- active state enabled: must be no
- delivery enabled: must be no
- schedule execution enabled: must be no
- repository path enabled: must be no
- read endpoint enabled: must be no
- management UI enabled: must be no
- dry-run evidence requirement present: yes/no

## Future delivery requirements

Before enabling actual scheduled delivery, add and validate:

- owner approval capture and disable controls
- repository read/write path with audit evidence
- read endpoint with owner-scoped policy enforcement
- delivery provider or channel plan
- retry and failure visibility
- unsubscribe or disable workflow when delivery uses email
- aggregate-only payload guard
- tests proving delivery can be disabled globally
- dry-run evidence that records the exact CSV paths and selected reporting window

Do not enable delivery until the config-plan evidence, storage-schema evidence, read-model evidence, owner approval workflow, delivery disable switch, and aggregate payload guard are documented.
