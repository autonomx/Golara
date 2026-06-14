# Production Security Rollback and Hotfix Playbook

This playbook gives release managers and operators a compact process for security-relevant rollback and hotfix decisions during Golara production releases.

Use this document with:

- `docs/PRODUCTION_SECURITY_DEPLOYMENT_CHECKLIST.md`
- `docs/SECURITY_RELEASE_SIGNOFF_TEMPLATE.md`
- `docs/SECURITY_INCIDENT_RESPONSE_RUNBOOK.md`
- `docs/PRODUCTION_SECURITY_RELEASE_EVIDENCE_INDEX.md`

## When to use it

Use this playbook when a release, deployment, provider change, configuration change, or post-release watch reveals a security-relevant regression, including:

- authentication/session failures;
- authorization or admin-access anomalies;
- payment or webhook integrity issues;
- public API exposure or abuse-control regressions;
- missing production security headers;
- suspicious media-upload, dependency, or runtime behavior;
- monitoring, backup, or incident-response readiness gaps.

## Triage classification

Classify the issue before deciding rollback versus hotfix.

| Classification | Default action |
| --- | --- |
| Active exploit, exposed sensitive data, broken auth boundary, or unsafe payment state transition | Contain immediately and prefer rollback unless a narrower hotfix is already verified. |
| Missing or failed release gate with unknown exposure | Pause rollout, preserve evidence, and decide between rollback and hotfix after owner review. |
| External provider/check failure without repo-side test failure | Keep the release blocked, document the external status, and do not merge or promote until required checks recover. |
| Low-risk documentation, monitoring, or policy gap | Patch forward if the current release remains safe and the owner accepts the timing. |

## Rollback decision checklist

Before rollback, confirm:

- [ ] A rollback target is identified by commit SHA, deployment ID, or artifact ID.
- [ ] Database migration compatibility is understood.
- [ ] Payment/webhook replay and idempotency behavior is considered.
- [ ] Order, inventory, reservation, and customer-session impact is reviewed.
- [ ] Provider dashboard or secret-manager changes have a safe revert plan if applicable.
- [ ] On-call, release owner, and security reviewer agree on the decision.
- [ ] Bounded evidence is recorded in the release evidence index or access-controlled tracker.

## Hotfix decision checklist

Before patch-forward hotfix, confirm:

- [ ] The fix is narrower than rollback and has an owner.
- [ ] The affected boundary has a dedicated regression test or CI/source gate when practical.
- [ ] GitHub Actions and required external deployment checks are green on the exact hotfix head SHA.
- [ ] The hotfix does not expand the exposed surface while waiting for deployment.
- [ ] Post-release watch is extended for the affected boundary.
- [ ] The release sign-off record notes the hotfix and remaining follow-up work.

## Evidence to record

Record bounded release evidence only:

- PR number, commit SHA, deployment ID, CI run ID, and sanitized provider/check links;
- issue classification, owner, decision, timestamp, and reviewer;
- rollback target or hotfix head SHA;
- summary of tests, checks, and post-release watch outcome;
- follow-up ticket or roadmap item for any accepted residual risk.

Do not copy raw production payloads, credentials, full logs, customer records, or provider secrets into repository documents or public release notes.

## Post-action validation

After rollback or hotfix:

1. Re-run required CI and route-smoke checks for the active release artifact.
2. Confirm security headers, auth boundaries, payment/webhook behavior, public-abuse controls, and monitoring dashboards.
3. Review logs using bounded/redacted security-event views.
4. Update the release evidence index and sign-off record.
5. If the event involved active exploitation or sensitive-data exposure, continue in the incident-response runbook.
