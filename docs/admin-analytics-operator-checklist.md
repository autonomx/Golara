# Admin analytics operator checklist

Use this checklist when reviewing the `/admin/analytics` workspace and its CSV exports.

## Daily review

1. Open `/admin/analytics` with the 7-day range.
2. Check order totals, eligible revenue, average order value, open orders, and completed orders.
3. Review payment method mix and failed payment signals before investigating individual orders.
4. Review fulfillment, inventory pressure, inquiries, and readiness panels for operational blockers.
5. Use the section index to jump directly to the panel that needs action.

## Weekly review

1. Switch to the 30-day range.
2. Compare the current range against the previous range using the KPI deltas.
3. Review product view-to-cart conversion, product sales, and category sales together.
4. Look for products with traffic but no cart activity or sales.
5. Download the owner-only Business CSV if a reporting handoff is needed.

## Monthly or quarterly review

1. Use the 90-day or 365-day range.
2. Review source, campaign, and referrer-domain attribution.
3. Export aggregate Business CSV and Site CSV for offline reporting.
4. Keep exports aggregate-only; do not use them as raw visitor/session exports.
5. Confirm site analytics retention status and cleanup-readiness guidance.

## CSV export intent

Business CSV is for commerce reporting and reconciliation. It includes aggregate order, revenue, product, category, payment, discount, fulfillment, and operations summaries for the selected range.

Site CSV is for storefront behavior reporting. It includes aggregate traffic, funnel, attribution, product-view, category-view, search, and product conversion summaries for the selected range.

Exports intentionally exclude raw visitor sessions, full referrer URLs, and raw event payloads.

## Before trusting a quiet dashboard

A quiet chart can be valid. Check these conditions before treating an empty panel as a bug:

- Production migration evidence exists for the site analytics table.
- Storefront analytics is enabled with `NEXT_PUBLIC_SITE_ANALYTICS_ENABLED` not set to `false`.
- Storefront paths have received real traffic in the selected range.
- Eligible checkout orders exist in the selected range.
- The selected range is wide enough for the behavior being reviewed.

## Still intentionally pending

- Custom start/end date range selector.
- Automated raw-event retention cleanup job.
- Deletion action for stale raw site events after production migration evidence is confirmed.
