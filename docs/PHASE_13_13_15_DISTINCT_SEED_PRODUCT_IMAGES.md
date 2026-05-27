# Phase 13.13-13.15 — Distinct seed product images

This bundle upgrades the Woshe-style seed catalog so seeded products no longer share one generic placeholder image.

## Implemented foundation

- Adds `lib/seed-product-images.ts` with product-specific image descriptors.
- Adds a local SVG image route at `/seed-images/catalog/[slug].svg`.
- Updates `lib/seed-data.ts` so every seeded product derives a distinct image path from its slug.
- Keeps all artwork original, local, and dependency-free.
- Avoids copying or hotlinking source-site images.

## Behavior

The seeded catalog now renders different placeholder artwork per product. The generated SVGs vary by product code, category-like shape, and palette. They are intended for realistic QA and storefront development, not as final production photography.

## Manual QA checklist

- Open `/products` and confirm seeded products no longer all show the same image.
- Open at least one product detail page from VIP, bouquets, flower boxes, pots, birthday, and available-today categories.
- Confirm image URLs under `/seed-images/catalog/*.svg` resolve locally.
- Confirm no external image host is required for seeded catalog images.
- Confirm admin-uploaded or manually edited product images still override seeded fallback data after database seeding.

## Follow-up ideas

- Replace these generated SVG placeholders with owned photo-like generated images if higher visual fidelity is needed.
- Add Persian image alt/caption fields once catalog localization expands.
- Add a catalog import/export fixture if the seed catalog should be refreshed from a spreadsheet.
