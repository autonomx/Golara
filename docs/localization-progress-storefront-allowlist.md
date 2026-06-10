# Storefront localization source allowlist progress

## Slice

Narrow the global route-shell localization source audit allowlist after the guarded storefront and customer account route slices landed.

## Guardrail update

- Replaced the blanket `app/**` audit exception with explicit deferred route groups:
  - `app/admin/**` remains allowlisted while admin route-boundary localization continues.
  - `app/api/**` remains allowlisted for the later server-copy phase.
  - Customer-facing route groups (`app/account/**`, `app/cart/**`, `app/categories/**`, `app/orders/**`, `app/products/**`, and `app/page.tsx`) are now explicit documented exceptions instead of being hidden by `app/**`.
- The first CI pass confirmed the generic source audit still flags typed JSX/code expressions in already-guarded customer-facing route shells, so this slice keeps those route groups explicit until the audit parser can distinguish code expressions from visible copy.
- Left `components/admin/**` and `components/storefront/**` as broad component exceptions for now; those should be narrowed component-by-component after route-shell coverage is complete.

## Protected by existing tests

- `tests/unit/localization-source-audit.test.ts` now protects against reintroducing a blanket `app/**` route-shell exception while still documenting remaining route-group exceptions.
- The existing focused storefront/account route guards cover the already-localized customer-facing route shells before this broader audit narrowing.

## Next candidates

1. Refine `tests/unit/localization-source-audit.test.ts` so it ignores JSX code expressions and only reports visible copy.
2. After parser refinement, reduce customer-facing route-group exceptions to per-file entries or remove them where the focused guards are enough.
3. Narrow `components/storefront/**` to explicit remaining component exceptions after the protected storefront component guards are reviewed.
4. Keep `app/admin/**` broad until the remaining admin route-boundary slices are covered or explicitly documented per path.
