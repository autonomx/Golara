# Site analytics privacy and retention policy

Golara site analytics are first-party operational signals for understanding storefront usage and checkout health. They are not a third-party tracking system and must not be used for visitor fingerprinting.

## Collection boundaries

The storefront reporter and ingestion endpoint must keep these boundaries:

- Do not track `/admin`, `/api`, `/_next`, or other system routes.
- Honor browser Do Not Track signals.
- Keep analytics first-party; do not add a third-party tracker for this workflow.
- Use anonymous session identifiers only for coarse event continuity.
- Do not store full referrer URLs in analytics reports; store external referrer domains only.
- Store UTM source, medium, and campaign only after normalization and length caps.
- Keep exports aggregate-only. Do not export raw visitor sessions from admin analytics.

## Event scope

Allowed event types are limited to operational storefront events such as page views, product/category views, catalog searches, add-to-cart signals, checkout starts, checkout completions, and payment-method selections.

Event metadata should remain intentionally small: route path, locale, optional product/category/search labels, optional payment method key, optional UTM fields, and optional external referrer domain.

## Retention target

The operational target is:

- Raw site analytics events: retain for up to 180 days.
- Aggregate CSV exports and dashboard summaries: generated on demand from the selected range.
- Long-lived business reporting should prefer aggregate summaries over raw event retention.

A scheduled cleanup job can enforce raw-event retention once production analytics volume is validated.

## Admin visibility

The `/admin/analytics` page should show the privacy and retention policy near the analytics controls so staff understand what is collected, what is excluded, and how to disable storefront analytics if needed.

## Disable switch

Set the storefront environment variable below to disable first-party analytics reporting from the client:

```bash
NEXT_PUBLIC_SITE_ANALYTICS_ENABLED=false
```

Server-side ingestion should still validate every request and fail closed for invalid payloads while failing open for missing analytics-table migration drift so storefront traffic does not break.
