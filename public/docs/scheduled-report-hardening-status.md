# Scheduled report hardening status

Scheduled reports are hardened for owner-only inspection and gated preview workflows, but production defaults remain locked.

## Ready surfaces

- Owner-only management and read surfaces.
- Gated dry-run, approval, and disable-state evidence recording.
- Aggregate-only dry-run and payload previews.
- Metadata-only activation readiness.
- Deterministic weekly/monthly plan inspection.
- Worker, transport, delivery, retry, manual owner-run, runtime-flag, and clock-readiness contracts.

## Disabled by default

- Automatic schedules.
- Automatic worker runs.
- Payloads leaving the system.
- Retry loops.
- Staff or public access.
- Arbitrary repository writes.
- Per-customer rows, raw event rows, visitor/session identifiers, recipient lists, or export contents in scheduled report metadata.

## Operator readiness

Before live rollout, verify owner enforcement, dry-run evidence, owner approval, disable-state and kill-switch checks, aggregate-only payload preview, reviewed transport configuration, manual owner-run evidence, separate clock-readiness, capped retry eligibility, and deployment rollback steps.
