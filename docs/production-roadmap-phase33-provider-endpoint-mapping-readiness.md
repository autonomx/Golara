# Phase 33 Provider Endpoint Mapping Readiness

Last updated: 2026-06-04

This note defines the documentation and operator-evidence prerequisites for adding concrete refund and void provider endpoint mappings in a later Phase 33 slice.

It is intentionally documentation-only. It does not add live Stripe or ZarinPal endpoint URLs, default HTTP clients, provider credentials, provider calls, admin execution controls, order/payment mutation, inventory/capacity release, or Prisma model/client access for `PaymentOperationRecord`.

## Purpose

Refund and void execution is provider-sensitive and must be validated against the configured target environments before destructive admin flows are exposed. The current repo-side adapter layer uses symbolic request envelopes and caller-injected HTTP clients so that later provider-specific endpoint wiring can be introduced with explicit evidence instead of hidden defaults.

## Mapping prerequisites

Before concrete provider endpoint mappings are added, operators should provide or confirm:

- target environment name and deployment SHA;
- provider account or merchant profile used for staging/live validation;
- provider mode, such as test, sandbox, staging, live, or production;
- approved refund endpoint path or operation identifier;
- approved void/cancel authorization endpoint path or operation identifier;
- HTTP method for each operation;
- required idempotency key header or request field;
- provider reference field expected for refund and void requests;
- required credential source names, without committing secret values;
- expected success status codes and response fields;
- expected rejected/declined response fields;
- expected retryable transport and provider error categories;
- provider dashboard evidence location or runbook reference;
- rollback behavior if provider operation mapping fails validation.

## Required evidence before endpoint constants

A later code slice that introduces concrete provider endpoint mappings should include evidence that operators verified:

- the endpoint paths match the active provider contract for the target environment;
- credentials are configured outside source control;
- idempotency semantics match the provider contract;
- duplicate operation requests are safe to retry or rejected predictably;
- rejected provider responses are normalized without marking operations succeeded;
- retryable provider responses remain retryable and do not mutate orders/payments;
- void/cancel semantics are valid for the order/payment states the UI can preview;
- refund semantics are valid for full and partial amounts;
- provider operation references are captured for audit/history display;
- no admin execution button is enabled by endpoint mapping alone.

## Source boundary for the later mapping slice

A future endpoint-mapping implementation should preserve these boundaries:

- keep provider execution behind injected HTTP clients;
- avoid default `fetch` behavior in provider adapters;
- avoid direct Prisma access from UI components or route pages;
- avoid mutating `CheckoutOrder` or `CheckoutPaymentAttempt` after provider success until a dedicated transition slice is approved;
- avoid inventory or capacity release until transition and release behavior is validated;
- preserve `PaymentOperationRecord` idempotency-key conflict blocking;
- keep admin UI read-only unless a separate execution-control slice is approved;
- update `docs/production-roadmap-phase33-payment-operations.md` with evidence status.

## Provider mapping worksheet

| Field | Stripe | ZarinPal | Evidence / notes |
| --- | --- | --- | --- |
| Provider mode | Pending operator confirmation | Pending operator confirmation | |
| Refund operation identifier | Pending operator confirmation | Pending operator confirmation | |
| Void operation identifier | Pending operator confirmation | Pending operator confirmation | |
| HTTP method | Pending operator confirmation | Pending operator confirmation | |
| Idempotency mechanism | Pending operator confirmation | Pending operator confirmation | |
| Provider reference source | Pending operator confirmation | Pending operator confirmation | |
| Success response fields | Pending operator confirmation | Pending operator confirmation | |
| Retryable error fields | Pending operator confirmation | Pending operator confirmation | |
| Rejected error fields | Pending operator confirmation | Pending operator confirmation | |
| Dashboard evidence | Pending operator confirmation | Pending operator confirmation | |

## Non-goals

This note does not approve:

- live provider refund calls;
- live provider void calls;
- concrete endpoint URL constants;
- default HTTP clients;
- secret or credential commits;
- admin refund/void execution controls;
- order/payment mutation after provider success;
- inventory or capacity release;
- marking provider operations production-ready without target-environment validation.
