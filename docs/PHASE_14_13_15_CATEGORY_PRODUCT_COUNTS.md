# Phase 14.13-14.15 — Category product count badges

This bundle adds product count badges to category image tiles so the expanded category hierarchy is easier to QA and navigate.

## Implemented foundation

- Adds shared category tree helpers in `lib/category-tree.ts`.
- Adds optional `Category.productCount` to storefront category data.
- Homepage category tiles display recursive product counts.
- Category-page subcategory tiles display recursive product counts.
- Category pages now use the shared tree helpers for children, descendants, and product aggregation.

## Behavior

Product counts include products assigned to the category and all descendant categories.

For example, `Cake & Balloon` can count products assigned to:

- `cake-balloon`
- `cakes`
- `birthday-cake`
- `wedding-ceremony-cake`
- `kids-cake`
- other descendants

## QA checklist

- Open `/` and confirm category tiles show product count badges.
- Open `/categories/flower-boxes` and confirm child tiles show counts.
- Open `/categories/cake-balloon` and confirm parent counts include nested descendants.
- Confirm empty categories show `0 products` or no products in their grid while still rendering safely.

## Follow-up ideas

- Add count labels to admin category rows.
- Add count-based sorting or hiding for empty categories.
- Localize the `product/products` badge copy.
