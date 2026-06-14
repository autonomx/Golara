# Production Security Launch Decision Register

Use this register to track production launch or production-impacting security decisions that must be made by operators before release. Keep completed records in the release tracker or deployment system unless repository storage is explicitly approved.

Do not include raw secrets, customer PII, provider references, webhook bodies, database dumps, OTPs, cookies, access tokens, raw log exports, or screenshots containing sensitive values.

## Release identity

- Release name/version:
- Release owner:
- Exact release commit or artifact identifier:
- Production environment(s):
- Decision register owner:
- Security sign-off record link:
- Evidence index link:

## Decision status values

- **Approved** — decision is accepted for this release.
- **Approved with mitigation** — decision is accepted with tracked mitigation and owner.
- **Deferred** — decision is not required for this release scope.
- **Blocked** — release must not proceed until the decision is resolved.

## Required launch decisions

| Decision area | Policy reference | Status | Owner | Decision summary | Mitigation / follow-up | Review date | Evidence reference |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Session lifetime, renewal, revocation, and privileged re-auth | `docs/PRODUCTION_SESSION_LIFETIME_POLICY.md` | | | | | | |
| Public abuse throttling mode and multi-instance risk | `docs/PUBLIC_ABUSE_THROTTLING_POLICY.md` | | | | | | |
| Public inquiry spam and anti-automation posture | `docs/PUBLIC_INQUIRY_SPAM_POLICY.md` | | | | | | |
| CSP reporting, enforcement, and tightening plan | `docs/CSP_REPORTING_AND_TIGHTENING_POLICY.md` | | | | | | |
| Media malware scanning and metadata stripping | `docs/MEDIA_MALWARE_AND_METADATA_POLICY.md` | | | | | | |
| Backup cadence, restore testing, and media retention | `docs/BACKUP_AND_RESTORE_POLICY.md` | | | | | | |
| Dependency advisory exceptions | `docs/DEPENDENCY_ADVISORY_EXCEPTION_POLICY.md` | | | | | | |
| Package integrity and license suitability | `docs/PACKAGE_INTEGRITY_AND_LICENSE_POLICY.md` | | | | | | |
| Security release sign-off completeness | `docs/SECURITY_RELEASE_SIGNOFF_TEMPLATE.md` | | | | | | |

## Optional or release-scope-dependent decisions

Use this section for decisions that are not required for every release but become relevant when the release changes the corresponding surface.

| Decision area | Trigger | Status | Owner | Decision summary | Mitigation / follow-up | Review date | Evidence reference |
| --- | --- | --- | --- | --- | --- | --- | --- |
| New payment provider settlement/refund controls | Provider integration, refund flow, or webhook mapping changes | | | | | | |
| New public API/listing/filter surface controls | Public API, search, sorting, pagination, or filter surface changes | | | | | | |
| New admin diagnostics or audit-log views | Admin diagnostics, logs, or operational dashboards are added | | | | | | |
| New media delete lifecycle controls | Media deletion helpers or ownership-sensitive media flows are added | | | | | | |
| New rich text, Markdown, email, or SMS rendering controls | User-provided rich content or outbound templates are added | | | | | | |
| New security-event source or alerting requirement | Security-relevant event source is added or changed | | | | | | |

## Decision hygiene confirmation

- [ ] Each **Approved with mitigation** or **Blocked** decision has an owner and target date.
- [ ] Each decision links to bounded evidence rather than copying sensitive evidence inline.
- [ ] Decision records do not include raw secrets, credentials, OTPs, cookies, session tokens, or access tokens.
- [ ] Decision records do not include customer PII, provider references, webhook bodies, payment payloads, database dumps, or raw log exports.
- [ ] Access-controlled release tracker links are used for detailed evidence where needed.
- [ ] Deferred decisions clearly state why they are outside this release scope.
