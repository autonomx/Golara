# Homepage category and featured alignment

Date: 2026-06-10

The Shop by Category section now uses the same `mx-auto max-w-7xl px-5` container as the Featured picks carousel.

This keeps the category section heading, CTA, and tile grid aligned with the adjacent storefront merchandising section instead of using the earlier extra-wide category-only container.

Guard coverage: `tests/unit/storefront-home-route-copy.test.ts` now rejects the old `max-w-[1520px]` category wrapper and verifies the shared homepage section container width.
