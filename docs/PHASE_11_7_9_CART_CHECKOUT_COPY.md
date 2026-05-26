# Phase 11.7-11.9 — Cart/checkout Persian copy pass

This bundle migrates the cart and cart checkout surfaces onto the Phase 11 customer copy registry without changing cart, checkout, or payment behavior.

## Goals

- Use the shared customer copy registry for cart and checkout static labels.
- Preserve existing cart actions, checkout form field names, server validation, and payment handoff flow.
- Keep English fallback behavior intact.
- Use the signed-in customer locale on checkout when available.

## Implemented foundation

- Expanded `lib/localization/customer-copy.ts` with cart and checkout labels.
- Added English and Persian copy for cart headings, empty states, quantity controls, summary labels, checkout form labels, and checkout helper text.
- Migrated `/cart` static labels to the customer copy registry.
- Migrated `/cart/checkout` static labels to the customer copy registry.
- Checkout now uses the signed-in customer locale and direction helper when a customer session exists.
- Signed-out checkout keeps English fallback copy.

## Scope note

This bundle intentionally keeps cart and checkout status/error messages in English because they are tied to existing query-string status values. Localized status messages should be handled in a focused follow-up pass.

Public storefront product/category/homepage copy remains deferred to the next Phase 11 bundle.

## Manual QA checklist

- `/cart` still renders empty-cart and populated-cart states.
- Cart quantity update, item removal, and clear-cart forms keep the same field names and actions.
- `/cart/checkout` still renders the checkout form with the same field names.
- Signed-in checkout still pre-fills customer/default-address details.
- Signed-in Persian locale renders checkout with RTL direction.
- Signed-out checkout remains usable with English fallback copy.
- Creating an order still uses the existing server action and payment handoff path.
