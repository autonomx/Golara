# Payment Production Gates

Last updated: 2026-06-14

## Purpose

This note documents the executable payment-readiness gates added after `docs/payment-readiness-implementation-roadmap.md`.

The gates do **not** complete provider validation. They prevent future live payment, refund/void, notification, and monitoring enablement from being treated as ready unless the matching operator confirmations are present.

## Implemented files

- `lib/checkout/payment-production-gates.ts`
  - Pure TypeScript helper for evaluating payment-readiness confirmations.
  - No provider calls.
  - No database access.
  - No order, payment, inventory, notification, or refund mutation.
- `tests/unit/payment-production-gates.test.ts`
  - Source/behavior coverage for the helper.
- `tests/unit/payment-production-gates-entry.test.ts`
  - Direct runner entry for the helper test.
- `tools/check-payment-production-gates.mjs`
  - Standalone CLI check for deployments and CI wrappers.
- `lib/checkout/payment-production-monitoring-matrix.ts`
  - Pure monitoring/evidence matrix for checkout, return, webhook, settlement, refund/void, notification, admin audit, and rollback readiness.
- `tests/unit/payment-production-monitoring-matrix.test.ts`
  - Behavior/source guard for the monitoring matrix.
- `tests/unit/payment-production-monitoring-matrix-entry.test.ts`
  - Direct runner entry for the monitoring matrix guard.
- `docs/payment-production-monitoring-evidence.md`
  - Operator-facing evidence template for `PAYMENT_PRODUCTION_MONITORING_CONFIRMED="true"`.

## Gate groups

### Gateway checkout

When `CHECKOUT_MODE="gateway"`, the checker requires:

- `PAYMENT_BROWSER_SMOKE_TESTS_CONFIRMED="true"`
- `PAYMENT_PRODUCTION_MONITORING_CONFIRMED="true"`

This supplements the existing deploy-readiness checks for webhook secrets, settlement migration confirmation, and provider webhook smoke-test confirmation.

### Refund and void execution

When `PAYMENT_REFUND_VOID_EXECUTION_ENABLED="true"`, the checker requires:

- `PAYMENT_OPERATION_RECORDS_MIGRATION_CONFIRMED="true"`
- `PAYMENT_OPERATION_PROVIDER_EVIDENCE_CONFIRMED="true"`
- `PAYMENT_REFUND_VOID_SMOKE_TESTS_CONFIRMED="true"`
- `PAYMENT_OPERATION_STATE_TRANSITIONS_CONFIRMED="true"`
- `PAYMENT_PRODUCTION_MONITORING_CONFIRMED="true"`

### Live notification delivery

When `NOTIFICATION_LIVE_DELIVERY_ENABLED="true"`, the checker requires:

- `NOTIFICATION_PROVIDER_EVIDENCE_CONFIRMED="true"`
- `NOTIFICATION_SMOKE_TESTS_CONFIRMED="true"`
- `NOTIFICATION_DELIVERY_PERSISTENCE_CONFIRMED="true"`
- `PAYMENT_PRODUCTION_MONITORING_CONFIRMED="true"`

### Production monitoring confirmation

`PAYMENT_PRODUCTION_MONITORING_CONFIRMED="true"` should only be set after operators complete `docs/payment-production-monitoring-evidence.md` for every required case in `lib/checkout/payment-production-monitoring-matrix.ts`.

Required cases include:

- `checkout_creation_errors`
- `provider_handoff_failures`
- `payment_return_anomalies`
- `webhook_signature_failures`
- `settlement_mismatches`
- `refund_void_operation_failures`
- `notification_delivery_failures`
- `admin_payment_action_audit`
- `gateway_mode_rollback_drill`

Run the focused monitoring guard with:

```bash
npm run check:payment-production-monitoring
```

## Usage

Run the standalone checker in a production-like environment:

```bash
npm run check:payment-production-gates
```

A ready result exits with code `0`.

A blocked result exits with code `1` and prints the missing gate codes.

## Deploy-readiness integration

`lib/deploy-readiness.ts` now imports `getPaymentProductionGateConfig` and `getPaymentProductionGates`, then converts returned payment production gates into production deploy blockers.

CI/deploy wrappers can also call `npm run check:payment-production-gates` and `npm run check:payment-production-monitoring` as focused checks.
