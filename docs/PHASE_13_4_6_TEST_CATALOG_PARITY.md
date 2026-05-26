# Phase 13.4-13.6 — Woshe-style test catalog parity

This bundle updates Golara's seed catalog to better match the public product/category shape of the Woshe site the app is based on.

## Goals

- Use public factual product data for realistic testing.
- Avoid copying Woshe product images.
- Avoid copying Woshe marketing/product prose.
- Keep the test catalog safe, editable, and stable for CI/local development.

## Implemented foundation

- Replaces the generic seed catalog with Woshe-style test categories.
- Seeds public product facts such as product names, visible product codes, and visible prices/call-for-purchase placeholders.
- Uses original Golara-written descriptions for every product.
- Uses a local original SVG placeholder image for all seeded products:
  - `public/seed-images/woshe-style/floral-placeholder.svg`
- Uses valid `IRR` currency values for seeded prices so `Intl.NumberFormat` works reliably.

## Image policy

Do not copy or hotlink Woshe product images.

For testing, use one of these safe options:

1. Original generated images owned/created for Golara.
2. Original local placeholders, as added in this bundle.
3. Properly licensed stock images with attribution/license tracking if required.
4. Admin-uploaded images owned by the merchant.

This bundle chooses option 2 so the app works without external image dependencies and without copying protected assets.

## Product data policy

The seed catalog uses public factual data points for test parity:

- product names
- product codes
- visible listed prices when available
- call-for-purchase represented as `price: 0`
- broad category grouping

Descriptions are original test copy and should remain editable in the CMS.

## Follow-up recommendations

- Add an explicit `requiresQuote` or `callForPurchase` product field instead of using `price: 0` as a placeholder.
- Add generated per-product images if higher visual fidelity is needed.
- Add Persian product/category content fields if production localization requires both Persian and English catalog content.
- Add a catalog import/export fixture if the product list should be refreshed from a spreadsheet rather than hardcoded seed data.
