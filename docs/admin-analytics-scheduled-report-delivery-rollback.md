# Admin analytics scheduled report delivery rollback

Scheduled report delivery remains gate-controlled and auditable. If delivery execution must be rolled back, use this checklist before re-enabling any runtime flag.

## Immediate rollback

1. Disable the delivery execution runtime flag.
2. Disable or remove the configured delivery transport adapter.
3. Keep scheduler and worker runtime flags disabled until delivery is revalidated.
4. Preserve audit and failure records for owner review.
5. Re-run dry-run preview and payload materialization before any future delivery attempt.

## Safety boundaries

- Do not enable retry execution during rollback.
- Do not bypass owner approval or dry-run evidence gates.
- Do not send per-customer rows; scheduled reports must remain aggregate-only.
- Do not register a background timer, cron, or worker while rollback is active.

## Re-enable checklist

Delivery may only be re-enabled after owner approval, dry-run evidence, active schedule metadata, materialized aggregate payload, configured transport, and the global delivery kill switch all permit execution.
