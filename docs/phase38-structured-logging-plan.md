# Phase 38 Structured Logging Plan

Status: planning-only logging handoff.

Purpose:

- Define the first safe Phase 38 implementation slice for production observability.
- Keep the scope non-runtime until a later PR explicitly adds a pure helper or guarded integration.

Initial logging domains:

- checkout
- payments
- webhooks
- notifications
- admin writes

Planned log-shape requirements:

- event_name_required: true
- request_correlation_required: true
- actor_context_required: true
- operation_outcome_required: true
- provider_context_allowed: true
- secret_values_allowed: false
- customer_pii_allowed: false
- payment_sensitive_data_allowed: false

Allowed next slice:

- add a pure structured-log event catalog helper with no side effects
- add unit coverage for event names, allowed domains, redaction boundaries, and disabled runtime emission

Explicitly out of scope for this plan:

- route handlers
- admin UI
- schema changes
- migrations
- worker behavior
- retry behavior
- signing runtime
- outbound delivery
- external calls
- live log emission
- provider SDK calls
- operator actions
