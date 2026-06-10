# Localization source audit parser refinement

## Slice

Refine the route-shell source audit so the app route allowlist can stay narrow after storefront and customer account route guards have landed.

## Change

- Added classifier coverage inside `tests/unit/localization-source-audit.test.ts` for JSX code-expression fragments reported by the generic matcher.
- Kept human-readable labels such as locale option text classified as visible copy.
- Reduced customer-facing route exceptions from route groups to explicit route files:
  - `app/account/profile/page.tsx` for direct language option labels.
  - `app/orders/[token]/page.tsx` for direct public order language option labels reported by CI.
  - `app/page.tsx` for the brand literal.

## CI follow-up

The first PR run passed typecheck but failed unit/source-audit on:

- `app/cart/page.tsx` for the boolean fragment `value > 0 && value`.
- `app/orders/[token]/page.tsx` for the visible label `English`.

The boolean fragment is now covered as a code-expression classifier case. The visible public-order language label remains copy, so it is documented as an explicit route exception until the label moves into public order copy keys.

## Next candidates

1. Move profile language option labels into customer copy keys.
2. Move public order language option labels into public order copy keys.
3. Define brand-literal handling for the homepage route.
4. Narrow `components/storefront/**` after component-level guards are reviewed.
