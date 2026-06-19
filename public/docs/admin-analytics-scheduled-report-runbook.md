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
- metadata-only persisted fields for selected range, report types, owner approval, active state, delivery state, and dry-run summary
- metadata-only read-model normalization for future stored schedule rows
- allowed cadence and aggregate report type validation
- disabled operator activation and delivery readiness
- explicit disabled delivery state
- explicit disabled schedule activation state

It does not save active schedules, expose read routes, or send reports.

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
13. Confirm the read model normalizes metadata-only schedule rows.
14. Confirm invalid cadences, missing range queries, and unsupported report types are omitted.
15. Confirm operator activation and delivery readiness remain disabled.
16. Confirm activation remains disabled.
17. Confirm delivery is disabled.
18. Confirm schedule execution is disabled.

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
- read model checked: yes/no
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
- dry-run evidence requirement present: yes/no

## Future delivery requirements

Before enabling actual scheduled delivery, add and validate:

- owner approval and disable controls
- repository path with audit evidence
- read endpoint with owner-scoped policy enforcement
- delivery provider or channel plan
- retry and failure visibility
- aggregate-only payload guard
- tests proving delivery can be disabled globally
- dry-run evidence for the exact CSV paths and selected reporting window

Do not enable delivery until config-plan evidence, storage-schema evidence, read-model evidence, and owner approval workflow are documented.
