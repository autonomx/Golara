# Localization progress — profile language labels

## Scope

- Route: `app/account/profile/page.tsx`
- Copy helper: `lib/localization/customer-locale-options.ts`
- Guard: `tests/unit/storefront-profile-route-copy.test.ts`
- Source audit allowlist: `tests/fixtures/localization-source-audit-allowlist.txt`

## Completed in this slice

- Moved the profile language select labels out of direct JSX text and into a localized customer locale-option helper.
- Rendered the profile language options through `getCustomerLocaleOptionLabel()` so English and Persian labels resolve from the active customer locale.
- Removed `app/account/profile/page.tsx` from the localization source-audit allowlist.
- Extended the profile route copy guard to assert both locale-option labels, helper usage, and allowlist removal.

## Remaining follow-ups

- Define homepage brand-literal handling for `app/page.tsx`, then remove that route exception.
- Review `components/storefront/**` and narrow it to component-level exceptions or localized component guards.
- Continue admin route/component extraction before removing the admin allowlist groups.
