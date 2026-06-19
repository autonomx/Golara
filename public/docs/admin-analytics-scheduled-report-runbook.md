# Admin analytics scheduled report runbook

This runbook covers the scheduled report configuration-plan foundation for `/admin/analytics`.

## Current scope

The current scheduled report implementation is a configuration contract only.

It defines:

- weekly owner report preview
- monthly owner report preview
- selected analytics range metadata
- aggregate Business CSV path
- aggregate Site CSV path
- owner-approval requirement metadata
- draft-only weekly and monthly configuration plans
- explicit disabled delivery state
- explicit disabled schedule-persistence state

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
10. Confirm activation remains disabled.
11. Confirm delivery is disabled.
12. Confirm schedule persistence is disabled.

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
- owner approval required: must be yes
- owner approved: must be no
- activation enabled: must be no
- delivery enabled: must be no
- schedule persistence enabled: must be no

## Future delivery requirements

Before enabling actual scheduled delivery, add and validate:

- persistence model for owner-approved schedules
- owner approval and disable controls
- delivery provider or channel plan
- retry and failure visibility
- aggregate-only payload guard
- tests proving delivery can be disabled globally
- dry-run evidence for the exact CSV paths and selected reporting window

Do not enable delivery until config-plan evidence and owner approval workflow are documented.
