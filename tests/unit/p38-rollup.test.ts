import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

export async function runP38RollupTests() {
  const rollupDoc = readFileSync('docs/phase38-rollup.md', 'utf8');
  const closeoutDoc = readFileSync('docs/phase38-closeout.md', 'utf8');
  const implementationPlanDoc = readFileSync('docs/phase38-implementation-plan.md', 'utf8');
  const structuredLoggingDoc = readFileSync('docs/phase38-structured-logging-plan.md', 'utf8');
  const incidentRunbookDoc = readFileSync('docs/phase38-incident-runbook-plan.md', 'utf8');
  const healthCheckDoc = readFileSync('docs/phase38-health-check-inventory-plan.md', 'utf8');
  const performancePassDoc = readFileSync('docs/phase38-performance-pass-plan.md', 'utf8');
  const productionTestMatrixDoc = readFileSync('docs/production-test-matrix.md', 'utf8');
  const packageJson = readFileSync('package.json', 'utf8');
  const fullSuite = readFileSync('tools/run-full-test-suite.mjs', 'utf8');
  const coverageRunner = readFileSync('tools/run-coverage-suite.mjs', 'utf8');
  const unitRunner = readFileSync('tests/unit/run-tests.ts', 'utf8');
  const functionalRunner = readFileSync('tests/functional/run-tests.ts', 'utf8');
  const apiRunner = readFileSync('tests/api/run-tests.ts', 'utf8');
  const e2eRunner = readFileSync('tests/e2e/run-tests.ts', 'utf8');
  const ciWorkflow = readFileSync('.github/workflows/ci.yml', 'utf8');

  for (const marker of [
    'PR 351',
    'PR 352',
    'PR 354',
    'PR 355',
    'PR 356',
    'PR 357',
    'PR 358',
    'PR 359',
    'PR 360',
    'PR 361',
    'PR 362',
    'PR 363',
    'PR 364',
    'PR 365',
    'docs/phase38-structured-logging-plan.md',
    'docs/phase38-incident-runbook-plan.md',
    'docs/phase38-health-check-inventory-plan.md',
    'docs/phase38-performance-pass-plan.md',
    'phase: 38',
    'runtime: false',
    'storage: false',
    'delivery: false',
    'external_calls: false',
    'operator_actions: false',
    'live_behavior: false',
  ]) {
    assert.ok(rollupDoc.includes(marker), `rollup doc must include ${marker}`);
  }

  for (const marker of [
    'planning/readiness complete',
    'PR 351',
    'PR 352',
    'PR 354',
    'PR 355',
    'PR 356',
    'PR 357',
    'PR 358',
    'PR 359',
    'PR 360',
    'PR 361',
    'PR 362',
    'PR 363',
    'PR 364',
    'PR 365',
    'PR 366',
    'structured_logging_planning: complete',
    'incident_runbook_planning: complete',
    'health_check_inventory_planning: complete',
    'performance_pass_planning: complete',
    'next_phase_planning_required: false',
    'implementation_plan_required: true',
    'branch_per_slice_required: true',
    'exact_head_ci_required: true',
    'runtime_enabled: false',
    'storage_enabled: false',
    'delivery_enabled: false',
    'external_calls_enabled: false',
    'operator_actions_enabled: false',
    'live_behavior_enabled: false',
  ]) {
    assert.ok(closeoutDoc.includes(marker), `closeout doc must include ${marker}`);
  }

  for (const marker of [
    'planning-only implementation handoff',
    'structured logging plan',
    'incident runbook planning',
    'health-check inventory planning',
    'performance-pass planning',
    'implementation_plan_required: true',
    'branch_per_slice_required: true',
    'exact_head_ci_required: true',
    'runtime_enabled: false',
    'storage_enabled: false',
    'delivery_enabled: false',
    'external_calls_enabled: false',
    'operator_actions_enabled: false',
    'live behavior changes',
  ]) {
    assert.ok(implementationPlanDoc.includes(marker), `implementation plan doc must include ${marker}`);
  }

  for (const marker of [
    'planning-only logging handoff',
    'checkout',
    'payments',
    'webhooks',
    'notifications',
    'admin writes',
    'event_name_required: true',
    'request_correlation_required: true',
    'secret_values_allowed: false',
    'customer_pii_allowed: false',
    'payment_sensitive_data_allowed: false',
    'live log emission',
  ]) {
    assert.ok(structuredLoggingDoc.includes(marker), `structured logging doc must include ${marker}`);
  }

  for (const marker of [
    'planning-only incident response handoff',
    'payment failure',
    'provider outage',
    'webhook backlog',
    'notification outage',
    'migration rollback',
    'incident_domain_required: true',
    'severity_required: true',
    'detection_signal_required: true',
    'secret_values_allowed: false',
    'live_operator_action_allowed: false',
    'live incident execution',
  ]) {
    assert.ok(incidentRunbookDoc.includes(marker), `incident runbook doc must include ${marker}`);
  }

  for (const marker of [
    'planning-only health-check inventory handoff',
    'storefront',
    'admin',
    'database',
    'media storage',
    'provider dependencies',
    'health_domain_required: true',
    'dependency_name_required: true',
    'readiness_signal_required: true',
    'secret_values_allowed: false',
    'live_probe_allowed: false',
    'live health probes',
  ]) {
    assert.ok(healthCheckDoc.includes(marker), `health-check doc must include ${marker}`);
  }

  for (const marker of [
    'planning-only performance pass handoff',
    'homepage',
    'product listing',
    'admin media',
    'checkout',
    'performance_domain_required: true',
    'user_path_required: true',
    'baseline_signal_required: true',
    'secret_values_allowed: false',
    'live_probe_allowed: false',
    'live performance probes',
  ]) {
    assert.ok(performancePassDoc.includes(marker), `performance-pass doc must include ${marker}`);
  }

  for (const marker of [
    'unit: npm run test:unit',
    'functional: npm run test:functional',
    'api: npm run test:api',
    'nonbrowser: npm run test:nonbrowser',
    'e2e: npm run test:e2e',
    'route_e2e: npm run test:e2e:routes',
    'full_suite: npm run test:all',
    'checkout_state_machine_required: true',
    'payment_provider_adapter_required: true',
    'live_provider_network_calls_in_tests_allowed: false',
    'webhook_signature_guard_required: true',
    'webhook_idempotency_required: true',
    'settlement_reconciliation_required: true',
    'refund_void_preview_required: true',
    'refund_void_execution_allowed: false',
    'provider_readiness_diagnostics_required: true',
    'full_suite_command_required: true',
    'provider_dashboard_validation_required: true',
    'target_environment_migration_validation_required: true',
    'making external provider calls from CI',
  ]) {
    assert.ok(productionTestMatrixDoc.includes(marker), `production test matrix must include ${marker}`);
  }

  for (const script of ['test:unit', 'test:functional', 'test:api', 'test:nonbrowser', 'test:e2e', 'test:e2e:routes', 'test:all', 'test:coverage']) {
    assert.ok(packageJson.includes(`"${script}"`), `package.json must expose ${script}`);
  }

  for (const command of ['npm run typecheck', 'npm run test:unit', 'npm run test:functional', 'npm run test:api', 'npm run test:nonbrowser', 'npm run test:e2e']) {
    assert.ok(fullSuite.includes(command), `full suite must run ${command}`);
  }

  for (const marker of ['NODE_V8_COVERAGE', 'coverage-summary.json', 'coverage-summary.md', 'npm run test:all', 'process.execPath', 'Coverage suite failed to start', 'lowCoverageLibFiles', 'filesByPath', 'Lowest covered lib files', 'uniqueFiles']) {
    assert.ok(coverageRunner.includes(marker), `coverage runner must include ${marker}`);
  }

  for (const step of ['Functional tests', 'API tests', 'Nonbrowser tests', 'E2E contract tests', 'Full-suite summary', 'Coverage summary']) {
    assert.ok(ciWorkflow.includes(`name: ${step}`), `CI workflow must include ${step}`);
  }

  for (const command of ['npm run test:functional', 'npm run test:api', 'npm run test:nonbrowser', 'npm run test:e2e', 'npm run test:all', 'npm run test:coverage']) {
    assert.ok(ciWorkflow.includes(command), `CI workflow must run ${command}`);
  }

  assert.ok(ciWorkflow.includes('coverage-summary'), 'CI workflow must upload coverage summary artifacts');

  for (const guard of [
    'runCheckoutStateMachineTests',
    'runCheckoutPaymentProviderTests',
    'runPaymentGatewayAdaptersTests',
    'runPaymentWebhookSignatureTests',
    'runPaymentWebhookServiceTests',
    'runPaymentSettlementReconciliationTests',
    'runPaymentOperationProviderReadinessTests',
    'runPaymentOperationAdaptersTests',
  ]) {
    assert.ok(unitRunner.includes(guard), `unit runner must include payment guard ${guard}`);
  }

  assert.ok(functionalRunner.includes('runProductionReadinessFunctionalCoverageTests'), 'functional runner must include production readiness coverage');
  assert.ok(apiRunner.includes('runRouteSmokeContractTests'), 'api runner must include route smoke contract coverage');
  assert.ok(apiRunner.includes('runApiRouteInventoryTests'), 'api runner must include route inventory coverage');
  assert.ok(e2eRunner.includes('runE2eCriticalPathCoverageTests'), 'e2e runner must include critical path coverage');

  console.log('p38-rollup.test.ts passed');
}
