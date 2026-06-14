# Production Security Maintenance Schedule

This schedule keeps the production security controls current after launch. It is intended for recurring operator review and should reference existing checklist, evidence, and incident-response records rather than duplicating them.

## Review cadence

| Cadence | Review area | Owner | Output |
| --- | --- | --- | --- |
| Weekly | CI, required checks, external status providers, and recent release exceptions | Release owner | Short status note or issue link |
| Weekly | Security events, throttling signals, webhook anomalies, and public abuse trends | Security owner | Monitoring summary |
| Monthly | Dependency audit results, lockfile changes, package review, and exception expiry | Engineering owner | Dependency review note |
| Monthly | Backup/restore evidence and access review | Platform owner | Restore/access review note |
| Monthly | CSP/reporting posture and browser-header route coverage | Security owner | Header/CSP review note |
| Quarterly | Incident-response runbook, rollback/hotfix playbook, and release rehearsal coverage | Security + release owners | Rehearsal or tabletop note |
| Quarterly | Policy register and release sign-off template fitness | Release owner | Policy update issue or no-change note |

## Weekly checklist

- Review the latest merged production/security PRs and confirm required checks are still meaningful.
- Confirm any failed external checks are classified and tracked separately from repository failures.
- Review recent public-abuse, authentication, webhook, and authorization-denial signals.
- Check whether any release exceptions were opened, extended, resolved, or expired.
- Confirm no new production-facing surface was added without the expected checklist coverage.

## Monthly checklist

- Review production dependencies, package additions, lockfile changes, and advisory exceptions.
- Confirm backup and restore evidence is current enough for the launch posture.
- Review browser-header and CSP coverage for new routes and route families.
- Review media, upload, webhook, payment, and public API policies for drift from implementation.
- Confirm the evidence index points to current CI/checklist/sign-off records.

## Quarterly checklist

- Run a release security rehearsal or tabletop using the current docs.
- Review whether role ownership and escalation paths are still accurate.
- Review incident-response, rollback, communication, and post-release monitoring playbooks.
- Close stale security exceptions or explicitly re-approve them with a new owner and date.
- Create follow-up issues for any missing automation, tests, or evidence paths.

## Maintenance record

| Date | Cadence | Reviewer | Result | Follow-up |
| --- | --- | --- | --- | --- |
| TBD | Weekly / Monthly / Quarterly | TBD | Pending | TBD |

## Escalation rule

If a review finds a regression in required checks, production security policy, or evidence readiness, open a focused issue or PR before the next release window. If the concern affects active production risk, use the incident-response or rollback/hotfix playbook instead of waiting for the next scheduled review.
