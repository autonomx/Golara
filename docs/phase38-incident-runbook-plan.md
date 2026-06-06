# Phase 38 Incident Runbook Plan

Status: planning-only incident response handoff.

Purpose:

- Define the next safe Phase 38 planning slice for production incident response.
- Keep this document non-runtime and non-operator-actionable until a later PR explicitly scopes behavior.

Initial incident domains:

- payment failure
- provider outage
- webhook backlog
- notification outage
- migration rollback

Runbook shape requirements:

- incident_domain_required: true
- severity_required: true
- detection_signal_required: true
- owner_role_required: true
- customer_impact_required: true
- rollback_decision_required: true
- external_status_link_allowed: true
- secret_values_allowed: false
- live_operator_action_allowed: false

Allowed next slice:

- add a pure incident-domain catalog helper with no side effects
- add unit coverage for incident domains, required fields, boundary language, and disabled operator actions

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
- live incident execution
- provider SDK calls
- operator actions
