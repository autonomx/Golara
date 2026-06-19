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

The admin retention panel can show a cleanup preview for events older than the cutoff. The preview is a read-only estimate and does not delete events.

## Cleanup readiness gates

Do not enable an automated deletion job until these gates are true:

1. `DATABASE_URL` is configured in the target environment.
2. The `SiteAnalyticsEvent` migration has been applied and the table is visible in production.
3. `/admin/analytics` shows retention status without missing-table warnings.
4. The cleanup preview shows the stale raw-event count that would be eligible under the retention target.
5. Stale raw-event counts have been reviewed by an owner/admin.
6. Analytics CSV exports remain aggregate-only and do not expose raw visitor/session data.
7. Production migration evidence is captured in the launch/evidence notes before enabling scheduled deletion.
8. Production analytics volume is validated so cleanup cannot hide missing event capture.

Until those gates are met, cleanup controls should remain preview-only/readiness-only. Deleting raw events is intentionally out of scope for the status panel.

## Admin visibility

The `/admin/analytics` page should show the privacy and retention policy near the analytics controls so staff understand what is collected, what is excluded, how to disable storefront analytics if needed, and why raw-event cleanup remains disabled until the readiness gates are met.

## Disable switch

Set the storefront environment variable below to disable first-party analytics reporting from the client:

```bash
NEXT_PUBLIC_SITE_ANALYTICS_ENABLED=false
```

Server-side ingestion should still validate every request and fail closed for invalid payloads while failing open for missing analytics-table migration drift so storefront traffic does not break.
