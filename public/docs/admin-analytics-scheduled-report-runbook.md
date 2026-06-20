# Admin analytics scheduled report runbook

This runbook covers the current scheduled-report owner management, recording, preview, activation-readiness, planning, disabled worker, transport-contract, gated delivery-execution, and retry-planning surface for `/admin/analytics`.

## Current scope

Scheduled reports are partially production-ready for owner-only management and validation. They are not yet enabled for automatic scheduling or live delivery.

The current implementation includes:

- owner-only scheduled report management page
- locked management controls for dry-run evidence, owner approval, and disable-state recording
- owner-only read endpoint
- owner-only runtime-gated recording endpoints
- metadata-only `AdminAnalyticsScheduledReport` storage table
- applied `schema.prisma` model mapping and checked Prisma schema fragment
- generated-client type visibility for the injected-reader boundary
- metadata-only read model and repository-read query-plan contract
- read adapter and disabled Prisma reader-factory contract
- gated read-only repository factory
- owner-approval policy contract
- global kill-switch contract
- dry-run evidence contract and aggregate-only dry-run preview route
- aggregate-only delivery payload preview route
- activation-readiness helper that produces metadata-only activation args only when all gates pass
- deterministic weekly/monthly schedule planning and owner-page plan visibility
- disabled-by-default worker shell with locked/skipped default behavior
- disabled default transport adapter contract and test-only adapter
- gated delivery executor contract with audit/failure result shapes and rollback docs
- retry planning for failed delivery records only, with capped attempts and owner-visible status

## Enabled owner-only routes

These routes exist, but remain runtime-gated and owner-only:

- `/admin/analytics/scheduled-reports/read`
- `/admin/analytics/scheduled-reports/record-dry-run`
- `/admin/analytics/scheduled-reports/record-owner-approval`
- `/admin/analytics/scheduled-reports/record-disable-state`
- `/admin/analytics/scheduled-reports/dry-run-preview`
- `/admin/analytics/scheduled-reports/payload-preview`

The dry-run preview and payload preview routes require their explicit runtime preview flags. The recording routes require the existing owner-only and repository-write gates. Public and staff access remain blocked.

## Disabled boundary

The current implementation does not enable:

- live scheduler registration
- cron, timer, queue, or background job registration
- automatic worker execution
- automatic schedule activation from the owner page
- live email, webhook, provider, or transport configuration
- default payload send behavior
- unbounded retry loops
- public or staff scheduled-report access
- arbitrary repository writes
- per-customer rows, raw event rows, visitor/session identifiers, delivery recipient lists, or export contents in scheduled-report metadata

## Gate expectations

Before live delivery can run, an audited caller must prove all of these gates:

- owner session and owner role evidence
- selected analytics range evidence
- aggregate-only report types
- dry-run evidence exists
- owner approval exists
- global kill switch permits execution
- global disable state is validated
- schedule is active through approved activation metadata
- delivery remains explicitly enabled by the owner-controlled delivery gate
- payload materialization remains aggregate-only
- transport adapter is explicitly configured and not the disabled default adapter
- audit and rollback evidence exists
- retry attempts remain capped

## Validation checklist

For each validation pass, confirm:

1. The owner management page is owner-only.
2. Public and staff sessions cannot access scheduled-report management or routes.
3. Management forms target only the approved recording endpoints.
4. Locked controls remain disabled unless explicit runtime gates are enabled.
5. Recording endpoints require owner-only and write gates.
6. Dry-run preview is aggregate-only and requires `ADMIN_ANALYTICS_SCHEDULED_REPORT_DRY_RUN_PREVIEW_ENABLED`.
7. Payload preview is aggregate-only and requires `ADMIN_ANALYTICS_SCHEDULED_REPORT_DELIVERY_PAYLOAD_PREVIEW_ENABLED`.
8. Activation readiness does not activate schedules without dry-run evidence, owner approval, kill-switch permission, disable-state validation, repository-write permission, and delivery-disabled confirmation.
9. Weekly/monthly next-run planning is deterministic.
10. Scheduler runtime remains disabled by default.
11. The worker shell returns locked/skipped status by default.
12. No cron, timer, queue, or background job registration exists.
13. The default transport adapter is disabled and cannot send.
14. No live provider, SMTP, webhook, or network transport is wired.
15. Delivery execution is gated and returns blocked unless every gate and an injected adapter are supplied.
16. Delivery audit/failure result shapes are present.
17. Retry planning includes failed deliveries only.
18. Retry attempts are capped.
19. Retry planning is owner-visible but does not start automatic retry execution.
20. No scheduled-report path stores per-customer rows, raw event rows, visitor/session identifiers, delivery recipient lists, or export contents.

## Evidence record

For each validation run, record:

- reviewer
- environment
- validation date
- deployment or commit SHA
- owner page checked: yes/no
- owner-only routes checked: yes/no
- public/staff access blocked: yes/no
- locked recording controls checked: yes/no
- approved recording endpoints checked: yes/no
- dry-run preview checked: yes/no
- dry-run preview flag enabled for test: yes/no
- dry-run aggregate-only validation passed: yes/no
- payload preview checked: yes/no
- payload preview flag enabled for test: yes/no
- payload aggregate-only validation passed: yes/no
- activation readiness checked: yes/no
- activation writes performed by default: must be no
- schedule plan checked: yes/no
- scheduler runtime registered: must be no
- worker shell checked: yes/no
- worker automatic execution registered: must be no
- transport contract checked: yes/no
- disabled transport can send: must be no
- live provider/network transport configured: must be no
- gated delivery executor checked: yes/no
- delivery executes without every gate: must be no
- retry planning checked: yes/no
- retry attempts capped: yes/no
- automatic retry loop registered: must be no
- rollback documentation checked: yes/no
- result: pass / fail / blocked
- follow-up issue or PR

## Future delivery-enablement requirements

Before treating scheduled reports as fully production-ready for live delivery, add a separate audited implementation that:

- enables owner-controlled schedule activation from the management page
- configures a real transport adapter intentionally
- proves rollback and audit logging in production-like validation
- proves dry-run evidence and owner approval exist for the report being delivered
- proves the global kill switch can block delivery immediately
- proves delivery payloads remain aggregate-only
- proves failures are recorded and visible to owners
- proves retry execution remains capped and bounded
- documents the operational disable workflow

Do not register automatic scheduler/timer/background execution or send live delivery payloads until every delivery gate, rollback requirement, and audit requirement is proven in GitHub Actions or production-like validation evidence.
