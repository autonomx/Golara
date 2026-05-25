# Phase 5.32-5.34 path accessibility

This bundle improves the visible path trail component.

## Added behavior

- `PathTrail` returns `null` for empty item lists.
- `PathTrail` supports a custom nav label.
- Current page item is visually emphasized.
- Current page item keeps `aria-current="page"`.
- Item keys prefer href when available.

## Current scope

This updates the reusable component only. Existing category/product usage continues to work unchanged.

## Deferred

- Locale-specific labels.
- RTL path trail QA.
- Site-wide path trail usage.
