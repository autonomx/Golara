# Production Security Operator Docs Index

This index gives release managers and operators one starting point for Golara production security documentation. It links to the durable audit, checklist, policy, evidence, and incident-response documents without duplicating sensitive evidence.

Do not store raw secrets, customer PII, provider references, webhook bodies, database dumps, OTPs, cookies, access tokens, or raw production logs in this index or in linked release notes.

## Release gate documents

| Document | Use it for |
| --- | --- |
| `docs/SECURITY_AUDIT_REPORT.md` | Current audit status, completed hardening work, and remaining roadmap items. |
| `docs/PRODUCTION_SECURITY_DEPLOYMENT_CHECKLIST.md` | Release-gate checklist for secrets, headers, payments, abuse controls, monitoring, backups, dependencies, evidence, and sign-off. |
| `docs/SECURITY_RELEASE_SIGNOFF_TEMPLATE.md` | Final bounded sign-off record for release owner, security reviewer, risks, evidence, rollback, and approval. |
| `docs/PRODUCTION_SECURITY_RELEASE_EVIDENCE_INDEX.md` | Bounded index of CI, deployment, policy, checklist, and post-release evidence links or summaries. |
| `docs/PRODUCTION_SECURITY_RELEASE_ROLES.md` | Role ownership and handoff matrix for release, security review, CI verification, platform operations, incident response, and communications. |

## Policy decision documents

| Document | Use it for |
| --- | --- |
| `docs/PRODUCTION_SESSION_LIFETIME_POLICY.md` | Admin/customer session lifetime, OTP bridge expiry, privileged re-auth, revocation, and monitoring decisions. |
| `docs/PUBLIC_ABUSE_THROTTLING_POLICY.md` | In-process, distributed, or hybrid throttling choices for public-abuse controls. |
| `docs/PUBLIC_INQUIRY_SPAM_POLICY.md` | Public inquiry spam, anti-automation, evidence, and review-cadence decisions. |
| `docs/CSP_REPORTING_AND_TIGHTENING_POLICY.md` | CSP report-only, enforced-baseline, and tightening-required launch decisions. |
| `docs/MEDIA_MALWARE_AND_METADATA_POLICY.md` | Malware scanning, metadata stripping, accepted risk, evidence, and review cadence for uploaded media. |
| `docs/BACKUP_AND_RESTORE_POLICY.md` | Database/media backup, restore-test, evidence hygiene, and recovery validation decisions. |
| `docs/DEPENDENCY_ADVISORY_EXCEPTION_POLICY.md` | Dependency advisory exception criteria, remediation, expiry, lockfile review, and evidence hygiene. |
| `docs/PACKAGE_INTEGRITY_AND_LICENSE_POLICY.md` | Production package review fields, license suitability, publisher/integrity review, lockfile review, and exceptions. |

## Incident response document

| Document | Use it for |
| --- | --- |
| `docs/SECURITY_INCIDENT_RESPONSE_RUNBOOK.md` | Triage, evidence preservation, containment, eradication, recovery validation, communication, and closure. |

## Recommended release flow

1. Start from `docs/SECURITY_AUDIT_REPORT.md` to identify release-relevant open security items.
2. Complete `docs/PRODUCTION_SECURITY_DEPLOYMENT_CHECKLIST.md` for the target release.
3. Assign release owners and handoff coverage in `docs/PRODUCTION_SECURITY_RELEASE_ROLES.md`.
4. Record required policy decisions in the linked policy documents or an access-controlled release tracker.
5. Collect bounded evidence in `docs/PRODUCTION_SECURITY_RELEASE_EVIDENCE_INDEX.md` or an equivalent access-controlled tracker.
6. Complete `docs/SECURITY_RELEASE_SIGNOFF_TEMPLATE.md` after CI, deployment verification, and risk review are done.
7. Keep `docs/SECURITY_INCIDENT_RESPONSE_RUNBOOK.md` visible to release and on-call operators.

## Evidence hygiene

Release notes and security records may include commit SHAs, PR numbers, CI run IDs, sanitized dashboard links, owner names, dates, and bounded summaries.

Release notes and security records must not include secrets, raw customer data, provider references, webhook payloads, database dumps, OTPs, cookies, bearer tokens, session IDs, or raw production logs.
