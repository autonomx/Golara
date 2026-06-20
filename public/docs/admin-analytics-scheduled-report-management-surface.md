# Scheduled report management surface

Status: visible, read preview gated, controls locked.

`/admin/analytics/scheduled-reports` shows scheduled-report readiness controls for admin sessions. The page now includes a read-preview panel and a GET-only owner route at `/admin/analytics/scheduled-reports/read`.

Live:

- management page shell
- owner-aware copy
- GET-only read route
- locked read preview by default
- locked control cards
- activation checklist
- nonbrowser guard coverage

Still off:

- metadata changes
- evidence recording
- approval recording
- global state recording
- background execution
- transport execution

The read preview stays empty unless the explicit server-side read flags are enabled and owner access passes. Each write or delivery control should still be enabled only by a later reviewed slice.
