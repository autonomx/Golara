# Phase 11.13-15 — Storefront locale carryover

Status: in progress.

## Completed so far

- Rechecked PR #437 GitHub Actions after merge; the exact PR head CI run completed successfully.
- Carried the resolved storefront locale into the account overview page when no customer session is available.
- Passed the resolved account overview locale into `SiteHeader` so the shared header language controls stay aligned with the page copy.
- Added `/account` to route smoke with English and Persian content expectations.
- Normalized optional `SiteHeader` locale props internally so customer/session locale strings resolve to supported storefront locales before navigation and language-switcher rendering.
- Added `/account/profile` to route smoke status coverage so the profile route is checked across database-disabled and unauthenticated redirect modes.

## Verification

- PR #437 exact-head CI: run `27185401452`, conclusion `success`.
- PR #438 exact-head CI: run `27186009345`, conclusion `success`.
- New account-profile route smoke PR CI is required before merge.

## Follow-ups

- Account profile signed-in header locale alignment remains a code follow-up because the connector safety filter blocked the profile-page write in this session.
- Continue auditing customer-account and checkout-adjacent pages for remaining `SiteHeader` locale gaps.
- Expand route smoke or unit coverage for RTL/customer locale behavior where the current stable smoke harness can cover it without browser automation.
