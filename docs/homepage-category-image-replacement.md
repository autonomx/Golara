# Homepage category image replacement

## 2026-06-11 — Woshe Royal category image removal

The storefront category image resolver no longer references `woshe-royal.jpg` for the `today-vip` or `woshe-royal` category slugs.

Both slugs now reuse the existing `vip-flower-box.jpg` category image, and the old `public/homepage/categories/woshe-royal.jpg` asset was removed from the repository.

A unit guard in `tests/unit/homepage-category-assets.test.ts` covers the resolver output so the removed image filename is not reintroduced by accident.
