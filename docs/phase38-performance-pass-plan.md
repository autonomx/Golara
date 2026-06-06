# Phase 38 Performance Pass Plan

Status: planning-only performance pass handoff.

Purpose:

- Define the next safe Phase 38 planning slice for production performance readiness.
- Keep this document non-runtime and non-operator-actionable until a later PR explicitly scopes behavior.

Initial performance domains:

- homepage
- product listing
- admin media
- checkout

Performance pass shape requirements:

- performance_domain_required: true
- user_path_required: true
- baseline_signal_required: true
- regression_risk_required: true
- owner_role_required: true
- measurement_plan_required: true
- external_benchmark_link_allowed: true
- secret_values_allowed: false
- live_probe_allowed: false
- live_operator_action_allowed: false

Allowed next slice:

- add a pure performance-domain catalog helper with no side effects
- add unit coverage for performance domains, required fields, boundary language, and disabled live probes

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
- live performance probes
- provider SDK calls
- operator actions
