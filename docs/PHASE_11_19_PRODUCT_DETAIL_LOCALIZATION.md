# Phase 11.19 — Product detail localization guard

Status: pending CI.

## Issue

- Product cards can appear inside Persian storefront chrome while seed product titles and descriptions remain English.
- The affected visible examples include `imperium-pink`, `dark-blue-design`, `cream-pink-design`, and `autumn-design-2`.

## Completed

- Added a focused unit guard for Persian seed product fallback localization.
- The guard verifies Persian titles, descriptions, and category title fallback for the screenshot-visible product slugs.
- Wired the guard into the unit test runner.

## Verification

- CI is required before merge.

## Next

- If the guard passes but the UI remains English in a deployed environment, inspect whether that environment is using database products without published Persian product translations.
- Add admin/catalog validation for missing published product translations before launch.
