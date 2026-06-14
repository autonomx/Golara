# Dependency Advisory Exception Policy

This policy defines how Golara handles production dependency advisories that cannot be remediated before a release.

The default decision is to block release on unresolved high or critical production advisories. Exceptions are temporary and require explicit ownership, mitigation, and expiry.

## Scope

This policy applies to production dependency audit findings, lockfile changes, package additions, transitive dependency advisories, and supply-chain review decisions for production-facing code.

It does not replace CI. The production dependency audit and committed-secret scanning gates must continue to run before release.

## Exception requirements

Every advisory exception must record:

- advisory identifier or package name;
- affected version range;
- production exposure assessment;
- owner responsible for remediation;
- rationale for accepting temporary risk;
- mitigation in place before release;
- expiry date or target remediation release;
- review date and approver.

Do not include private vulnerability reproduction payloads, production secrets, customer data, provider references, webhook bodies, database exports, or raw environment values in exception records.

## Accepted exception criteria

An exception may be accepted only when all of the following are true:

1. The affected package is not reachable from production traffic, or the vulnerable path is disabled, guarded, or otherwise mitigated.
2. A remediation owner is assigned.
3. The exception has a short expiry date.
4. The release owner documents why delaying the release is higher risk than temporarily accepting the advisory.
5. CI still passes all non-excepted gates.

Critical advisories in reachable production paths require an explicit launch-blocker decision unless a compensating control is documented and approved.

## Remediation workflow

1. Prefer upgrading or removing the affected package.
2. If no safe upgrade exists, assess whether the vulnerable path is production-reachable.
3. Add a temporary exception only when the accepted criteria are met.
4. Track the exception to expiry.
5. Remove the exception after upgrade, removal, or replacement.

## Lockfile and package review

Before release, reviewers should check whether lockfile or package changes introduce:

- new production transitive dependency trees;
- unmaintained or deprecated packages;
- unexpected install scripts;
- license incompatibility;
- package-name confusion or publisher/integrity risk;
- broad dependency additions for narrow functionality.

## Evidence hygiene

Release evidence may include package names, advisory IDs, severity, mitigations, owners, and expiry dates.

Release evidence must not include raw secrets, tokens, cookies, customer PII, provider credentials, provider references, webhook payloads, database dumps, or private exploit payloads.

## Ownership and review

The release owner is responsible for ensuring exceptions are documented before launch. The remediation owner is responsible for resolving or renewing the exception before expiry.

Exceptions should be reviewed before each production release and during incident postmortems when a dependency or package-integrity issue is relevant.
