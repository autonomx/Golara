# Phase 4.69-4.71 RTL polish

This bundle improves mixed-direction rendering on the public order status page.

## Added polish

- Persian labels avoid uppercase/letter-spacing utility classes.
- Order number is explicitly rendered `dir="ltr"`.
- Total amount is explicitly rendered `dir="ltr"`.
- Item quantities are explicitly rendered `dir="ltr"`.
- Language switcher keeps `dir="ltr"` so English/Persian links remain predictable.
- Result banner title styling adapts for Persian.

## Current scope

This is a narrow public order status page polish pass only.

## Deferred

- Full storefront RTL QA.
- Site-wide language switcher.
- Persian product/category content.
- Admin-side localization.
