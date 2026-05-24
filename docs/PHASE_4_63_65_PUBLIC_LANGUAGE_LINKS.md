# Phase 4.63-4.65 public language links

This bundle makes the public order status page locale support discoverable.

## Added behavior

- `/orders/[token]` shows language links near the order heading.
- English link uses `locale=en`.
- Persian link uses `locale=fa`.
- Existing `result` query param is preserved when switching languages.
- Page direction still follows the selected locale.

## Current scope

Only public order status page language discovery is included.

## Deferred

- Site-wide language switcher.
- Full Persian page copy.
- Persisted customer language preference.
- RTL visual QA pass.
