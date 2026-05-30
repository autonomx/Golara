# Phase 20.2 — Category image alias migration

## Goal

Move hardcoded category seed image alias behavior out of individual components and inline seed-data overrides into a shared data-backed resolver.

## Implemented

- Added `lib/seed-category-images.ts`.
- Centralized category image alias mappings in `seedCategoryImageAliases`.
- Added `getSeedCategoryImagePath(slug)`.
- Added `resolveCategoryImagePath(category)`.
- Updated `lib/seed-data.ts` so seeded category images are resolved through the shared mapping.
- Removed inline `imageSlug` overrides from seeded category entries.
- Updated `HomepageCategoryTileCard` to use `resolveCategoryImagePath()` instead of owning its own `/seed-images/category-real/${slug}` fallback.

## Compatibility behavior

Existing rendering is preserved:

- database-backed categories with an explicit `image` continue to use that image;
- categories without an explicit image fall back through the centralized seed-category mapping;
- alias mappings preserve the old visual behavior for categories such as VIP, birthday, cakes, pots, proposal, baby flowers, weddings, and distance delivery.

## Why this matters

Before this phase, category image behavior lived in more than one place:

- seed data knew about `imageSlug` overrides;
- the homepage category tile component knew about the seed image path convention.

This made it harder to migrate category imagery toward CMS/media-library-backed records. The path convention and alias decisions now live in one module.

## Follow-up

Phase 20.3 should formalize object-storage provider readiness and production warnings around local-only storage.

A later media CMS phase can replace the seed alias map with editable category media records or a dedicated media mapping table if needed.
