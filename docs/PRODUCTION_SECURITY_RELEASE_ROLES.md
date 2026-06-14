# Production Security Release Roles and Handoff Matrix

This matrix records who owns each production-security release duty. It is designed for launch coordination and handoff, not for storing secrets, credentials, raw logs, customer data, or provider payloads.

## Required roles

| Role | Primary responsibility | Required before release | Handoff notes |
| --- | --- | --- | --- |
| Release owner | Coordinates the release decision and final go/no-go. | Confirms checklist, evidence, and launch decisions are complete. | Records final sign-off link and unresolved accepted risks. |
| Security reviewer | Reviews security controls, policy choices, and risk exceptions. | Confirms high-risk checklist items are complete or explicitly deferred. | Records any required follow-up owner and review date. |
| CI/verifier | Confirms required GitHub Actions and external required checks. | Confirms exact head SHA, CI run, build, route smoke, and external status. | Classifies external failures separately from repository failures. |
| Platform/operator owner | Confirms deployment settings and provider configuration. | Confirms environment variables, headers, storage, backups, and provider webhooks are configured. | Records sanitized configuration evidence references. |
| Incident lead | Owns escalation if release or post-release security signals fail. | Confirms incident-response runbook access and contact path. | Records escalation channel and first response owner. |
| Support/customer comms owner | Coordinates release-support notes and customer-facing communications. | Confirms support brief and customer note, if needed. | Records approved communication summary. |

## Handoff checkpoints

Before a production release is considered ready, the release owner should ensure:

1. Every required role above has a named owner or an explicit accepted deferral.
2. The evidence index has links to exact CI/check results and policy decisions.
3. The launch-decision register records policy choices that affect runtime behavior.
4. The rollback/hotfix owner is available during the release window.
5. The post-release monitoring owner has the first-hour and first-day watch plan.
6. Communication ownership is clear for internal, support, and customer-facing updates.

## Role-change guidance

If an owner changes during a release window:

1. Record the new owner and handoff time in the release evidence index.
2. Summarize the current release state without copying sensitive evidence.
3. Re-confirm unresolved blockers, accepted risks, and next checkpoints.
4. Re-run or re-check any required verification that depends on the changed owner.

## Evidence hygiene

Use links, summaries, timestamps, and owner names. Do not copy raw operational records into this matrix. Keep sensitive records in their approved systems and reference only sanitized evidence locations.
