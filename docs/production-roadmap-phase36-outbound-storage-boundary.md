# Phase 36 Outbound Storage Boundary

Status: pure storage-boundary helper added for the durable outbound webhook delivery table; Prisma model alignment, repository reads, repository writes, dispatcher execution, signing runtime, admin recovery controls, and live outbound delivery remain deferred.

## Scope

This slice starts Phase 36 with a pure storage-access boundary helper. The SQL migration artifact for `OutboundWebhookDelivery` already exists, but runtime use remains disabled until later reviewed slices add a passive Prisma model, repository contracts, admin read routes, signing, dispatcher behavior, and recovery controls in order.

## Added helper

- `lib/settings/outbound-webhook-delivery-storage-contract.ts`

The helper reports:

- whether the migration table is expected to exist
- whether the Prisma model is still pending
- that repository reads are disabled
- that repository writes are disabled
- that dispatcher behavior is disabled
- that signing runtime is disabled
- that recovery controls are disabled

## Runtime boundary

This slice does not add:

- Prisma model/client usage
- database reads
- database writes
- repository adapter behavior
- route handlers
- admin pages
- dispatcher, queue worker, scheduler, or background loop
- retry execution
- signing runtime or secret reads
- outbound HTTP delivery
- admin retry, cancel, replay, force-send, or recovery controls

## Follow-up order

1. Add a passive `OutboundWebhookDelivery` Prisma model only after a safe full-schema edit path is available.
2. Add read-only repository access after the generated client has been validated on the exact PR head.
3. Add route-core/admin read-only visibility after repository reads exist.
4. Add write paths only after idempotency, audit, and runtime boundaries are separately guarded.
5. Add dispatcher, signing, retry execution, and recovery controls only in later dedicated slices.
