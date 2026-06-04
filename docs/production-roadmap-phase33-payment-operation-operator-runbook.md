# Phase 33 Payment Operation Operator Runbook

Last updated: 2026-06-04

This runbook describes how operators should use the current Phase 33 refund, void, and payment-operation foundations. It is documentation-only and does not enable live provider execution.

## Current operating mode

Phase 33 payment-operation admin surfaces are read-only. Operators can review diagnostics, migration status, provider evidence status, static operation previews, and operation-history guidance, but they cannot execute refunds or voids from these pages.

Current read-only entry points:

- `/admin/payments/settlement`
- `/admin/payments/operations`
- `/admin/payments/operations/providers`
- `/admin/payments/operations/history?orderId=<order-id>`
- `/admin/payments/operations/preview`

## Before using operation history

Operation history depends on the raw-SQL `PaymentOperationRecord` migration:

- `prisma/migrations/20260604200000_add_payment_operation_records/migration.sql`

Before relying on operation-history reads in a target environment, operators must:

1. Apply the migration in the target environment.
2. Record migration validation evidence in `docs/production-roadmap-phase33-payment-operation-migration-validation-evidence.md`.
3. Confirm that `PAYMENT_OPERATION_RECORDS_MIGRATION_CONFIRMED=true` is set only after the migration is verified.
4. Re-check `/admin/payments/operations/history?orderId=<order-id>` for migration-confirmed read-only history output.

Do not set the migration confirmation flag for local assumptions, repository-only review, or unverified target environments.

## Before treating a provider as ready

Provider readiness diagnostics are informational. Before treating Stripe or ZarinPal refund/void execution as ready in a target environment, operators must provide evidence for:

- credential environment variable presence by variable name only, never secret value;
- endpoint mapping confirmation;
- provider response contract confirmation;
- idempotency semantics;
- provider dashboard evidence;
- staging/live validation evidence;
- rejected/error/retryable response examples;
- rollback and incident-response expectations.

Use `docs/production-roadmap-phase33-provider-endpoint-mapping-readiness.md` for endpoint-mapping evidence.

## Recommended read-only review flow

1. Open `/admin/payments/operations`.
2. Open provider readiness diagnostics at `/admin/payments/operations/providers`.
3. Confirm each provider remains `executionEnabled: false`.
4. Review static preview behavior at `/admin/payments/operations/preview`.
5. If migration evidence exists, review history at `/admin/payments/operations/history?orderId=<order-id>`.
6. Compare any operation-history findings with settlement data at `/admin/payments/settlement`.
7. Capture unresolved provider, migration, or reconciliation issues in the relevant Phase 33 evidence document.

## What operators must not do yet

Do not use Phase 33 read-only surfaces to perform or imply:

- live Stripe refunds;
- live Stripe voids;
- live ZarinPal refunds;
- live ZarinPal voids;
- default provider HTTP calls;
- provider adapter execution from admin navigation pages;
- pending operation-record creation from admin navigation pages;
- order mutation;
- payment mutation;
- inventory release;
- capacity release;
- provider credential exposure;
- concrete live endpoint URL publication without operator evidence;
- admin refund/void button enablement.

## Evidence artifacts to keep current

- `docs/production-roadmap-phase33-payment-operation-migration-validation-evidence.md`
- `docs/production-roadmap-phase33-provider-endpoint-mapping-readiness.md`
- `docs/production-roadmap-phase33-payment-operation-admin-navigation.md`
- `docs/production-roadmap-phase33-payment-operations.md`

## Escalation criteria

Escalate to a dedicated guarded implementation slice if any operator needs:

- live provider endpoint URLs;
- default HTTP clients;
- provider credential wiring;
- provider execution from admin actions;
- post-success order/payment state transitions;
- inventory/capacity release;
- Prisma model/client access for `PaymentOperationRecord`;
- production-ready refund/void execution claims.

Each escalation must define source guards, target-environment evidence requirements, and verification commands before execution behavior is added.
