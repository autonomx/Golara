# Production Security External Check Status

Use this guide when a release or security PR has passing GitHub Actions but an external status provider is failed, delayed, or rate-limited.

This document does not override branch protection or release policy. If required checks include the external provider, do not merge until the provider status is green or an explicitly approved maintainer exception is recorded outside the repository.

## Triage steps

1. Confirm the exact PR head SHA.
2. Check GitHub Actions for the same SHA and record whether CI completed successfully.
3. Check the external provider status context and target URL.
4. Classify the blocker as one of:
   - repository failure: the external provider ran the project and failed because of code, tests, build output, config, or deployment behavior;
   - external capacity/provider failure: the external provider did not run or complete because of quota, rate limit, provider outage, or account capacity;
   - unknown: the provider status is ambiguous or lacks enough detail.
5. If the blocker is a repository failure, fix the branch and rerun the full checks.
6. If the blocker is external capacity/provider failure, wait for the provider to clear or rerun the provider build when capacity is available.
7. If the blocker is unknown, treat it as a release blocker until a maintainer can classify it.

## Evidence to record

Record only bounded release evidence:

- PR number and title.
- Exact head SHA.
- GitHub Actions run ID and conclusion.
- External provider context, conclusion, and sanitized target URL.
- Classification and owner.
- Decision: wait, rerun, patch, or explicitly defer outside the repository.

## Hygiene requirements

Do not store provider secrets, raw logs, environment variable values, customer data, webhook payloads, session identifiers, bearer tokens, cookies, OTPs, database dumps, or raw production logs in this document or in release notes.

Use links to provider dashboards only when the dashboard is access-controlled and the link does not reveal sensitive query parameters or credentials.

## Merge guidance

- Green GitHub Actions alone is not sufficient when an external provider is a required check.
- Do not patch repository code for an external capacity/provider failure unless there is evidence that the repository caused the provider failure.
- Do not merge through a failed required external check unless the repository maintainers have an approved exception process and the exception is recorded outside public repo artifacts.
- After the provider clears, re-check the exact head SHA before merging.
