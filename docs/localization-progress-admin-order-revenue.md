# Admin order revenue localization progress

Status: in progress

This slice adds a focused source guard for `components/admin/AdminOrderRevenueSummaryPanel.tsx`.

Covered now:

- English and Persian copy maps for the order/revenue summary panel.
- Locale resolution through `resolveStorefrontLocale()` and `copy[localeKey(locale)]`.
- Source usage for summary labels, table headers, and detail labels.
- Regression checks against reintroducing direct JSX text for the main visible labels.

This is a guard-only slice; no runtime behavior is intended to change.
