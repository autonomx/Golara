# Production Security Deployment Checklist

This checklist captures production-readiness controls that must be reviewed before enabling or changing Golara production traffic. It complements the security audit roadmap and the incident response runbook.

Use this as a release gate checklist. Do not store raw secrets, customer PII, provider references, webhook bodies, database dumps, OTPs, cookies, or access tokens in checklist evidence.

## 1. Secrets and credentials

- [ ] Production admin/customer session secrets are present, unique, sufficiently long, and not default placeholders.
- [ ] Payment provider secrets, webhook secrets, API keys, database credentials, object-storage credentials, and email/SMS provider credentials are stored only in the deployment secret manager.
- [ ] No production secrets are committed to the repository or copied into issue/PR/runbook notes.
- [ ] Rotation owners and rotation steps are documented for admin/customer session secrets, payment credentials, database credentials, and media/storage credentials.
- [ ] Emergency revocation steps are documented for leaked admin/customer sessions and provider credentials.

## 2. Browser headers and CSP

- [ ] Production responses include HSTS, CSP, frame, nosniff, referrer-policy, and permissions-policy headers.
- [ ] Route smoke or equivalent production-like checks pass after deployment.
- [ ] CSP exceptions are reviewed before each release and tied to required storefront/admin/payment-provider behavior.
- [ ] Any `unsafe-inline` or third-party script/image/connect allowances are documented with an owner and removal plan where practical.
- [ ] CSP reporting or monitoring decision is documented before launch, following `docs/CSP_REPORTING_AND_TIGHTENING_POLICY.md`.

## 3. Payment providers and webhooks

- [ ] Webhook endpoint URLs are configured only for intended production providers.
- [ ] Provider webhook signatures/raw-body verification is enabled and tested in production-like mode.
- [ ] Payment settlement reconciliation checks expected amount and currency before paid state transitions.
- [ ] Provider-reference lookups require order/public-token corroboration where applicable.
- [ ] Duplicate webhook replay is idempotent and does not re-run settlement or state mutation.
- [ ] Payment return/callback handling only forwards normalized provider references and ignores unexpected query/body fields.
- [ ] Provider dashboard access is limited to authorized operators and protected by MFA where available.

## 4. Public abuse controls

- [ ] Public order lookup, inquiry, cart mutation, OTP request, and login throttles are enabled in production.
- [ ] In-process throttles have an accepted-risk note or a distributed/persistent throttle plan for multi-instance deployments, following `docs/PUBLIC_ABUSE_THROTTLING_POLICY.md`.
- [ ] Throttle and cooldown security events store only bounded/redacted metadata and hashed identifiers.
- [ ] Monitoring can surface spikes in public order lookup failures, OTP request blocks, inquiry cooldowns, cart mutation throttles, and admin authorization denials.

## 5. Monitoring and alerting

- [ ] Production logs include bounded/redacted security events for admin login, admin authorization denial, payment webhook outcomes, public abuse throttles, OTP blocks, and media audit activity.
- [ ] Alerts exist for repeated admin login failures, authorization denials, payment settlement mismatches, webhook signature failures, public-abuse spikes, and suspicious media upload failures.
- [ ] Alert destinations and escalation owners are documented.
- [ ] Monitoring dashboards avoid raw PII, secrets, provider references, webhook payloads, and database dumps.
- [ ] Incident response runbook links are visible to on-call operators.

## 6. Backups and recovery

- [ ] Database backup cadence, retention, encryption, and restore ownership are documented, following `docs/BACKUP_AND_RESTORE_POLICY.md`.
- [ ] A production-like restore test has been completed or scheduled before launch.
- [ ] Media/object-storage backup or provider-retention policy is documented.
- [ ] Backup access is restricted to authorized operators and audited.
- [ ] Recovery validation includes order/payment consistency, inventory reservations, customer sessions, and admin access.

## 7. Dependency and supply-chain policy

- [ ] CI production dependency audit passes for high/critical vulnerabilities.
- [ ] Any advisory exception has an owner, rationale, mitigation, and expiry date, following `docs/DEPENDENCY_ADVISORY_EXCEPTION_POLICY.md`.
- [ ] Lockfile changes are reviewed as part of release approval.
- [ ] Package additions are checked for maintenance status, license suitability, and publisher/package integrity risk when production-facing.
- [ ] Committed-secret scanning passes before release.

## 8. Release evidence and sign-off

- [ ] Required CI gates passed on the exact release commit or deployment artifact.
- [ ] Security audit roadmap is current for the release scope.
- [ ] Incident response runbook and deployment checklist are linked from release notes or operator docs.
- [ ] Open security risks are documented with an owner, severity, mitigation, and target date.
- [ ] Release sign-off uses `docs/SECURITY_RELEASE_SIGNOFF_TEMPLATE.md` and records only bounded evidence.
- [ ] Release sign-off records never include raw secrets, PII, OTPs, cookies, tokens, provider references, webhook bodies, or database dumps.
