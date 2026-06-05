# Phase 35 — Admin Repository Read Preflight

This note defines the preflight expectations before any repository-backed admin read path is implemented for durable outbound webhook delivery records. It is documentation-only planning and source-guard coverage. It does not add repository functions, route handlers, UI, recovery controls, worker behavior, delivery behavior, or live provider behavior.

## Purpose

The future admin repository read path should only be added after the DTO and normalization helper contract is stable. Repository access should be a narrow adapter around reviewed filters, sorting, pagination, and redaction. The read path must not become a hidden worker, recovery surface, or payload exposure channel.

## Preconditions

Before implementation, confirm:

- the Prisma model exists in `schema.prisma`
- generated client validation passed on the exact PR head
- filter normalization is pure and tested
- sort normalization is pure and tested
- pagination normalization is pure and tested
- list item DTO mapping is pure and tested
- detail DTO mapping is pure and tested
- redaction rules are covered by unit tests
- no raw payload field is selected for admin DTO output
- no protected values are selected or logged

If any precondition is missing, the repository read slice should remain blocked.

## Repository boundary

A future repository read adapter should accept normalized input only. It should not parse raw query strings, infer UI behavior, mutate delivery records, compute retry state, trigger recovery actions, or send requests.

Allowed future repository responsibilities:

- list records with normalized filters
- read one record by delivery id
- apply normalized sort
- apply normalized page size
- return enough rows to determine `hasNextPage`
- project only safe scalar fields
- pass records to pure DTO builders

Disallowed responsibilities:

- raw query parsing
- route authorization
- UI state management
- retry execution
- recovery mutation
- worker polling
- delivery calls
- signing runtime
- protected value reads
- raw payload selection
- raw receiver body selection
- raw provider body selection

## Safe field projection

The future read path should explicitly select safe scalar fields:

- id
- configuration key
- event type
- event reference
- status
- attempt count
- next eligible attempt timestamp
- last safe outcome category
- last response code
- dead-letter summary
- payload digest
- idempotency key
- created timestamp
- updated timestamp

The read path should not select raw payload, raw provider body, raw receiver body, protected values, environment variable values, protected headers, or runtime signature material.

## Query shape planning

A future list read should receive:

- normalized filters
- normalized sort
- normalized page size
- opaque cursor input already decoded by a reviewed cursor helper or rejected before repository access

A future detail read should receive:

- delivery id
- optional normalized audit context

The repository read path should not accept free-text search yet. Exact-match filters should remain the initial boundary.

## Pagination and cursor preflight

Cursor handling should be reviewed before repository access is added. The future cursor contract should ensure:

- opaque cursor values are not interpreted by UI code
- invalid cursor values are rejected or ignored by a documented policy
- cursor ordering aligns with normalized sort
- cursor fields are safe scalar values only
- page size is clamped before repository access

## Test expectations

Future repository read tests should cover:

- normalized status filters reach the repository adapter
- unsupported status values are blocked before repository access
- exact-match filters remain exact-match
- page size maximum is enforced before repository access
- sort allowlist is enforced before repository access
- safe field projection excludes raw payload
- safe field projection excludes protected values
- DTO mapping uses the pure helper contract
- detail reads do not expose raw receiver body
- list reads do not trigger mutation or delivery behavior

## Implementation deferral

This preflight does not implement a repository read path. The future implementation should be a separate narrow slice after this plan, and should add source and unit coverage before any route or UI consumes it.

No admin route, UI panel, retry/cancel/replay control, worker, background loop, signing runtime, delivery behavior, or live provider behavior belongs in this preflight slice.

## Source guard expectations

The unit source guard should assert that this document keeps stable planning phrases for:

- Admin Repository Read Preflight
- normalized filters
- normalized sort
- normalized page size
- safe field projection
- exact-match filters
- opaque cursor
- no raw payload
- protected values
- no route handlers
- no UI
- recovery controls
- worker behavior
- implementation deferral
