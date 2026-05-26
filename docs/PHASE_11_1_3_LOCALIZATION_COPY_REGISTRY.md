# Phase 11.1-11.3 — Localization copy registry

This bundle starts Phase 11 by adding a small customer-facing copy registry for English and Persian strings.

## Goals

- Centralize common customer-facing labels before broader Persian copy passes.
- Keep English fallback behavior intact.
- Avoid a full i18n framework rewrite while the storefront copy surface is still small.
- Add a direction helper so future Persian surfaces can opt into RTL layout intentionally.

## Added foundation

- `lib/localization/customer-copy.ts`
- Typed `CustomerCopyLocale` union for `en` and `fa`.
- Typed `CustomerCopyKey` union for common account, login, cart, checkout, order-history, order-status, and shared labels.
- English and Persian copy maps with complete key coverage.
- `normalizeCustomerCopyLocale` helper that falls back to English for unsupported or missing locales.
- `getCustomerCopy` helper for safe lookup with English fallback.
- `getCustomerCopyDirection` helper for `ltr`/`rtl` rendering decisions.

## Scope note

This bundle intentionally does not rewrite pages to consume the registry yet. The next Phase 11 bundles should migrate surfaces one group at a time so visual regressions are easier to review.

Recommended next steps:

1. Migrate `/account`, `/account/login`, `/account/orders`, `/account/addresses`, and `/account/profile` to the registry.
2. Add `dir="rtl"` only where the selected copy locale is Persian.
3. Preserve existing route behavior and server validation.
4. Follow with cart/checkout copy after account/login surfaces are stable.

## Manual QA checklist

- Confirm TypeScript accepts all copy keys.
- Confirm unsupported locale values fall back to English.
- Confirm Persian locale maps to RTL direction.
- Confirm English locale maps to LTR direction.
- Confirm the registry does not change runtime behavior until pages opt into it.
