# Site analytics privacy and retention policy

Golara site analytics are first-party operational signals for understanding storefront usage and checkout health. They are not a third-party tracking system and must not be used for visitor fingerprinting.

## Collection boundaries

- Do not track `/admin`, `/api`, `/_next`, or other system routes.
- Honor browser Do Not Track signals.
- Keep analytics first-party; do not add a third-party tracker for this workflow.
- Use anonymous session identifiers only for coarse event continuity.
- Do not store full referrer URLs in analytics reports; store external referrer domains only.
- Store UTM source, medium, and campaign only after normalization and length caps.
- Keep exports aggregate-only. Do not export raw visitor sessions from admin analytics.

## Retention target

- Raw site analytics events: retain for up to 180 days.
- Aggregate CSV exports and dashboard summaries: generated on demand from the selected range.
- Long-lived business reporting should prefer aggregate summaries over raw event retention.

The admin retention panel can show a cleanup preview for stale events older than the retention cutoff. The preview is read-only and does not delete events.

## Cleanup readiness

Automated raw-event deletion should remain disabled until production readiness gates are complete:

- `DATABASE_URL` is configured in the target environment.
- The `SiteAnalyticsEvent` migration has been applied in production.
- `/admin/analytics` shows the retention status without missing-table warnings.
- The cleanup preview shows the stale raw-event count that would be eligible under the retention target.
- Stale raw-event counts have been reviewed by an owner/admin.
- Analytics exports remain aggregate-only and do not expose raw visitor/session data.
- Production migration evidence is captured before enabling scheduled deletion.
- Production analytics volume is validated so cleanup cannot hide missing event capture.

## Disable switch

Set this storefront environment variable to disable first-party analytics reporting from the client:

```bash
NEXT_PUBLIC_SITE_ANALYTICS_ENABLED=false
```
