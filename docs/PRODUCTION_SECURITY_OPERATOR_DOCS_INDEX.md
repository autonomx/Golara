# Production Security Operator Docs Index

Use this index as the starting point for a Golara production security release review or production-impacting configuration change. It links the security documents that operators should consult before launch, during sign-off, and during incident response.

Do not copy raw secrets, customer PII, provider references, webhook bodies, database dumps, OTPs, cookies, access tokens, or raw log exports into these documents or linked release records.

## Release planning and sign-off

| Document | Use during release |
| --- | --- |
| `docs/SECURITY_AUDIT_REPORT.md` | Confirm the current audit position, completed security hardening, remaining roadmap items, and phase-specific follow-up work. |
| `docs/PRODUCTION_SECURITY_DEPLOYMENT_CHECKLIST.md` | Walk the required production security checks before enabling or changing production traffic. |
| `docs/PRODUCTION_SECURITY_RELEASE_EVIDENCE_INDEX.md` | Collect bounded links and summaries for CI, deployment, policy, risk, and post-release evidence. |
| `docs/SECURITY_RELEASE_SIGNOFF_TEMPLATE.md` | Record final approval, known risks, release owner, rollback readiness, and evidence references. |

## Policies and launch decisions

| Document | Use during release |
| --- | --- |
| `docs/PRODUCTION_SESSION_LIFETIME_POLICY.md` | Decide admin/customer session lifetimes, OTP bridge expiry, revocation behavior, and privileged re-auth follow-up. |
| `docs/PUBLIC_ABUSE_THROTTLING_POLICY.md` | Decide whether in-process throttles are acceptable or whether distributed/persistent throttling is required for launch. |
| `docs/PUBLIC_INQUIRY_SPAM_POLICY.md` | Decide baseline public inquiry spam controls, escalation triggers, and stronger anti-automation requirements. |
| `docs/CSP_REPORTING_AND_TIGHTENING_POLICY.md` | Decide report-only/enforced CSP posture, monitoring expectations, exception review, and tightening cadence. |
| `docs/MEDIA_MALWARE_AND_METADATA_POLICY.md` | Decide media malware scanning, metadata stripping, accepted risk, evidence, and review cadence. |
| `docs/BACKUP_AND_RESTORE_POLICY.md` | Decide database/media backup cadence, retention, restore-test expectations, ownership, and evidence hygiene. |
| `docs/DEPENDENCY_ADVISORY_EXCEPTION_POLICY.md` | Review high/critical advisory exceptions, mitigation, owner, expiry, and evidence requirements. |
| `docs/PACKAGE_INTEGRITY_AND_LICENSE_POLICY.md` | Review production-facing package additions for license suitability, maintenance, publisher/integrity risk, lockfile impact, and exceptions. |

## Incident response and operations

| Document | Use during operations |
| --- | --- |
| `docs/SECURITY_INCIDENT_RESPONSE_RUNBOOK.md` | Triage, preserve bounded evidence, contain, communicate, recover, and close security incidents. |
| `docs/PRODUCTION_SECURITY_DEPLOYMENT_CHECKLIST.md` | Re-run relevant checks after emergency fixes, provider changes, credential rotation, or production configuration changes. |
| `docs/PRODUCTION_SECURITY_RELEASE_EVIDENCE_INDEX.md` | Record bounded post-release evidence such as production smoke checks, payment/webhook health, abuse-event monitoring, alert dashboard checks, and rollback availability. |

## When adding new security documents

- Link the new document from the production checklist or the relevant policy section when it becomes release-blocking.
- Update this index if the document should be visible to operators during release planning, launch sign-off, or incident response.
- Keep release evidence bounded: prefer links to access-controlled systems and short pass/fail summaries over copied raw output.
- Avoid duplicating policy requirements across multiple documents; link to the policy that owns the decision.
