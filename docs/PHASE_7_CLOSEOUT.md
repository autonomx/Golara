# Phase 7 closeout

Phase 7 moved Golara from single-product order draft checkout toward a real cart/session checkout foundation that feeds the existing server-recomputed order draft and PSP flow.

## Completed foundations

- `CartSession` and `CartItem` Prisma models.
- Product-to-cart item relation.
- Server-side cart repository.
- Token generation and configurable cart TTL via `CART_SESSION_TTL_DAYS`.
- Active cart lookup with product/category active filtering.
- Add, update, remove, clear, and expire-old-cart helpers.
- Quantity bounds from 1 to 99.
- HTTP-only cart token cookie helpers.
- Add-to-cart, update, remove, and clear cart server actions.
- Safe relative return-path handling for cart actions.
- Public `/cart` page with item rows, quantity controls, removal, clear action, empty state, item count, and subtotal summary.
- Public `/cart/checkout` page with delivery/contact form and order summary.
- Cart item conversion into the existing order draft repository.
- Server-recomputed order totals remain the source of truth.
- Existing PSP payment attempt and gateway handoff path reused for cart checkout.
- Cart and cart cookie cleared after successful order draft creation.
- Product detail add-to-cart form with quantity selection.
- Product card add-to-cart button.
- Shared header `/cart` link and server-rendered cart count badge.

## Current CI baseline

The repository currently validates pull requests with:

- `npm install`
- `npm run check:file-lines`
- `npm run db:generate`
- `npm run typecheck`
- `npm run build`

## Deferred items

- Cart checkout localization and field-level validation polish.
- Basic cart smoke tests or Playwright/Vitest coverage.
- Customer accounts and order history.
- Full Persian storefront localization.
- Lighthouse CI and full Playwright suite.
- Search and customer account header interactions.
- Cart expiry cleanup job/schedule.

## Recommended next direction

Phase 8 should add customer accounts and order history on top of the existing phone-first customer profile and public order token system.

Recommended Phase 8 track:

1. Account/auth provider decision and customer login/session seam.
2. Customer order-history page backed by customer profile ownership.
3. Saved contact/address management.
4. Account-aware checkout prefill.
5. Privacy/security review for authenticated order access.
6. Customer-account smoke-test plan.
