# Production Security Release Rehearsal

This checklist provides a dry-run plan for production security release readiness before an actual launch window. It is intended for operators, reviewers, and release owners who need to prove that the documented security process can be followed end-to-end.

## Scope

Use this rehearsal when preparing for a production release, major provider switch, payment-launch milestone, or security-sensitive deployment. The rehearsal should not change production data, send customer communications, rotate live secrets, or trigger real provider callbacks.

## Rehearsal goals

- Confirm that release owners know which security documents to use.
- Confirm that CI, route-smoke, evidence, sign-off, rollback, monitoring, and communication steps have named owners.
- Confirm that required production decisions have a decision owner and evidence location.
- Confirm that external check failures can be classified before the launch window.
- Confirm that rollback and hotfix paths are understood before they are needed.

## Participants

Record the people or teams assigned for the rehearsal:

| Role | Owner | Backup | Notes |
| --- | --- | --- | --- |
| Release lead |  |  |  |
| Security reviewer |  |  |  |
| Platform/deployment owner |  |  |  |
| Payment/provider owner |  |  |  |
| Support/comms owner |  |  |  |
| Incident commander backup |  |  |  |

## Pre-rehearsal setup

1. Pick a recent release candidate or representative pull request.
2. Identify the expected CI run, deployment preview, and route-smoke result.
3. Identify where sanitized release evidence would be recorded.
4. Identify which launch decisions would be required for the selected release scope.
5. Identify rollback and hotfix decision owners.
6. Confirm that all rehearsal evidence uses bounded summaries and links instead of raw operational data.

## Dry-run steps

### 1. CI and required-check review

- Confirm that the selected commit has a complete GitHub Actions run.
- Confirm whether external providers are successful, failed, pending, or blocked.
- Classify any failed external provider status before assuming a code regression.
- Record the commit SHA, CI run number, and final required-check decision.

### 2. Security checklist walkthrough

- Walk through the production security deployment checklist.
- Mark each item as complete, not applicable, blocked, or decision-required.
- Assign an owner for each blocked or decision-required item.
- Confirm that no release-blocking item is silently deferred.

### 3. Evidence walkthrough

- Confirm where CI, checklist, decision, sign-off, and post-release evidence would be stored.
- Confirm evidence is sufficient to reconstruct the decision path.
- Confirm evidence avoids raw secrets, private customer data, raw provider payloads, and unbounded logs.

### 4. Launch decision walkthrough

- Review required launch decisions for throttling, CSP, session policy, backup/restore, dependency exceptions, package review, media policy, and release sign-off.
- Confirm each decision has an owner, a decision state, and a review cadence.
- Confirm unresolved decisions are visible before the release window.

### 5. Rollback and hotfix walkthrough

- Choose one hypothetical rollback trigger and one hypothetical hotfix trigger.
- Confirm who decides rollback versus hotfix.
- Confirm which checks must pass before declaring recovery complete.
- Confirm how post-action evidence would be recorded.

### 6. Monitoring and communication walkthrough

- Confirm the first-hour and first-day monitoring owners.
- Confirm escalation triggers and contact paths.
- Draft a short internal release-status update.
- Draft a short support-facing note if customer impact exists.

## Completion criteria

The rehearsal is complete when:

- Every required document can be found by the release team.
- Every required release decision has an owner.
- Every blocked item has a next action.
- CI and external checks can be classified without guesswork.
- Rollback, hotfix, monitoring, and communication paths have named owners.
- Evidence locations are known and evidence hygiene has been reviewed.

## Follow-up actions

Record follow-ups as small, auditable tasks:

| Follow-up | Owner | Due date | Release blocker? | Notes |
| --- | --- | --- | --- | --- |
|  |  |  |  |  |
