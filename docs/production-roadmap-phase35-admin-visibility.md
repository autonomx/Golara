# Phase 35 Admin Visibility Planning

Status: planning and source coverage only; no admin recovery controls or runtime behavior are added in this slice.

Last updated: 2026-06-05

## Scope

This slice defines the future admin read-only visibility contract for durable outbound webhook delivery records.

The goal is to make the eventual admin surface auditable and safe before any operator recovery action exists. The admin surface should be read-only at first and should rely on durable delivery storage, safe event references, safe outcome labels, and redacted summaries.

## Read-only list view contract

The future admin list view should show only fields that are safe for operational review:

| Field | Visibility expectation |
| --- | --- |
| `id` | Internal link target for the delivery detail page. |
| `configurationKey` | Safe configuration label or key. |
| `eventType` | Provider-neutral event name. |
| `eventRef` | Safe business-event reference. |
| `status` | Provider-neutral lifecycle status. |
| `attemptCount` | Number of completed attempts. |
| `lastOutcomeCategory` | Safe latest outcome label. |
| `nextEligibleAttemptAt` | Future eligibility timestamp when present. |
| `lastResponseCode` | Optional numeric response code summary. |
| `deadLetterSummary` | Redacted terminal summary when present. |
| `createdAt` | Creation timestamp for list ordering. |
| `updatedAt` | Freshness timestamp. |

## Detail view contract

The future detail view should provide enough context for support and operations without exposing secrets or raw sensitive payloads.

Expected read-only sections:

- Delivery identity: id, configuration key, event type, event reference, status, and idempotency key.
- Payload evidence: payload digest only, not raw payload content.
- Attempt summary: attempt count, last safe outcome label, optional response code, and next eligible timestamp.
- Dead-letter context: redacted summary only.
- Audit timestamps: created and updated timestamps.
- Related object links: order, customer, inquiry, or configuration links only when they use safe internal references.

## Filtering and sorting

Initial admin visibility should support planning for:

- status filter
- configuration key filter
- event type filter
- event reference lookup
- date range filter on created timestamp
- dead-letter-only filter
- default sorting by newest created timestamp first

## Redaction and safety rules

Admin visibility must not show:

- signing secret values
- raw payload bodies
- raw provider response bodies
- unrestricted operator notes
- request headers containing secrets
- environment variable values

Admin visibility may show:

- safe response codes
- safe outcome labels
- payload digest
- idempotency key
- secret-source labels without values
- redacted terminal summaries

## Deferred controls

The first admin surface should remain read-only.

Deferred until a later recovery-control slice:

- retry button
- cancel button
- replay button
- force-send button
- bulk actions
- mutation route handlers
- confirmation UX
- authorization policy for recovery actions
- audit log writes for recovery actions

## Readiness gates before implementation

Before adding the admin UI or route work:

1. Durable storage must exist in the target environment.
2. The Prisma model or repository read contract must be available.
3. Query pagination and filtering behavior must be documented.
4. Redaction rules must be covered by tests.
5. Recovery controls must remain absent in the first read-only slice.

This plan does not make outbound delivery operational.
