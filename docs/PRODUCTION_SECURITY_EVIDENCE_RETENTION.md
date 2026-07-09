# Production Security Evidence Retention Guide

This guide defines how production security release evidence should be retained after launch, audit closeout, or a security maintenance review.

## Purpose

Keep enough release and security-review context to support later incident review, audit follow-up, and maintenance checks without turning the repository into a long-term storage location for operational records.

## Retention scope

| Evidence area | Examples | Suggested owner | Review cadence |
| --- | --- | --- | --- |
| CI and required checks | PR number, head SHA, workflow run number, check conclusion | Release owner | Each release |
| Deployment sign-off | Completed checklist link or summary | Release owner | Each release |
| Policy decisions | Launch decision or exception register row | Security owner | Monthly |
| Post-release monitoring | Monitoring review summary and follow-up items | Platform owner | Weekly after release, then monthly |
| Incident or rollback records | Incident/runbook reference or rollback/hotfix summary | Incident owner | After closure |
| Maintenance reviews | Completed maintenance schedule row | Security owner | Monthly/quarterly |

## Repository storage rule

The repository should keep reusable templates, checklists, and policy documents. Release-specific evidence should be stored in the team-approved evidence location and referenced from release records by bounded summaries or links.

## Retention checklist

Before closing a release security record:

1. Confirm the release PRs, head SHAs, CI runs, and required external checks are recorded.
2. Confirm the deployment checklist and sign-off record are retained in the approved location.
3. Confirm launch decisions and exceptions include owner, decision, expiry or review date, and follow-up status.
4. Confirm post-release monitoring observations have a clear owner and due date if follow-up is needed.
5. Confirm any incident, rollback, or hotfix references are linked from the final release record.
6. Confirm maintenance schedule follow-ups were created for recurring review items.

## Review triggers

Review retained evidence whenever:

- A security incident references the release.
- A required check was overridden, delayed, or externally blocked.
- A launch exception expires or needs renewal.
- A new provider, deployment platform, or evidence storage system is introduced.
- A quarterly security maintenance review finds stale or missing records.

## Closeout statement

Use this statement when the release evidence record is complete:

> Release security evidence has been retained in the approved location. Repository documents contain only reusable templates and bounded references. Follow-up owners and review dates are recorded for all open items.
