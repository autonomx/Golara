# Production Security Release Evidence Index

Use this index to collect bounded links and summaries for a Golara production release or production-impacting configuration change. Keep completed evidence in the release tracker or deployment system unless repository storage is explicitly approved.

Do not include raw secrets, customer PII, provider references, webhook bodies, database dumps, OTPs, cookies, access tokens, raw log exports, or screenshots containing sensitive values.

## Release identity

- Release name/version:
- Release owner:
- Planned deployment window:
- Exact release commit or artifact identifier:
- Production environment(s):
- Sign-off record link:

## CI and deployment evidence

Use links to access-controlled CI/deployment systems. Record only pass/fail status and bounded notes.

| Evidence item | Status | Link or reference | Bounded notes |
| --- | --- | --- | --- |
| Supply-chain audit | | | |
| Runtime/source gates | | | |
| Typecheck | | | |
| Unit tests | | | |
| Functional tests | | | |
| API tests | | | |
| Nonbrowser tests | | | |
| E2E contracts | | | |
| Production-like E2E contracts | | | |
| Coverage | | | |
| Build | | | |
| Route smoke / security headers | | | |
| Vercel or deployment preview | | | |

## Policy and checklist evidence

| Area | Evidence link or reference | Owner | Notes |
| --- | --- | --- | --- |
| Production security deployment checklist | | | |
| Security audit roadmap current for release scope | | | |
| Incident response runbook visible to operators | | | |
| Session lifetime/revocation policy decision | | | |
| Public abuse throttling policy decision | | | |
| Public inquiry spam policy decision | | | |
| CSP reporting/tightening decision | | | |
| Media malware/metadata decision | | | |
| Backup/restore decision and restore-test evidence | | | |
| Dependency advisory exception review | | | |
| Package integrity/license review | | | |

## Open risks and exceptions

Use bounded summaries only. Link to approved risk records where needed.

| Risk or exception | Severity | Owner | Mitigation | Expiry or target date | Reference |
| --- | --- | --- | --- | --- | --- |
| | | | | | |

## Evidence hygiene confirmation

- [ ] Evidence does not include raw secrets or credentials.
- [ ] Evidence does not include customer PII.
- [ ] Evidence does not include OTPs, cookies, session tokens, or access tokens.
- [ ] Evidence does not include provider references, webhook bodies, or raw payment payloads.
- [ ] Evidence does not include database dumps or raw log exports.
- [ ] Evidence links point to access-controlled systems.
- [ ] Screenshots, if any, are redacted and necessary for release evidence.

## Post-release evidence

Complete after deployment.

| Evidence item | Status | Link or reference | Bounded notes |
| --- | --- | --- | --- |
| Deployment completed | | | |
| Production smoke/security-header checks | | | |
| Payment/webhook health check | | | |
| Abuse/security event monitoring check | | | |
| Error-rate and alert dashboard check | | | |
| Rollback plan availability confirmed | | | |
