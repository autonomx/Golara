# Phase 16.6 — PII-safe OTP security observability

## Goal

Expose a small read-only admin security surface for recent customer OTP auth events without revealing raw customer identifiers.

## Implemented

- Added `lib/customers/customer-auth-event-summary.ts`.
- Added `components/admin/AdminSecurityPanel.tsx`.
- Wired the summary into `/admin` via `app/admin/page.tsx`.
- Rendered the panel from `AdminDashboard` for authenticated admins.

## Summary fields

The admin panel shows recent activity for the last 24 hours:

- `otp_request_allowed`
- `otp_request_blocked`
- `otp_delivery_failed`
- `otp_verify_failed`
- `otp_verify_blocked`
- `otp_verify_success`

It also shows the top recent phone hashes and IP hashes by event count.

## PII boundary

The panel must not display:

- raw phone numbers;
- raw IP addresses;
- raw user agents;
- OTP codes;
- provider secrets;
- session tokens;
- full request headers.

The helper returns hash strings and counts only. The UI truncates hashes by default and exposes the full hash only as a hash string tooltip.

## Query bounds

The helper:

- uses a bounded lookback window;
- defaults to 24 hours;
- clamps the allowed window from 1 to 168 hours;
- reads at most 1000 recent matching auth events.

This is intentionally a lightweight observability surface, not a full analytics/reporting pipeline.

## Follow-up

Future bundles can add:

- time-window controls;
- event drill-down with bounded metadata;
- alert thresholds for blocked request/verify spikes;
- CSV/security export with hash-only identifiers;
- retention policy controls for `CustomerAuthEvent` rows.
