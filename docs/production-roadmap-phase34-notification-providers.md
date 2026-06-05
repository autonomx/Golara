# Phase 34 Real Notification Provider Foundations

Status: provider-neutral/inert delivery contract, read-only readiness diagnostics, and provider evidence template added; no real email, SMS, or WhatsApp provider delivery is enabled.

Last updated: 2026-06-05

## Scope

Phase 34 moves Golara from settings/readiness-only notification foundations toward real operational notification providers for order and inquiry workflows.

This kickoff document defines the repo-side boundaries before implementation begins. Full live provider validation remains deferred until after the Phase 38 foundation pass and the later operator-led end-to-end testing window.

## Goals

- Choose a provider-neutral delivery contract for email, SMS, and WhatsApp-style channels.
- Keep existing log/webhook or disabled modes available for development and fallback operations.
- Add provider readiness diagnostics before any live provider calls.
- Add templated delivery payload planning for order confirmation, staff notification, inquiry acknowledgement, and fulfillment updates.
- Add delivery-attempt persistence planning before any retry or admin retry controls are enabled.
- Add source guards so provider credentials, live endpoint defaults, and accidental send paths cannot be introduced silently.

## Completed in Phase 34 so far

- Added the Phase 34 kickoff document for provider-neutral email/SMS/WhatsApp foundations.
- Added a kickoff source guard and wired it into the aggregate unit runner.
- Added `lib/notifications/notification-delivery-contract.ts` as an inert provider-neutral delivery planning helper. It covers email, SMS, and WhatsApp planning states, always returns `liveDeliveryEnabled: false`, and does not call providers.
- Extended the kickoff source guard to behavior-test the inert delivery contract and preserve no fetch/default endpoint/admin-send-control boundaries.
- Added `lib/notifications/notification-provider-readiness.ts` as a read-only readiness diagnostics helper. It reports provider/channel support, credential-source naming, sender verification evidence, template approval evidence, disabled/manual/provider-backed readiness states, and always keeps `liveDeliveryEnabled: false`.
- Extended the Phase 34 source guard to behavior-test the readiness diagnostics and preserve the inert/no-live-provider boundary.
- Added `docs/production-roadmap-phase34-provider-readiness-evidence-example.md` as a documentation-only provider evidence template for operator-reviewed readiness records.

## Initial provider candidates

Provider selection remains operator-confirmed and environment-specific. Good first-pass candidates to evaluate are:

- Email: SMTP, Resend, SendGrid, or another production-safe transactional email provider.
- SMS: Twilio, a regional SMS aggregator, or a disabled/manual mode if SMS is not part of launch scope.
- WhatsApp: Twilio WhatsApp, Meta WhatsApp Cloud API, a regional BSP, or a disabled/manual mode if WhatsApp is not part of launch scope.

This document does not select or approve a live provider. It only defines the selection surface and evidence expectations.

## Safety boundaries

Do not add or enable these behaviors during the initial Phase 34 foundation slices:

- Live email, SMS, or WhatsApp HTTP/API calls.
- Default live provider endpoint URLs.
- Provider credentials or secret values in source, docs, fixtures, tests, or screenshots.
- Admin send/retry buttons that trigger live delivery.
- Automatic customer/staff delivery from checkout, inquiry, or fulfillment flows.
- Durable retry worker behavior; that belongs to Phase 35 unless explicitly scoped as a no-send planning contract.
- Production-ready claims for notification delivery.

## Evidence gates before live delivery

Before live delivery can be enabled, the following evidence must exist:

1. Provider selection and account ownership confirmation.
2. Credential-source names documented without secret values.
3. Sender identity/domain/number/WhatsApp business verification evidence.
4. Template approval evidence where the provider requires it.
5. Sandbox/staging provider response examples for accepted, rejected, rate-limited, and unavailable outcomes.
6. Delivery-attempt persistence and idempotency expectations.
7. Opt-out, consent, and suppression-list expectations where required.
8. Operator-reviewed smoke-test checklist results.

## Recommended next implementation slices

1. Add documentation-only notification smoke-test checklist.
2. Add delivery-attempt persistence planning before any database migration or retry controls.
3. Add inert/manual/log adapters that consume the delivery contract without live provider calls.
4. Keep durable retry worker behavior deferred to Phase 35 unless explicitly scoped as a no-send planning contract.

## Relationship to later phases

- Phase 35 owns durable outbound retry/worker behavior.
- Phase 36 owns provider-backed per-user admin authentication.
- Phase 37 owns checkout/order/fulfillment end-to-end QA.
- Phase 38 owns production operations and monitoring.

Phase 34 should prepare real notification delivery foundations without requiring the full live validation pass until the later testing window.
