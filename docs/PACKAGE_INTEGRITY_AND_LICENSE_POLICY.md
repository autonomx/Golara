# Package Integrity and License Policy

This policy defines the production-review expectations for adding, updating, or approving third-party packages in Golara.

It complements `docs/DEPENDENCY_ADVISORY_EXCEPTION_POLICY.md` and the production dependency audit gate. Do not store raw registry credentials, private tokens, customer data, package manager auth files, or internal incident evidence in package-review notes.

## Baseline controls

Before production release, confirm:

- `npm audit --omit=dev --audit-level=high` passes or every exception follows the advisory exception policy.
- Committed-secret scanning passes after dependency or lockfile changes.
- Lockfile changes are reviewed with the same scrutiny as source changes.
- New packages are justified by production need, not convenience alone.
- Package review evidence is bounded and does not include secrets, private registry tokens, or raw customer data.

## Required package review fields

For each new production-facing package, record:

- package name and version range;
- production or development scope;
- reason the package is needed;
- maintainer and release activity summary;
- license and compatibility decision;
- direct transitive-risk concerns, if any;
- whether the package runs build scripts, postinstall scripts, native code, or network access during install/build;
- owner responsible for future upgrade/removal decisions.

## License suitability

Before release, decide whether each new package license is:

1. **Accepted** — license is compatible with Golara production distribution and operational use.
2. **Accepted with conditions** — legal/product review approved specific conditions.
3. **Rejected** — package must be removed or replaced before release.

Do not merge or release a rejected package. If legal review is required, record only the decision and owner in repository docs; keep privileged legal notes out of public or broad-access release evidence.

## Publisher and integrity review

Review package risk when a dependency is new, abandoned, recently transferred, has unusual version churn, or introduces install/build scripts. At minimum, check:

- package name typosquatting risk;
- maintainer or publisher continuity;
- recent release history and unexpected major changes;
- install/build script behavior;
- native binary or downloaded artifact behavior;
- whether the dependency is production reachable or only build/dev tooling.

If risk is unclear, prefer a smaller dependency, first-party implementation, or explicit owner-approved exception with an expiry date.

## Lockfile review expectations

Lockfile changes must be reviewed for:

- unexpected new transitive packages;
- package source or registry changes;
- version jumps unrelated to the intended change;
- added install scripts or native package dependencies;
- production dependency movement from dev-only to runtime scope.

Large lockfile updates should be isolated from unrelated feature changes when practical.

## Exception handling

Package integrity or license exceptions must include:

- owner;
- rationale;
- scope and affected package/version;
- mitigation;
- expiry or review date;
- rollback/replacement plan.

Security vulnerability exceptions must also follow `docs/DEPENDENCY_ADVISORY_EXCEPTION_POLICY.md`.

## Review cadence

Revisit this policy:

- before production launch;
- after adding major runtime dependencies;
- after package compromise advisories affecting the ecosystem;
- during dependency refreshes that change many transitive packages;
- after incident or near-miss findings involving package supply chain risk.
