# Phase 7.13-7.15 add-to-cart UI wiring

This bundle wires the existing cart server actions into storefront product surfaces.

## Added behavior

- Product detail pages now show an add-to-cart form with quantity selection.
- Product cards now show a compact add-to-cart button.
- Product detail add-to-cart remains disabled when the database-backed product catalog is not available.
- Product cards remain linkable to product detail pages while adding a separate cart action area.
- Add-to-cart forms post to the existing `addToCartAction` and return to the product detail page with cart status parameters.

## Current scope

This is UI wiring only. It does not change cart repository behavior, cart checkout conversion, payment handling, or database schema.

## Follow-up bundles

1. Add a header cart link/count affordance.
2. Add cart checkout localization and field-level validation polish.
3. Add basic cart smoke tests when the test runner path is introduced.
4. Close out Phase 7 once cart UI, checkout conversion, and docs are stable.
