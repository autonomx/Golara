# Storefront localization source allowlist progress

## Slice

Narrow the global route-shell localization source audit allowlist after the guarded storefront and customer account route slices landed.

## Guardrail update

- Replaced the blanket `app/**` audit exception with explicit deferred route groups:
  - `app/admin/**` remains allowlisted while admin route-boundary localization continues.
  - `app/api/**` remains allowlisted for the later server-copy phase.
- Left `components/admin/**` and `components/storefront/**` as broad component exceptions for now; those should be narrowed component-by-component after route-shell coverage is complete.

## Protected by existing tests

- `tests/unit/localization-source-audit.test.ts` now audits non-admin, non-API `app/**/(page|loading|error).tsx` route shells instead of skipping every app route through `app/**`.
- The existing focused storefront/account route guards cover the already-localized customer-facing route shells before this broader audit narrowing.

## Next candidates

1. Narrow `components/storefront/**` to explicit remaining component exceptions after the protected storefront component guards are reviewed.
2. Add source guards for any remaining storefront components that still rely on direct visible copy.
3. Keep `app/admin/**` broad until the remaining admin route-boundary slices are covered or explicitly documented per path.
