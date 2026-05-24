# Phase 4.66-4.68 public copy

This bundle localizes more of the customer-facing order status page copy.

## Added foundation

- Shared public order page copy object for English.
- Shared public order page copy object for Persian.
- `publicOrderCopyFor()` helper.
- `/orders/[token]` uses localized shared copy for:
  - eyebrow
  - intro text
  - summary card labels
  - delivery timing section labels
  - items/progress headings
  - empty progress text
  - privacy text
  - latest payment status label

## Current scope

This is still a narrow public order page copy pass. Product pages, admin pages, and site navigation remain outside this bundle.

## Deferred

- Full storefront Persian copy.
- Persian product/category content fields.
- Locale persistence.
- RTL visual QA pass.
