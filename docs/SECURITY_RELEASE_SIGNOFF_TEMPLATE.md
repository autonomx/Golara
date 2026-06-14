# Security Release Sign-off Template

Use this template for Golara production releases and production-impacting configuration changes. Keep the completed record in the release tracker or deployment system, not as a repository commit unless explicitly approved.

Do not include raw secrets, customer PII, provider references, webhook bodies, database dumps, OTPs, cookies, access tokens, or raw log exports in the sign-off record.

## Release identity

- Release name/version:
- Release owner:
- Planned deployment window:
- Exact release commit or artifact identifier:
- Production environment(s):
- Related PRs/issues:

## Required CI and source gates

Record pass/fail status and links to CI runs or deployment evidence.

- Supply-chain audit:
- Runtime/source gates:
- Typecheck:
- Unit tests:
- Functional tests:
- API tests:
- Nonbrowser tests:
- E2E contracts:
- Production-like E2E contracts:
- Coverage:
- Build:
- Route smoke / security headers:

## Security checklist references

Confirm each linked checklist or policy item was reviewed for this release scope.

- Production security deployment checklist:
- Incident response runbook:
- Public abuse throttling policy:
- CSP reporting/tightening policy:
- Backup and restore policy:
- Dependency advisory exception policy:

## Deployment readiness

- Production secrets/configuration reviewed:
- Payment provider/webhook configuration reviewed:
- Public abuse controls reviewed:
- Monitoring and alert destinations reviewed:
- Backup/restore readiness reviewed:
- Dependency advisory exceptions reviewed:

## Open risks and exceptions

Use bounded summaries only. Link to approved risk records where needed.

| Risk/exception | Severity | Owner | Mitigation | Expiry/target date |
| --- | --- | --- | --- | --- |
| | | | | |

## Evidence hygiene check

- [ ] No raw secrets or credentials included.
- [ ] No customer PII included.
- [ ] No OTPs, cookies, session tokens, or access tokens included.
- [ ] No provider references, webhook bodies, or raw payment payloads included.
- [ ] No database dumps or raw log exports included.
- [ ] Evidence links point to access-controlled systems.

## Approval

- Engineering owner:
- Security/release reviewer:
- Operations/on-call owner:
- Approval timestamp:
- Release decision: approved / delayed / rejected

## Post-release validation

Complete after deployment.

- Deployment completed at:
- Production smoke/security-header checks passed:
- Payment/webhook health checked:
- Abuse/security event monitoring checked:
- Error-rate and alert dashboards checked:
- Rollback plan still available until:
