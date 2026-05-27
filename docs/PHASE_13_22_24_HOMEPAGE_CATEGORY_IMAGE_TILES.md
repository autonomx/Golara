# Phase 13.22-13.24 — Homepage category image tiles

This bundle adds image-led homepage category tiles inspired by the source storefront category strip while keeping all artwork original and local.

## Implemented foundation

- Adds homepage category tile descriptors in `lib/homepage-category-tiles.ts`.
- Adds local generated SVG category imagery at `/seed-images/category/[slug]`.
- Adds `HomepageCategoryTileCard` for image-first category cards.
- Updates the homepage collections section to show the image tile grid.
- Keeps links routed to existing Golara category pages.
- Avoids copying or hotlinking source-site category images.

## Category tiles

- Weddings
- Baby Flowers
- Proposal
- Flower Boxes
- Birthday
- Pots
- Ceremony
- Royal
- Condolences
- Cake & Balloon
- Bouquets

## QA checklist

- Open `/` and confirm category tiles render with images.
- Confirm links go to the closest available category pages.
- Open `/seed-images/category/weddings` and confirm a local SVG image response.
- Confirm no source-site image URLs are used.
- Confirm product favorites still render below the category tiles.

## Follow-up ideas

- Replace generated category SVG art with owned generated photo assets.
- Add dedicated categories for baby flowers, proposal, ceremony, and royal if catalog data expands.
- Add Persian copy registry entries for category tile labels.
