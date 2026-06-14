# Production Security Operational Acceptance Checklist

Use this checklist when handing the production security release process from implementation/release preparation to the operator who will run or approve launch. It is intentionally scoped to acceptance readiness, not to replacing the deployment checklist, evidence index, release sign-off, or incident-response runbook.

## Acceptance owner

| Field | Value |
| --- | --- |
| Release / window | |
| Acceptance owner | |
| Backup owner | |
| Security reviewer | |
| Platform / deployment owner | |
| Support / communications owner | |
| Date reviewed | |
| Decision | Pending / accepted / blocked |

## Required inputs

Confirm these documents or records are available before accepting launch responsibility.

| Input | Required record | Status | Notes |
| --- | --- | --- | --- |
| Audit roadmap | Current security audit report and open-risk summary | Pending | |
| Deployment checklist | Production security deployment checklist for this release | Pending | |
| Release sign-off | Draft or final security release sign-off | Pending | |
| Evidence record | Bounded evidence index or equivalent release record | Pending | |
| Policy decisions | Launch/security policy decisions selected for this release | Pending | |
| External checks | Required external-provider check status and blocker classification | Pending | |
| Monitoring plan | Post-release monitoring owner and watch window | Pending | |
| Rollback / hotfix plan | Rollback and hotfix owner plus decision threshold | Pending | |
| Incident path | Incident response owner and contact path | Pending | |

## Acceptance checks

- [ ] Required GitHub Actions checks are understood, including which failures require code changes and which external checks may require provider follow-up.
- [ ] Production secrets/configuration are represented by checklist status only; no raw values are copied into acceptance notes.
- [ ] Payment/webhook readiness has an owner and evidence location.
- [ ] Public abuse controls and monitoring decisions have an owner and evidence location.
- [ ] CSP/header readiness has an owner and evidence location.
- [ ] Backup/restore readiness has an owner and evidence location.
- [ ] Dependency/package review decisions have an owner and evidence location.
- [ ] Post-release monitoring has a named watch owner and escalation threshold.
- [ ] Rollback/hotfix authority is clear for security-relevant release issues.
- [ ] Customer/support communications owner is clear if security messaging becomes necessary.

## Blocker handling

| Blocker | Owner | Required action | Target review time | Status |
| --- | --- | --- | --- | --- |
| | | | | |

Use this table for unresolved release blockers. Classify blockers as repository, environment/provider, policy/decision, evidence, or staffing/readiness issues. Do not mark the release accepted until every material blocker has an owner and disposition.

## Acceptance decision

| Decision | Meaning |
| --- | --- |
| Accepted | Release owner has enough checklist, evidence, staffing, and rollback context to proceed. |
| Accepted with tracked follow-up | Release can proceed, but non-blocking follow-up is explicitly tracked with owner/date. |
| Blocked | A required check, policy decision, evidence item, or operator readiness item is incomplete. |

Final decision:

- Decision:
- Owner:
- Date:
- Follow-up items:

## Evidence hygiene

Keep acceptance records bounded. Store links, summaries, owners, decisions, and sanitized status references. Do not copy sensitive operational values or raw production data into this document.
