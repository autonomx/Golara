# Public order language label localization

## Slice

Move the public order status route language link labels into the existing public order copy bundle.

## Change

- Replaced direct `English` and `فارسی` JSX text in `app/orders/[token]/page.tsx` with `copy.languageEnglish` and `copy.languagePersian`.
- Kept the language nav accessible labels and current-language announcement on the same `publicOrderCopyFor()` bundle.
- Removed `app/orders/[token]/page.tsx` from the localization source audit allowlist.

## Verification

Pending GitHub Actions on the PR branch.

## Next candidates

1. Move profile language option labels into customer copy keys.
2. Define brand-literal handling for the homepage route.
3. Narrow `components/storefront/**` after component-level guards are reviewed.
