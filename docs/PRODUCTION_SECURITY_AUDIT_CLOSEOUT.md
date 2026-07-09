# Production Security Audit Closeout Checklist

This checklist helps the release owner decide when the production security-audit workflow is ready for launch handoff.

## Closeout inputs

| Input | Expected state | Evidence link |
| --- | --- | --- |
| Security audit roadmap | Current through latest merged security work | |
| Deployment checklist | Completed or exception noted | |
| Release sign-off | Filled for release candidate | |
| Release exceptions | Owned and dated | |
| Required checks | Reviewed on exact candidate SHA | |
| Incident response path | Owner confirmed | |
| Rollback or hotfix path | Owner confirmed | |
| Post-release monitoring | Watch owner assigned | |

## Required confirmations

- Release candidate SHA is recorded.
- GitHub Actions result is checked for that SHA.
- Required external checks are checked for that SHA.
- Open exceptions have owners and review dates.
- Monitoring, rollback, and communication ownership is assigned.
- Evidence is recorded as links or short summaries.

## Decision states

| Decision | Meaning | Follow-up |
| --- | --- | --- |
| Ready | Required inputs are complete | Proceed to release sign-off |
| Ready with exception | Known exception is accepted for this release | Track owner and review date |
| Blocked | Required input is unresolved | Resolve before release |
| Deferred | Release is intentionally delayed | Record next review date |

## Closeout record

| Field | Value |
| --- | --- |
| Release candidate SHA | |
| Release owner | |
| Security reviewer | |
| Platform owner | |
| Incident owner | |
| Monitoring owner | |
| Decision | |
| Open exceptions | |
| Next review date | |

## Follow-up

After closeout, keep the audit report synchronized with any merged security changes. Do not mark a phase fully fixed unless the implementation, documentation, and required CI or release evidence have all landed.
