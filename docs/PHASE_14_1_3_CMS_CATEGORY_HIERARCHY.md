# Phase 14.1-14.3 — CMS category hierarchy foundation

This bundle moves homepage category tiles away from a hardcoded list and toward editable CMS categories.

## Implemented foundation

- Adds optional category hierarchy support with `Category.parentId`.
- Adds category image support with `Category.imageUrl`.
- Adds homepage visibility control with `Category.showOnHomepage`.
- Keeps products assigned to one category, which can now be a top-level category or subcategory.
- Maps parent/category image/homepage fields through the catalog repository.
- Adds `listHomepageCategories()` for the homepage collections grid.
- Updates the homepage category grid to render CMS-backed categories.
- Adds admin controls for:
  - parent category
  - category image from media library
  - manual category image URL
  - show on homepage
  - visible on storefront
- Seeds category images, homepage flags, and example subcategories.

## Behavior

Categories and subcategories are both stored in the same `Category` table. A category with `parentId = null` is top-level. A category with `parentId` is a subcategory.

Any active category or subcategory with `showOnHomepage = true` appears on the homepage category grid. Its image comes from `imageUrl`, falling back to `/seed-images/category-real/<slug>` when seeded.

## Manual QA checklist

- Run `npm run db:generate` after the schema change.
- Run `npm run db:push` and `npm run db:seed` locally or in staging.
- In admin, create a category with no parent and set an image.
- In admin, create a subcategory and select its parent category.
- Toggle `Show on homepage` off and confirm it disappears from `/`.
- Toggle `Visible on storefront` off and confirm it does not appear in storefront category lists.
- Assign a product to a subcategory and confirm the product still renders.
- Confirm homepage category cards use category image URLs from the CMS.

## Follow-up ideas

- Add nested category pages that show child categories above products.
- Add product filtering that includes child category products when visiting a parent category.
- Add drag-and-drop category ordering in admin.
- Add category image upload shortcut directly inside the category form.
