# Admin analytics scheduled report runbook

This runbook covers the scheduled report configuration-plan and storage-schema foundations for `/admin/analytics`.

## Current scope

The current scheduled report implementation is a configuration and inactive storage contract only.

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
- explicit disabled delivery state
- explicit disabled schedule activation state

It does not save active schedules or send reports.

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
13. Confirm activation remains disabled.
14. Confirm delivery is disabled.
15. Confirm schedule execution is disabled.

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
- owner approval required: must be yes
- owner approved: must be no
- active state enabled: must be no
- delivery enabled: must be no
- schedule execution enabled: must be no
- dry-run evidence requirement present: yes/no

## Future delivery requirements

Before enabling actual scheduled delivery, add and validate:

- owner approval and disable controls
- repository path with audit evidence
- delivery provider or channel plan
- retry and failure visibility
- aggregate-only payload guard
- tests proving delivery can be disabled globally
- dry-run evidence for the exact CSV paths and selected reporting window

Do not enable delivery until config-plan evidence, storage-schema evidence, and owner approval workflow are documented.
