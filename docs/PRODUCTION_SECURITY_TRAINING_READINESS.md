# Production Security Training Readiness Checklist

This checklist helps confirm that release operators, support, and incident-response participants understand the production security controls before launch. It is intended for rehearsal and onboarding, not for storing operational secrets or raw incident data.

## Scope

Use this checklist before a production release or after a material security-process change. It covers security-document navigation, release evidence handling, external-check interpretation, incident escalation, rollback/hotfix awareness, and post-release monitoring responsibilities.

## Participants

| Role | Readiness focus | Required output |
| --- | --- | --- |
| Release owner | Release gates, sign-off, and merge/deploy rules | Confirms the release cannot proceed with unresolved required checks. |
| Security reviewer | Audit roadmap, policy decisions, and evidence hygiene | Confirms security evidence is bounded and reviewable. |
| Platform/deployment owner | CI, Vercel, environment, backup, and rollback readiness | Confirms external checks and deployment controls are understood. |
| Support/communications owner | Customer/support notes and escalation wording | Confirms communication templates are ready. |
| Incident coordinator | Runbook, triage, containment, and post-incident follow-up | Confirms escalation paths and ownership are current. |

## Training checklist

### 1. Security document navigation

- [ ] Locate the security audit roadmap.
- [ ] Locate the production deployment checklist.
- [ ] Locate the release sign-off template.
- [ ] Locate the incident-response runbook.
- [ ] Locate the rollback/hotfix playbook if available in the active branch.
- [ ] Locate the post-release monitoring guide if available in the active branch.
- [ ] Confirm participants know which documents are source of truth for the release.

### 2. CI and required-check interpretation

- [ ] Confirm participants know how to identify the exact PR head SHA.
- [ ] Confirm participants can distinguish GitHub Actions failures from external provider failures.
- [ ] Confirm participants know that green GitHub Actions alone is not enough if a required external check is failed.
- [ ] Confirm participants know how to record a blocked external check without treating it as a repository test failure.

### 3. Evidence hygiene

- [ ] Confirm participants know where release evidence is recorded.
- [ ] Confirm participants understand evidence should use bounded links, summaries, and decision notes.
- [ ] Confirm participants know to avoid copying raw operational payloads into docs, PR bodies, or issue comments.
- [ ] Confirm participants know who owns evidence cleanup if an unsafe detail is accidentally captured.

### 4. Policy decision awareness

- [ ] Review session lifetime and revocation expectations.
- [ ] Review public abuse throttling expectations.
- [ ] Review public inquiry spam expectations.
- [ ] Review CSP reporting and tightening expectations.
- [ ] Review media malware/metadata expectations.
- [ ] Review backup/restore expectations.
- [ ] Review dependency, package-integrity, and license expectations.
- [ ] Confirm unresolved operator decisions have an owner before launch.

### 5. Incident and rollback readiness

- [ ] Walk through the incident-response escalation path.
- [ ] Walk through when a rollback is preferred over a hotfix.
- [ ] Walk through who approves emergency release actions.
- [ ] Confirm post-action validation expectations after rollback or hotfix.
- [ ] Confirm communication handoff expectations for customer/support-impacting incidents.

### 6. Post-release monitoring readiness

- [ ] Confirm who watches payment and webhook security signals.
- [ ] Confirm who watches public abuse and inquiry signals.
- [ ] Confirm who watches external provider and required-check signals.
- [ ] Confirm who watches release communication channels.
- [ ] Confirm when monitoring ownership can hand off after launch.

## Readiness result

| Field | Value |
| --- | --- |
| Release or rehearsal name |  |
| Date |  |
| Participants |  |
| Training owner |  |
| Open follow-ups |  |
| Launch blocking gaps |  |
| Evidence location |  |
| Final readiness result | Not ready / Ready with follow-ups / Ready |

## Completion criteria

Training is complete when every required participant can locate the relevant security documents, explain required-check handling, describe evidence-hygiene expectations, identify their release role, and name the escalation owner for incidents or blocked checks.
