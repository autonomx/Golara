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
- activation blockers for future implementation

It does not create active saved schedules, delivery jobs, email sends, timers, queues, or background execution.

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
11. Confirm activation remains false.
12. Confirm delivery is disabled.
13. Confirm schedule persistence is disabled.
14. Confirm dry-run evidence is listed as a future activation requirement.

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
- dry-run evidence requirement present: yes/no

## Future delivery requirements

Before enabling actual scheduled delivery, add and validate:

- persistence model for owner-approved schedules
- owner approval and disable controls
- delivery provider or channel plan
- retry and failure visibility
- unsubscribe or disable workflow when delivery uses email
- aggregate-only payload guard
- tests proving delivery can be disabled globally
- dry-run evidence that records the exact CSV paths and selected reporting window

Do not enable delivery until the config-plan evidence, owner approval workflow, delivery disable switch, and aggregate payload guard are documented.
