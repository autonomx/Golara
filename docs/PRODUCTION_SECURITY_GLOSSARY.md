# Production Security Glossary

Use this glossary to keep production security release documents, checklists, and sign-off records consistent.

## Terms

| Term | Meaning | Use in release docs |
| --- | --- | --- |
| Required check | A CI, deployment, or external provider status that must pass before merge or release. | Record the check name, PR, commit SHA, and final state. |
| External check | A status reported by a provider outside the repository CI workflow. | Classify separately from repository test failures. |
| Repository-side failure | A failed test, build, source gate, or script caused by repository contents. | Inspect logs and patch the same branch. |
| External blocker | A failed or unavailable provider status not caused by repository contents. | Document the provider context and wait for recovery or owner action. |
| Exact head SHA | The commit SHA being validated by checks for a PR. | Merge only after required checks are green on this SHA. |
| Evidence index | The release record that links bounded proof for CI, deployment, policy, and sign-off work. | Store links and summaries, not sensitive operational data. |
| Launch decision | A production/security choice that must be made before launch or accepted as a follow-up. | Record owner, decision, rationale, and review date. |
| Release exception | A known non-blocking gap accepted for a specific release scope. | Track owner, expiry, and follow-up. |
| Audit closeout | The point where the current audit scope is documented, reviewed, and accepted or deferred. | Confirm merged work, open blockers, and next review cadence. |
| Post-release watch | The first monitoring period after release. | Track security events, payment/webhook behavior, headers, abuse signals, and rollback readiness. |
| Maintenance cadence | The recurring schedule for reviewing reusable security docs and controls. | Assign owners and record review outcomes. |

## Usage checklist

- Use the same term across PR bodies, checklist records, and evidence indexes.
- Separate repository failures from external provider blockers.
- Include the exact commit SHA when recording check results.
- Keep reusable definitions in this glossary and release-specific decisions in release records.
- Update this glossary when a recurring security release term becomes ambiguous.
