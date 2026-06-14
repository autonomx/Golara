# Production Security Document Inventory

This document tracks reusable production security documents that should stay current as Golara moves through release preparation and post-release operations.

## Purpose

Use this inventory to:

- identify which security documents support launch readiness,
- assign review ownership,
- record the expected review cadence,
- spot stale documents before a production sign-off, and
- keep reusable templates separate from release-specific records.

## Inventory

| Document | Purpose | Suggested owner | Review cadence | Notes |
| --- | --- | --- | --- | --- |
| `docs/SECURITY_AUDIT_REPORT.md` | Current security audit status and roadmap | Security/release owner | After each merged security PR | Keep synchronized with merged work only. |
| `docs/PRODUCTION_SECURITY_DEPLOYMENT_CHECKLIST.md` | Launch checklist and sign-off workflow | Release owner | Each release candidate | Use as the primary pre-launch checklist. |
| `docs/PRODUCTION_SECURITY_OPERATOR_DOCS_INDEX.md` | Operator navigation index for security docs | Release owner | Monthly or when docs change | Keep links current as new docs land. |
| `docs/SECURITY_INCIDENT_RESPONSE_RUNBOOK.md` | Incident triage, containment, recovery, and closure | Incident owner | Quarterly | Rehearse before production launch. |
| `docs/SECURITY_RELEASE_SIGN_OFF_TEMPLATE.md` | Final release sign-off record template | Release owner | Each release candidate | Keep release-specific records outside reusable templates. |
| `docs/PRODUCTION_SECURITY_RELEASE_EVIDENCE_INDEX.md` | Evidence collection index | Release owner | Each release candidate | Store only bounded summaries and links. |
| `docs/PRODUCTION_SECURITY_RELEASE_EXCEPTIONS.md` | Release exception tracking template | Security/release owner | Each release candidate | Close or explicitly carry forward exceptions. |
| `docs/PRODUCTION_SECURITY_MAINTENANCE_SCHEDULE.md` | Recurring post-launch security review cadence | Operations owner | Monthly | Use after launch for ongoing review. |

## Review checklist

Before production sign-off, confirm that:

- all required security documents for the release are listed here,
- links point to merged `main` documents,
- owners are still accurate,
- cadence expectations are still useful,
- stale or superseded documents are marked for cleanup, and
- release-specific evidence remains outside reusable documentation.

## Change rule

When a new reusable security document is added, update this inventory in the same security documentation wave or in the next roadmap reconciliation PR.
