import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runProductionTestMatrixTests() {
  const matrix = source('docs/production-test-matrix.md');
  const pkg = source('package.json');
  const fullSuite = source('tools/run-full-test-suite.mjs');
  const unitRunner = source('tests/unit/run-tests.ts');
  const functionalRunner = source('tests/functional/run-tests.ts');
  const apiRunner = source('tests/api/run-tests.ts');
  const e2eRunner = source('tests/e2e/run-tests.ts');

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
    assert.ok(matrix.includes(marker), `production test matrix must include ${marker}`);
  }

  for (const script of ['test:unit', 'test:functional', 'test:api', 'test:nonbrowser', 'test:e2e', 'test:e2e:routes', 'test:all']) {
    assert.match(pkg, new RegExp(`"${script}"`), `package.json must expose ${script}`);
  }

  for (const command of ['npm run typecheck', 'npm run test:unit', 'npm run test:functional', 'npm run test:api', 'npm run test:nonbrowser', 'npm run test:e2e']) {
    assert.ok(fullSuite.includes(command), `full suite must run ${command}`);
  }

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

  console.log('production-test-matrix.test.ts passed');
}
