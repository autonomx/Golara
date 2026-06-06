# Phase 38 Health-Check Inventory Plan

Status: planning-only health-check inventory handoff.

Purpose:

- Define the next safe Phase 38 planning slice for production health-check coverage.
- Keep this document non-runtime and non-operator-actionable until a later PR explicitly scopes behavior.

Initial health-check domains:

- storefront
- admin
- database
- media storage
- provider dependencies

Health-check shape requirements:

- health_domain_required: true
- dependency_name_required: true
- readiness_signal_required: true
- degradation_state_required: true
- owner_role_required: true
- operator_message_required: true
- external_status_link_allowed: true
- secret_values_allowed: false
- live_probe_allowed: false
- live_operator_action_allowed: false

Allowed next slice:

- add a pure health-check inventory catalog helper with no side effects
- add unit coverage for health domains, dependency labels, boundary language, and disabled live probes

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
- live health probes
- provider SDK calls
- operator actions
