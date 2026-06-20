# Admin analytics scheduled report recording readiness

This runbook covers the scheduled-report recording-readiness surface for dry-run evidence, owner approval, and global disable state.

## Current scope

Owner-only recording endpoints and locked owner-page controls now exist for the three approved recording targets. Recording remains runtime-gated, owner-only, and limited to approved evidence fields.

The current surface covers:

- dry-run evidence recording for `lastDryRunAt` and `lastDryRunSummary`
- owner approval recording for `ownerApproved` and approval metadata
- disable-state recording for inactive schedules and disabled delivery metadata
- locked management-page controls for the approved recording endpoints
- aggregate-only dry-run preview evidence
- aggregate-only payload preview evidence
- activation-readiness checks that require dry-run evidence and owner approval
- no scheduler, transport, delivery, or automatic retry execution

## Approved recording endpoints

The only approved form targets are:

- `/admin/analytics/scheduled-reports/record-dry-run`
- `/admin/analytics/scheduled-reports/record-owner-approval`
- `/admin/analytics/scheduled-reports/record-disable-state`

No other management action, public route, staff route, scheduler path, or delivery path may record scheduled-report state.

## Required gates

Each recording target must keep these requirements:

- owner-role confirmation
- runtime recording flag for the target operation
- repository-write gate
- global disable control validation
- aggregate-only report type validation
- selected range evidence
- delivery-disabled confirmation
- audit-ready metadata

## Disabled by default

These remain disabled unless a future audited slice explicitly enables them:

- public or staff scheduled-report access
- arbitrary repository writes
- schedule activation from management UI
- live scheduler, timer, or background registration
- automatic worker execution
- live transport, email, or provider delivery
- default payload send behavior
- automatic retry execution or unbounded retry loops

## Validation checklist

For each validation pass, confirm:

1. Owner-only page access is enforced.
2. Public and staff access are blocked.
3. Forms post only to the three approved recording endpoints.
4. Recording endpoints require owner and runtime gates.
5. Dry-run preview remains aggregate-only.
6. Payload preview remains aggregate-only.
7. Activation readiness cannot bypass dry-run evidence or owner approval.
8. Delivery execution remains gated and blocked by default.
9. Scheduler, timer, queue, and background registration remain absent.
10. Retry planning does not create automatic retry execution.

## Future implementation requirements

Before expanding recording beyond the three approved endpoints, add a separate audited slice that documents field targets, owner evidence, disable behavior, aggregate-only validation, audit shape, and guard coverage.

Do not expand recording to scheduler activation, live delivery, or automatic retry execution without a dedicated gated implementation and exact-head CI evidence.
