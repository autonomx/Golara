# Phase 36 Read Repository Contract

Status: pure read-repository contract helper added for future durable outbound webhook delivery storage reads; no Prisma model/client usage, database reads, database writes, route handlers, admin pages, dispatcher execution, signing runtime, recovery controls, or live outbound delivery is enabled.

## Scope

This slice defines the future read-repository contract surface for `OutboundWebhookDelivery` without implementing a repository adapter.

The contract is intentionally pure. It identifies the future table, allowed read operation names, safe selected fields, redacted field categories, and deferred runtime capabilities. It does not access Prisma Client, execute SQL, read from storage, write to storage, or expose route/UI behavior.

## Added helper

- `lib/settings/outbound-webhook-delivery-read-repository-contract.ts`

The helper documents future read operations:

- `list_deliveries`
- `get_delivery_detail`
- `count_deliveries`

The selected fields mirror the safe storage columns already planned for admin visibility. Raw payloads, signing secrets, receiver response bodies, and request headers remain redacted and outside the read contract.

## Runtime boundary

This slice does not add:

- Prisma model alignment
- Prisma Client import or usage
- SQL execution
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

1. Add passive Prisma model alignment when a safe full-schema edit path is available.
2. Add read-only repository implementation after generated-client validation passes on the exact PR head.
3. Add route-core/admin read-only visibility after repository reads exist.
4. Add write paths only after idempotency and audit boundaries are guarded.
5. Keep dispatcher, signing, retry execution, recovery controls, and live delivery in later dedicated slices.
