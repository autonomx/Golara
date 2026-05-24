# Phase 4.43-4.45 public fulfillment status

This bundle adds customer-safe fulfillment visibility to the public order status page.

## Added foundation

- Public order lookup now selects `fulfillmentStatus`.
- `/orders/[token]` displays fulfillment status in the status summary cards.
- Privacy copy now explicitly says courier details are hidden.

## Privacy rule

The public status page may show high-level fulfillment status, but must not show:

- courier name
- courier phone
- address
- customer phone
- internal notes
- staff-only fulfillment notes

## Deferred

- Customer-facing delivery ETA messaging.
- Public delivery tracking provider links.
- SMS or WhatsApp notifications.
- Locale-specific status labels.
