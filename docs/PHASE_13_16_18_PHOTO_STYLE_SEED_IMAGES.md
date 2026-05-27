# Phase 13.16-13.18 — Photo-style seed images

This bundle upgrades the top seeded products from simple catalog placeholders to richer local photo-style SVG artwork.

## Implemented foundation

- Keeps the existing generated catalog image route for all seeded products.
- Adds a new local route for photo-style seed images: `/seed-images/photo-catalog/[slug]`.
- Routes the first 12 seeded best-seller products to photo-style images.
- Leaves the remaining seeded products on the existing lightweight catalog images.
- Keeps all artwork original, local, and dependency-free.
- Avoids copying or hotlinking source-site images.

## Top products upgraded

- `vip-box-blue`
- `signiture-round-baby-pink`
- `imperium-vip-red-roses`
- `imperium-vip-peach`
- `woshe-grand-cream`
- `woshe-round-hand-bouquet-honey-rose`
- `woshe-round-hand-bouquet-ruby-harmony`
- `woshe-round-hand-bouquet-white-lily`
- `steel-bloom-wild-1001372`
- `woshe-christmas-collection-round-hand-bouquet`
- `vip-box-red-pink`
- `imperium-pink`

## QA checklist

- Open `/products` and confirm the first seeded products render richer image cards.
- Open `/seed-images/photo-catalog/vip-box-blue` and confirm an SVG image response.
- Open `/seed-images/catalog/teddy-bouquet` and confirm fallback catalog image response still works.
- Confirm no external image host is required.
- Confirm admin-managed images can still replace seeded image paths after database seeding.

## Follow-up ideas

- Add owned PNG/WebP generated images if fully photo-realistic product imagery is needed.
- Add an admin media import workflow for replacing seed art with merchant-owned product photos.
- Add localized image alt/caption fields when catalog localization expands.
