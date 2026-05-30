# Phase 19.7 — Route/cookie locale resolution and storefront language switcher

## Goal

Make the storefront use the localized catalog/homepage projections added in earlier Phase 19 bundles, with a customer-visible language switcher backed by a locale cookie.

## Implemented

- Added `app/locale/actions.ts` with `setStorefrontLocaleAction()`.
- Added shared locale cookie constant in `lib/i18n/locale-cookie.ts`.
- Added `lib/i18n/resolve-locale.ts`.
- Added `components/LanguageSwitcher.tsx`.
- Updated `SiteHeader` to:
  - resolve storefront locale;
  - request localized category navigation;
  - render the language switcher;
  - keep users on the current route after changing locale.
- Updated storefront pages to resolve locale and request localized catalog/homepage projections:
  - `/`
  - `/products`
  - `/categories/[slug]`
  - `/products/[slug]`
- Updated storefront copy registry with localized catalog/category/navigation labels.
- Added optional locale props to product card/detail presentation components.

## Locale resolution order

`resolveStorefrontLocale()` currently resolves locale from:

1. `golara_locale` cookie;
2. `Accept-Language` header;
3. default locale `fa-IR`.

The language switcher writes the `golara_locale` cookie and redirects back to the current route.

## Supported locales

- `fa-IR`
- `en-CA`

## Storefront behavior

Localized data is requested from existing read paths by passing `{ locale }` into catalog repository calls.

The switcher does not create new `/fa` or `/en` route segments yet. This keeps existing routes stable while enabling customer-visible localized content.

## Safety behavior

- Return paths are constrained to same-origin relative paths.
- Existing route shapes remain unchanged.
- Existing admin routes remain unchanged.
- Existing translated catalog fallback behavior remains unchanged.
- Storefront pages set `dir` from the resolved locale.

## Follow-up

Future phases can add optional explicit locale URL segments such as `/en/products`, translated metadata generation, localized checkout/inquiry form copy, and translated slugs if needed for SEO.
