# Phase 35 — Admin Read Model Planning

This note defines the future read-model DTO and normalization expectations for durable outbound webhook delivery admin views. It is a documentation-only planning slice and a source guard target. It does not add UI, route handlers, repository reads, repository writes, Prisma schema changes, worker behavior, recovery actions, outbound delivery, or live provider behavior.

## Scope

The future admin read model should translate persisted outbound delivery records into safe, stable DTOs before an admin surface renders them. The read model should be explicit about fields, derived labels, redaction, pagination, filter normalization, and sort normalization so future implementation slices can remain small and auditable.

This plan is intentionally non-operational:

- no UI
- no route handler
- no repository read implementation
- no repository write implementation
- no recovery actions
- no background worker
- no live delivery
- no signing runtime
- no secret reads

## DTO expectations

### List item DTO

A future list item DTO should expose only summary fields needed for an admin table:

- delivery id
- configuration key
- event type
- event reference
- current status
- attempt count
- next eligible attempt timestamp
- created timestamp
- updated timestamp
- payload digest
- idempotency key
- safe outcome label
- terminal label
- dead-letter label
- stale label

The list item DTO should not include raw payload, raw provider response, raw receiver body, secret values, environment variable values, or signing material.

### Detail DTO

A future detail DTO may include the list item fields plus safe diagnostic context:

- redacted delivery summary
- status transition summary
- last attempt timestamp
- last response code
- last safe outcome label
- dead-letter summary label
- next eligible label
- normalized filter echo for the query that found the record

The detail DTO should continue to exclude raw payload, raw provider response bodies, raw receiver response bodies, secret values, environment variable values, request headers containing secrets, and runtime signature material.

### Pagination envelope

A future pagination envelope should include:

- items array
- page size
- opaque cursor for the next page
- has next page boolean
- normalized filter summary
- normalized sort summary

The cursor must be opaque. Admin clients should not depend on cursor internals, database ids embedded in plain text, or timestamp parsing from the cursor.

## Normalization rules

### Filter normalization

A future filter normalization result should provide a safe, typed interpretation of query inputs before any repository access occurs. Expected rules:

- status allowlist only
- exact-match filters only for configuration key, event type, event reference, and idempotency key
- date filter parsing with explicit lower and upper boundaries
- null-safe optional fields
- no free-text search yet
- unknown filters ignored or rejected by a documented policy
- payload digest accepted only as an exact digest string

Date filter parsing should preserve clear boundaries for created-at and updated-at ranges. Invalid date values should not fall back to broad scans silently.

### Sort normalization

A future sort normalization result should support only stable fields. Expected initial sort fields:

- created timestamp
- updated timestamp
- next eligible attempt timestamp
- attempt count
- status

The default sort should be newest created timestamp first. Sort direction should normalize to ascending or descending with a documented default. Unsupported sort fields should not reach repository access.

### Page size

A future page size normalizer should define a default and maximum page size. The page size must clamp or reject values above the maximum by a documented policy. The default should be small enough for admin responsiveness and large enough for operational review.

## Derived labels

Future DTO builders should derive labels from stored fields rather than exposing raw internals.

### Terminal and dead-letter labels

Terminal label examples:

- accepted
- failed terminal
- canceled
- exhausted

Dead-letter labels should be safe summary labels, not raw provider text. A dead-letter summary may indicate category and timestamp, but should avoid raw receiver content.

### Stale and next-eligible labels

Stale label examples:

- stale retry wait
- recent activity
- pending eligibility

Next-eligible labels should be derived from `nextEligibleAttemptAt`, current status, and attempt count. They should not trigger a retry or mutate delivery state.

## Safety and redaction

Allowed fields:

- payload digest
- idempotency key
- safe outcome label
- response code
- status
- attempt count
- safe timestamps
- redacted delivery summary

Disallowed fields:

- raw payload
- raw provider body
- raw receiver body
- secret values
- environment variable values
- signing secrets
- runtime signature material
- unredacted request headers

The redacted delivery summary should be compact and deterministic. It should help operators identify the record without exposing sensitive payload or receiver content.

## Implementation deferral

This slice defines an implementation deferral boundary. A future implementation slice may add pure DTO builders and normalizers first, then a repository-backed read path, then routes, then UI. Each step should keep recovery controls separate from read-only visibility.

This plan does not make outbound delivery operational and does not change production behavior.

## Pure helper contract planning

A future pure helper contract should be the first implementation step before repository access, route handlers, or UI. The helper contract should accept plain delivery-like input records and query options, then return deterministic DTO and normalization results without reading from Prisma, calling external services, mutating records, computing signatures, or triggering delivery.

Future helper entry points may include:

- `normalizeOutboundDeliveryAdminFilters`
- `normalizeOutboundDeliveryAdminSort`
- `normalizeOutboundDeliveryAdminPagination`
- `buildOutboundDeliveryListItemDto`
- `buildOutboundDeliveryDetailDto`
- `buildOutboundDeliveryPaginationEnvelope`

Helper contract boundaries:

- pure functions only
- deterministic outputs for stable inputs
- no Prisma imports
- no repository access
- no route handler dependency
- no UI dependency
- no environment variable reads
- no secret reads
- no outbound HTTP delivery
- no retry or recovery mutation

Expected pure helper inputs:

- record snapshot with stable scalar fields
- optional filter query object
- optional sort query object
- optional pagination query object
- current timestamp supplied by caller for stale label derivation

Expected pure helper outputs:

- normalized filter result
- normalized sort result
- normalized page-size result
- opaque cursor summary
- list item DTO
- detail DTO
- pagination envelope
- redaction audit labels

The future helper tests should cover valid and invalid filter inputs, status allowlist behavior, page size default and maximum handling, sort allowlist behavior, date filter boundaries, null-safe optional fields, derived stale labels, terminal labels, dead-letter labels, redacted delivery summary behavior, and the absence of raw payload or secret values in DTO output.

## Source guard expectations

The unit source guard should assert that this document keeps the stable planning phrases for:

- Admin Read Model Planning
- list item DTO
- detail DTO
- pagination envelope
- filter normalization
- sort normalization
- status allowlist
- page size
- opaque cursor
- date filter
- payload digest
- idempotency key
- safe outcome label
- raw payload
- secret values
- implementation deferral
- Pure helper contract planning
- deterministic outputs
- no Prisma imports
- no repository access
- no route handler dependency
- no UI dependency
- redaction audit labels
