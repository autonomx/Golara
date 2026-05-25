# Phase 5.65-5.67 public order accessibility polish

This bundle tightens the customer order status page without changing checkout/order behavior.

## Added behavior

- Language switch navigation now announces the current order status language.
- English and Persian language links have clearer accessible labels.
- The active language link uses `aria-current="page"`.
- Result banners use `role="status"` with polite live-region behavior.
- The main order status sentence uses polite live-region behavior.
- The progress section is labelled by its visible heading.
- Item rows can wrap so quantities remain readable in narrow and RTL layouts.

## Current scope

This is limited to `/orders/[token]`. It keeps public token lookup, result handling, and all order data behavior unchanged.

## Deferred

- Full Persian storefront copy beyond public order status.
- Automated keyboard/screen-reader smoke tests.
- Customer account/order-history views.
