# Phase 34 Notification Smoke-Test Checklist

Status: documentation-only smoke-test checklist; live email, SMS, and WhatsApp delivery remains disabled.

Last updated: 2026-06-05

## Purpose

Use this checklist for operator-led notification provider smoke tests after provider readiness evidence exists.

This document does not enable live delivery. It defines what an operator should record before any claim that real provider notification delivery has been validated.

## Safety boundary

- Do not run smoke tests from this document until an operator has approved the environment and provider readiness evidence.
- Do not add provider endpoint URLs, credentials, confidential configuration values, customer personal data, or raw provider payloads to source control.
- Do not claim live sends passed unless the operator actually ran the matching provider test and recorded the evidence outside source control.
- Keep `liveDeliveryEnabled` false until the live-delivery enablement step is explicitly approved after this checklist is complete.
- Keep checkout, inquiry, fulfillment, admin, worker, and retry paths inert until live enablement is intentionally scoped.

## Preconditions

Before any provider smoke test, confirm:

1. Provider selection is operator-approved for the target channel.
2. Account ownership and escalation contact are recorded.
3. Configuration source names are documented without confidential values.
4. Sender identity verification is complete or explicitly not required.
5. Template approval is complete or explicitly not required.
6. Consent, opt-out, and suppression expectations are reviewed.
7. The target environment is non-production or explicitly approved for a limited production smoke test.
8. The repo-side readiness diagnostics still report `liveDeliveryEnabled` as false before enablement.

## Channels to test

Create one completed checklist per channel/provider/environment combination.

| Channel | Provider mode | Smoke-test status | Evidence owner |
| --- | --- | --- | --- |
| Email | pending | not started | pending |
| SMS | pending | not started | pending |
| WhatsApp | pending | not started | pending |

## Message scenarios

Each channel should cover the notification scenarios that are in launch scope.

| Scenario | Required for launch | Result | Notes |
| --- | --- | --- | --- |
| Order confirmation | yes | pending | Customer-facing order acknowledgement. |
| Staff notification | yes | pending | Internal order or inquiry alert. |
| Inquiry acknowledgement | yes | pending | Customer-facing inquiry receipt. |
| Fulfillment update | yes | pending | Customer-facing fulfillment or handoff update. |
| Manual fallback notice | optional | pending | Only if manual/log mode remains part of operations. |

## Outcome categories

Record non-confidential summaries for these outcomes when supported by the provider or staging harness.

- Accepted:
  - Expected evidence: provider accepted the request and returned a safe correlation reference or equivalent summary.
- Rejected:
  - Expected evidence: provider rejected the request with a safe category or reason summary.
- Rate-limited:
  - Expected evidence: provider or staging harness returned a rate-limit category and retry expectation.
- Unavailable:
  - Expected evidence: provider or staging harness returned an unavailable category and fallback expectation.
- Suppressed or opted out:
  - Expected evidence: suppressed recipient was not sent and the reason was recorded without personal data.

## Evidence to record outside source control

For every smoke-test attempt, record:

- Environment name.
- Channel and provider mode.
- Message scenario.
- Test timestamp.
- Safe provider correlation reference, if available.
- Outcome category.
- Operator reviewer.
- Any fallback action taken.
- Whether the result affects live-delivery readiness.

Do not record confidential values, raw payloads, recipient personal data, or provider dashboard screenshots containing private material.

## Pass criteria

A channel is smoke-test ready only when:

1. All required message scenarios pass for the target environment.
2. Accepted, rejected, rate-limited, unavailable, and suppression expectations are understood.
3. Sender and template evidence matches the tested provider configuration.
4. Operator reviewer signs off on the non-confidential evidence record.
5. Engineering reviewer confirms no repo-side live send path is enabled accidentally.
6. Any live-delivery enablement remains a separate scoped change.

## Failure handling

If any smoke-test attempt fails:

1. Keep live delivery disabled.
2. Record the safe failure category and affected channel.
3. Do not retry through an automated worker unless that worker is explicitly scoped and still no-send.
4. Patch provider configuration or template evidence outside source control as needed.
5. Re-run only the affected checklist items after operator approval.

## Completion summary

- Environment:
  - Status: pending.
- Channel/provider:
  - Status: pending.
- Required scenarios complete:
  - Status: no.
- Outcome categories reviewed:
  - Status: no.
- Operator sign-off complete:
  - Status: no.
- Engineering sign-off complete:
  - Status: no.
- Ready for separate live enablement change:
  - Status: no.
