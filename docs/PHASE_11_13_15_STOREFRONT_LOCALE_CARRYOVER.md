# Phase 11.13-15 — Storefront locale carryover

Status: in progress.

## Completed in this slice

- Rechecked PR #437 GitHub Actions after merge; the exact PR head CI run completed successfully.
- Carried the resolved storefront locale into the account overview page when no customer session is available.
- Passed the resolved account overview locale into `SiteHeader` so the shared header language controls stay aligned with the page copy.
- Added `/account` to route smoke with English and Persian content expectations.

## Verification

- PR #437 exact-head CI: run `27185401452`, conclusion `success`.
- New `x443` PR CI is required before merge.

## Follow-ups

- Account profile locale/header alignment remains a follow-up because the connector safety filter blocked the profile-page write in this session.
- Continue auditing customer-account and checkout-adjacent pages for remaining `SiteHeader` locale gaps.
- Expand route smoke or unit coverage for RTL/customer locale behavior where the current stable smoke harness can cover it without browser automation.
