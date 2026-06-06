# Production Test Matrix

Status: repository test-suite expansion plan.

Purpose:

- Define the comprehensive test coverage required before Golara is treated as ready for production testing beyond the inquiry-first launch path.
- Keep payment, API, functional, and end-to-end coverage explicit, auditable, and connected to existing test runners.

Configured test commands:

- unit: npm run test:unit
- functional: npm run test:functional
- api: npm run test:api
- nonbrowser: npm run test:nonbrowser
- e2e: npm run test:e2e
- route_e2e: npm run test:e2e:routes
- full_suite: npm run test:all

Required coverage lanes:

- unit coverage for pure helpers, state machines, adapters, source guards, payment gateway helpers, payment webhook helpers, payment-operation helpers, notification providers, admin authorization boundaries, inventory/stock models, discounts, checkout totals, tax/shipping helpers, and launch-readiness helpers
- functional coverage for admin overview, database drift fallbacks, production readiness, migrations, catalog/admin workflows, checkout workflow boundaries, payment operation readiness, notification readiness, and full-suite structure
- api coverage for public routes, protected routes, write-route boundaries, webhook route contracts, payment return/cancel routes, admin server actions, and API fallback contracts
- e2e coverage for homepage, product listing, cart, login, account orders, SEO routes, checkout entry, provider return/cancel pages, admin readiness surfaces, and route smoke checks
- nonbrowser coverage for server-only import boundaries, browser-incompatible modules, and server action/runtime boundaries

Payment system coverage requirements:

- checkout_state_machine_required: true
- payment_provider_adapter_required: true
- live_provider_network_calls_in_tests_allowed: false
- stripe_checkout_session_shape_required: true
- zarinpal_callback_shape_required: true
- webhook_signature_guard_required: true
- webhook_idempotency_required: true
- settlement_reconciliation_required: true
- refund_void_preview_required: true
- refund_void_execution_allowed: false
- payment_operation_history_required: true
- provider_readiness_diagnostics_required: true
- admin_payment_visibility_required: true

Production test readiness gates:

- full_suite_command_required: true
- exact_head_ci_required: true
- route_smoke_required: true
- production_deploy_readiness_required: true
- launch_audit_required: true
- manual_smoke_required: true
- provider_dashboard_validation_required: true
- target_environment_migration_validation_required: true

Explicitly out of scope for this test-matrix slice:

- enabling live payment execution
- enabling live refund or void execution
- enabling real notification delivery
- adding provider secrets
- making external provider calls from CI
- mutating production data
