# Phase 11.4-11.6 — Account/login Persian copy pass

This bundle starts migrating customer account surfaces onto the Phase 11 copy registry without changing authentication or account behavior.

## Goals

- Use the shared customer copy registry for account, login, and profile surfaces.
- Preserve the existing phone-first OTP flow and server validation.
- Keep the migration small so future order/address copy passes are easier to review.
- Opt signed-in account/profile views into RTL layout when the customer locale is Persian.

## Implemented foundation

- Expanded `lib/localization/customer-copy.ts` with account, login, profile, and shared navigation labels.
- Broadened locale normalization so `fa-IR` maps to Persian copy/RTL.
- Migrated `/account` static labels to the registry.
- Migrated `/account/login` static labels to the registry with English fallback.
- Migrated `/account/profile` static labels to the registry.
- Added `dir="rtl"` for signed-in `/account` and `/account/profile` when the saved customer locale is Persian.

## Scope note

Status/error messages remain English in this bundle because they are tied to existing query-string status values and should be localized in a focused follow-up pass.

The order history and address-book pages are intentionally deferred to keep this PR narrow.

## Manual QA checklist

- `/account` still renders for signed-out customers.
- Signed-in `/account` still shows profile details, saved-address summary, edit link, order-history link, and logout.
- `/account/login` still requests and verifies OTP codes with the same form field names.
- `/account/profile` still updates display name, email, and locale with the same server action.
- Persian saved locale renders signed-in account/profile pages with RTL direction.
- English or missing locale renders with LTR direction.
