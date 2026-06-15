# Payment Production Monitoring Evidence

Last updated: 2026-06-14

## Status

This is an operator evidence template for `PAYMENT_PRODUCTION_MONITORING_CONFIRMED="true"`. It is not proof that monitoring is complete until every required case below has target-environment evidence, an owner, a linked runbook, and rollback evidence where required.

The executable source of truth for the required case list is `lib/checkout/payment-production-monitoring-matrix.ts`.

## Required evidence cases

| Case ID | Domain | Required evidence |
| --- | --- | --- |
| `checkout_creation_errors` | checkout | Structured checkout creation failures and duplicate submission/idempotency events are observable; checkout failure runbook is linked; owner is assigned; rollback evidence is captured. |
| `provider_handoff_failures` | checkout | Provider session creation and redirect/handoff failures are observable without exposing secrets; provider handoff outage runbook is linked; owner is assigned; rollback evidence is captured. |
| `payment_return_anomalies` | payment return | Success, cancel, failure, missing-token, and unverified return outcomes are observable; customer-safe recovery runbook is linked; owner is assigned; rollback evidence is captured. |
| `webhook_signature_failures` | webhook | Invalid signature, missing secret, malformed payload, and duplicate replay outcomes are observable; webhook secret/endpoint rotation runbook is linked; owner is assigned; rollback evidence is captured. |
| `settlement_mismatches` | settlement | Amount, currency, reference mismatch, and durable/fallback source states are observable; reconciliation runbook is linked; owner is assigned; rollback evidence is captured. |
| `refund_void_operation_failures` | refund/void | Submitted, succeeded, failed, retryable, manual-review, and idempotency-conflict operation states are observable; refund/void failure runbook is linked; owner is assigned; rollback evidence is captured. |
| `notification_delivery_failures` | notification | Accepted, rejected, rate-limited, unavailable, duplicate, and retry delivery outcomes are observable; notification outage/retry/manual-contact runbook is linked; owner is assigned. |
| `admin_payment_action_audit` | admin payment action | Owner-only payment-operation attempts, denials, successes, and failures are audit-visible with redacted metadata; suspicious-action escalation runbook is linked; owner is assigned. |
| `gateway_mode_rollback_drill` | rollback | Operators can confirm checkout mode, provider mode, and notification mode changes in deployed configuration; rollback to inquiry/manual/log modes is linked; owner is assigned; rollback evidence is captured. |

## Completion checklist

Before setting `PAYMENT_PRODUCTION_MONITORING_CONFIRMED="true"`, operators must record for each case:

- Target environment name.
- Deployed git SHA.
- Evidence location or redacted screenshot/log reference.
- Monitoring signal name or admin page path.
- Runbook link.
- Owner or on-call role.
- Rollback evidence when the case requires rollback evidence.
- Reviewer initials and date.

## Explicit non-goals

This template does not create live probes, does not call providers, does not read production data, does not include secret values, does not enable gateway checkout, does not enable refund/void execution, and does not enable live notification delivery.

Source guards should continue to reject default provider calls, direct Prisma access, secret values, or attempts to treat this documentation as target-environment proof.
