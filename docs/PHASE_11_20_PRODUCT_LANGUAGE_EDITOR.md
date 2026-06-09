# Phase 11.20 — Product language editor

Status: pending CI.

## Completed

- Added a visible language selector to product translation forms in the admin translation editor.
- Product localization now presents a language dropdown for Persian and English instead of relying on a hidden locale value.
- The form still saves through the existing product translation action and publish-state control.

## Verification

- CI is required before merge.

## Next

- Surface the same translation controls closer to the product detail create/edit screen.
- Add admin validation that highlights products missing published translations before storefront launch.
