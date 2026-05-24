# Phase 4.60-4.62 public locale

This bundle adopts the locale-aware public order label helpers on the customer order status page.

## Added behavior

- `/orders/[token]` accepts `locale` query param.
- `?locale=fa` uses Persian order status labels.
- `?locale=fa` uses Persian fulfillment labels.
- `?locale=fa` uses Persian result messages.
- Persian locale sets the page `dir` to `rtl`.
- Date formatting receives the requested locale.

## Current scope

Only customer-facing order status/result labels are localized. The larger page headings and privacy text remain English until a dedicated copy pass.

## Deferred

- Full Persian copy for every page string.
- Language switcher UI.
- Persisted customer language preference.
- RTL visual QA pass.
