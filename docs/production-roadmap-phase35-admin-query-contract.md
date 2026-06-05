# Phase 35 Admin Query Contract Planning

Status: planning and source coverage only; no UI, route, repository, or runtime behavior is added in this slice.

Last updated: 2026-06-05

## Scope

This slice defines the future read-only query contract for admin visibility into durable outbound webhook delivery records.

The contract sits between durable storage and a later admin surface. It describes safe query inputs, pagination, sorting, output fields, and redaction rules before any implementation work exists.

## Read-only query inputs

Future read-only queries should accept a bounded set of filters:

| Input | Contract |
| --- | --- |
| `status` | Optional lifecycle status filter using the Phase 35 status allowlist. |
| `configurationKey` | Optional exact configuration key filter. |
| `eventType` | Optional exact event type filter. |
| `eventRef` | Optional exact safe business-event reference lookup. |
| `createdFrom` | Optional lower bound for created timestamp. |
| `createdTo` | Optional upper bound for created timestamp. |
| `deadLetterOnly` | Optional boolean for terminal review queues. |
| `pageSize` | Bounded page size with a safe maximum. |
| `cursor` | Opaque cursor for pagination. |

Free-text search should remain deferred until redaction and indexing behavior are reviewed.

## Pagination and sorting

Future read-only queries should use stable pagination:

- Default sort by `createdAt` descending.
- Use `id` as a stable tiebreaker when timestamps match.
- Return an opaque next cursor rather than exposing raw query internals.
- Enforce a maximum page size for admin list views.
- Keep date filters inclusive/exclusive semantics documented before implementation.

## Read model output

The future read model should return only safe fields:

- `id`
- `configurationKey`
- `eventType`
- `eventRef`
- `status`
- `attemptCount`
- `lastOutcomeCategory`
- `nextEligibleAttemptAt`
- `lastResponseCode`
- `deadLetterSummary`
- `createdAt`
- `updatedAt`

The read model may include safe derived labels, such as stale status or terminal status, as long as the labels do not reveal sensitive payload or secret values.

## Redaction contract

The read contract must never return:

- signing secret values
- raw payload bodies
- raw receiver response bodies
- unrestricted operator notes
- request headers containing secret material
- environment variable values

The read contract may return:

- payload digest
- idempotency key
- safe outcome label
- safe response code
- redacted terminal summary
- secret-source label without its value

## Implementation deferral

This slice does not add:

- admin UI
- route handlers
- repository read functions
- service write functions
- recovery actions
- background workers
- outbound calls
- live provider behavior

## Follow-up gates

Before implementing the read query:

1. Prisma schema or repository read access must be available.
2. Pagination behavior must be unit tested.
3. Filter normalization must be unit tested.
4. Redaction behavior must be unit tested.
5. Recovery actions must remain absent from the first read-only query slice.

This plan does not make outbound delivery operational.
