# Phase 13.25-13.27 — Homepage category real photo slots

This bundle prepares the homepage category image tiles for owned/generated photo assets.

## Implemented foundation

- Updates homepage category tile image paths to use `/seed-images/category-real/[slug]`.
- Adds a category real-photo route that serves committed `.jpg`, `.png`, or `.webp` files from `public/seed-images/category-real`.
- Falls back to the existing generated SVG category artwork when no real photo is present.
- Adds `data/homepage-category-photo-prompts.json` with prompts for the 11 homepage category tiles.

## Required generated files

Place generated files under `public/seed-images/category-real/` using one of the supported extensions:

- `weddings.jpg`
- `baby-flowers.jpg`
- `proposal.jpg`
- `flower-boxes.jpg`
- `birthday.jpg`
- `pots.jpg`
- `ceremony-design.jpg`
- `royal.jpg`
- `condolences.jpg`
- `cake-balloon.jpg`
- `bouquets.jpg`

PNG or WebP also works if the filename stem matches the slug.

## QA checklist

- Open `/` and confirm homepage category images still render before real assets exist.
- Open `/seed-images/category-real/weddings` and confirm it redirects/falls back to generated category art when no real image exists.
- Add one generated category photo and confirm the route serves the real image instead of fallback SVG.
- Confirm no source-site image URLs are used.

## Follow-up

Generate and commit the 11 category images using `data/homepage-category-photo-prompts.json`.
