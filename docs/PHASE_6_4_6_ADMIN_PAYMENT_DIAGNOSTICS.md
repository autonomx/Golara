# Phase 6.4-6.6 admin payment diagnostics

This bundle improves staff visibility into payment attempts after the Phase 6.1-6.3 gateway verification foundation.

## Added behavior

- Renames the admin order detail payment section to payment diagnostics.
- Shows provider, attempt status, amount, reference, redirect presence, and created time.
- Summarizes verification outcome for staff.
- Highlights verified, failed, cancelled, redirected, and manual-pending attempts with distinct tones.
- Shows a bounded allowlist of safe provider metadata fields:
  - `verified`
  - `verificationSkipped`
  - `reason`
  - `providerCode`
  - `authority`
  - `refId`
  - `httpStatus`
  - `fee`
  - `feeType`
  - `instruction`
- Truncates long string values in the UI.

## Current scope

This is limited to the admin order detail page. It does not change payment state transitions, provider behavior, or database schema.

## Deferred

- Dedicated payment attempt detail page.
- Provider-specific troubleshooting copy.
- Admin filters for provider/verification outcome.
- Mocked provider tests for request/verify/callback paths.
