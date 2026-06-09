# Phase 11.16 — Account profile smoke coverage

Status: verified.

## Completed

- Added account profile route coverage to the storefront route smoke suite.
- Verified the route smoke expansion in PR #439.

## Verification

- PR #439 exact-head CI run `27186213500` completed successfully.
- The passing run included typecheck, unit tests, functional tests, API tests, nonbrowser tests, E2E contract tests, production-like E2E contracts, build, and route smoke.

## Next

- Align signed-in account profile header locale with the saved customer locale.
- Add more unit coverage for customer/storefront locale normalization.
