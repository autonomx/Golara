# Admin analytics scheduled report recording endpoints

Status: owner-only, runtime-gated recording endpoints are present.

This slice adds POST-only endpoint shells for recording scheduled-report readiness evidence:

- dry-run evidence
- owner approval
- safety-state evidence

The routes require an owner admin session and explicit runtime flags before attaching the generated Prisma delegate. With default configuration, every endpoint returns a locked response and does not write data.

## Runtime gates

A recording request must satisfy all of these gates before the repository delegate can attach:

- recording endpoints enabled
- generated Prisma client runtime access enabled
- repository writes enabled
- target-specific recording flag enabled
- global safety control validated
- owner approval policy validated
- scheduler disabled
- delivery execution disabled

## Still disabled

This phase does not add:

- scheduler, timer, or background execution
- delivery execution
- delivery retry execution
- management-page forms or submit controls
- public or staff access
- activation of scheduled reports

## Routes

- `/admin/analytics/scheduled-reports/record-dry-run`
- `/admin/analytics/scheduled-reports/record-owner-approval`
- `/admin/analytics/scheduled-reports/record-disable-state`

All are POST-only and owner-only.
