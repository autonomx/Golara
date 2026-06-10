# Localization source audit parser refinement

## Slice

Refine the route-shell source audit so the app route allowlist can stay narrow after storefront and customer account route guards have landed.

## Change

- Added classifier coverage inside `tests/unit/localization-source-audit.test.ts` for JSX code-expression fragments reported by the generic matcher.
- Kept human-readable labels such as locale option text classified as visible copy.
- Reduced customer-facing route exceptions from route groups to explicit route files:
  - `app/account/profile/page.tsx` for direct language option labels.
  - `app/page.tsx` for the brand literal.

## Next candidates

1. Move profile language option labels into customer copy keys.
2. Define brand-literal handling for the homepage route.
3. Narrow `components/storefront/**` after component-level guards are reviewed.
