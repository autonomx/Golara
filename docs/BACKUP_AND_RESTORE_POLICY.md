# Backup and Restore Policy

This policy defines the production backup and restore expectations for Golara. It complements the production security deployment checklist and incident response runbook.

Do not store raw database dumps, customer PII, secrets, cookies, OTPs, provider references, webhook bodies, or access tokens in issues, PRs, runbooks, release notes, or restore-test evidence.

## Launch decision

Before production launch or major production traffic changes, choose and record one of these decisions:

1. **Managed backup policy accepted** — the deployment database/storage provider supplies backups, encryption, retention, access control, and restore tooling that meet launch needs.
2. **Custom backup policy required** — Golara operators maintain additional database or media backups beyond provider defaults.
3. **Launch blocker** — backup cadence, restore ownership, or restore validation is not documented enough for production traffic.

Record the decision owner, date, scope, retention window, recovery point objective, recovery time objective, and next review date.

## Database backup requirements

- Define backup cadence for production database data.
- Define retention duration and deletion/expiry behavior.
- Ensure backups are encrypted at rest and in transit by the platform or backup tooling.
- Restrict backup access to authorized operators only.
- Audit backup access and restore operations where the platform supports it.
- Keep backup credentials in the deployment secret manager, not source control or ticket text.
- Avoid exporting full production data unless a restore/test process explicitly requires it and has approved handling controls.

## Media and object-storage retention

- Document whether media recovery relies on object-storage versioning, provider retention, explicit backup jobs, or accepted risk.
- Restrict storage console/API access to authorized operators.
- Avoid copying raw customer-uploaded media into issues, PRs, or chat logs.
- Document deletion behavior for media if deletion helpers or retention rules are introduced.

## Restore test requirements

Run or schedule a production-like restore test before launch and after major persistence changes.

A restore test should validate:

- order and payment records are internally consistent;
- inventory reservations and fulfillment capacity remain coherent;
- customer session records can be invalidated or preserved according to the incident scenario;
- admin access can be restored or deliberately rotated;
- payment/webhook references remain usable for reconciliation without exposing raw provider payloads;
- application startup, build, and route smoke checks pass against the restored environment.

## Restore evidence

Restore evidence may include:

- restore date and owner;
- environment name or sanitized identifier;
- source backup timestamp;
- pass/fail result;
- sanitized counts or checksums;
- follow-up actions.

Restore evidence must not include raw production rows, customer PII, secrets, cookies, OTPs, provider references, webhook bodies, or database dump links.

## Incident use

During an incident:

- preserve relevant audit/security events before destructive remediation where practical;
- rotate credentials before restoring into a compromised environment;
- restore into an isolated environment first when investigating data integrity;
- validate payment/order/inventory consistency before reopening checkout or admin operations;
- record final restore actions in the incident timeline using bounded/redacted evidence only.

## Ownership and review

Assign owners for:

- database backup configuration;
- media/object-storage retention;
- restore test execution;
- emergency restore approval;
- backup access review.

Review this policy after backup provider changes, database schema changes affecting order/payment/session data, storage provider changes, or any production incident requiring restore or data integrity validation.
