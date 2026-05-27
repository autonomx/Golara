# Phase 14.4-14.6 — Woshe-style category catalog seed expansion

This bundle expands the seeded catalog hierarchy to more closely match the public Woshe storefront navigation while keeping images and copy owned/generated.

## Implemented foundation

- Expands seed categories into a Woshe-style category/subcategory tree.
- Reassigns seeded products to the closest matching subcategories.
- Keeps category and subcategory records editable through the existing admin category system.
- Keeps homepage visibility driven by `showOnHomepage`.
- Adds category image paths for every seeded category and subcategory.
- Expands generated category image palettes so all category/subcategory image routes render locally.
- Keeps all category imagery original/generated; no source-site images are copied or hotlinked.

## Top-level categories

- Available Today
- Flower Box
- Bouquets
- Woshe Royal / VVIP
- Chocolate & Eternal Rose
- Ceremony Design
- Birthday
- Cake & Balloon
- Pots
- Condolences
- Proposal & Bale Boroon
- Baby Flowers / Gender Reveal
- Weddings
- WOSHE Distance

## Example subcategories

- Available Today: Daily, Cacao & Roses, VIP
- Flower Box: VIP Box, Standard Boxes, Rose Envelope, Kids Box
- Bouquets: VIP Bouquets, Standard Bouquets
- Birthday: Birthday Package, Birthday Box, Birthday Ceremony Design, Surprise
- Cake & Balloon: Cakes, Birthday Cake, Wedding & Ceremony Cake, Kids Cake, Classic Cake, Mini Cake Trio, Balloons
- Pots: Steel Vases, Glass Vases, Orchids, Flower Baskets
- Proposal & Bale Boroon: Proposal, Bale Boroon
- Baby Flowers: Newborn Flowers, Gender Reveal
- Weddings: Bridal Bouquet, Bridal Car Design, Groom Boutonniere

## Product assignment

Existing seeded products now point to the closest matching subcategory where available. For example:

- VIP boxes map to `vip-boxes`
- Standard flower boxes map to `standard-boxes`
- Round hand bouquets map to `standard-bouquets` or `vip-bouquets`
- Daily designs map to `daily`
- Steel Bloom products map to `steel-vases`
- Birthday teddy bouquet maps to `birthday-box`

## Image behavior

Each category uses `/seed-images/category-real/<slug>`. If a real category image is not committed, the route falls back to generated local SVG category art. The generated category route now supports every seeded category/subcategory slug.

## QA checklist

- Run `npm run db:generate` after schema changes from the previous bundle.
- Run `npm run db:push` and `npm run db:seed` to populate the expanded hierarchy.
- Open `/` and confirm category tiles render.
- Open `/admin` and confirm categories/subcategories are editable.
- Confirm products can be assigned to subcategories.
- Open `/seed-images/category/<slug>` for several parent and child categories.
- Confirm no source-site image URLs are used.

## Follow-up ideas

- Generate real category photos for every category/subcategory and commit them under `public/seed-images/category-real`.
- Add parent category pages that show child category tiles above products.
- Add product listing behavior where a parent category includes products from its children.
