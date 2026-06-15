import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getPaymentProductionGateConfig, getPaymentProductionGates } from '@/lib/checkout/payment-production-gates';

function codes(env: NodeJS.ProcessEnv) {
  return getPaymentProductionGates(getPaymentProductionGateConfig(env)).map((gate) => gate.code);
}

export function runPaymentProductionGatesTests() {
  assert.deepEqual(codes({}), []);

  assert.deepEqual(codes({ CHECKOUT_MODE: 'gateway' }), [
    'payment_browser_smoke_tests_unconfirmed',
    'payment_production_monitoring_unconfirmed'
  ]);

  assert.deepEqual(codes({
    CHECKOUT_MODE: 'gateway',
    PAYMENT_BROWSER_SMOKE_TESTS_CONFIRMED: 'true',
    PAYMENT_PRODUCTION_MONITORING_CONFIRMED: 'true'
  }), []);

  assert.deepEqual(codes({ PAYMENT_REFUND_VOID_EXECUTION_ENABLED: 'true' }), [
    'payment_operation_records_migration_unconfirmed',
    'payment_operation_provider_evidence_unconfirmed',
    'payment_refund_void_smoke_tests_unconfirmed',
    'payment_operation_state_transitions_unconfirmed',
    'payment_production_monitoring_unconfirmed'
  ]);

  assert.deepEqual(codes({
    PAYMENT_REFUND_VOID_EXECUTION_ENABLED: 'true',
    PAYMENT_OPERATION_RECORDS_MIGRATION_CONFIRMED: 'true',
    PAYMENT_OPERATION_PROVIDER_EVIDENCE_CONFIRMED: 'true',
    PAYMENT_REFUND_VOID_SMOKE_TESTS_CONFIRMED: 'true',
    PAYMENT_OPERATION_STATE_TRANSITIONS_CONFIRMED: 'true',
    PAYMENT_PRODUCTION_MONITORING_CONFIRMED: 'true'
  }), []);

  assert.deepEqual(codes({ NOTIFICATION_LIVE_DELIVERY_ENABLED: 'true' }), [
    'notification_provider_evidence_unconfirmed',
    'notification_smoke_tests_unconfirmed',
    'notification_delivery_persistence_unconfirmed',
    'payment_production_monitoring_unconfirmed'
  ]);

  assert.deepEqual(codes({
    NOTIFICATION_LIVE_DELIVERY_ENABLED: 'true',
    NOTIFICATION_PROVIDER_EVIDENCE_CONFIRMED: 'true',
    NOTIFICATION_SMOKE_TESTS_CONFIRMED: 'true',
    NOTIFICATION_DELIVERY_PERSISTENCE_CONFIRMED: 'true',
    PAYMENT_PRODUCTION_MONITORING_CONFIRMED: 'true'
  }), []);

  const source = readFileSync('lib/checkout/payment-production-gates.ts', 'utf8');
  assert.match(source, /PAYMENT_BROWSER_SMOKE_TESTS_CONFIRMED/);
  assert.match(source, /PAYMENT_REFUND_VOID_EXECUTION_ENABLED/);
  assert.match(source, /NOTIFICATION_LIVE_DELIVERY_ENABLED/);
  assert.match(source, /PAYMENT_PRODUCTION_MONITORING_CONFIRMED/);
  assert.doesNotMatch(source, /fetch\s*\(/);
  assert.doesNotMatch(source, /prisma\./i);

  const cli = readFileSync('tools/check-payment-production-gates.mjs', 'utf8');
  assert.match(cli, /Payment production gates: blocked/);
  assert.match(cli, /process\.exit\(1\)/);
  assert.match(cli, /CHECKOUT_MODE/);
  assert.match(cli, /PAYMENT_REFUND_VOID_EXECUTION_ENABLED/);
  assert.match(cli, /NOTIFICATION_LIVE_DELIVERY_ENABLED/);
  assert.doesNotMatch(cli, /fetch\s*\(/);
  assert.doesNotMatch(cli, /prisma\./i);

  const pkg = readFileSync('package.json', 'utf8');
  assert.match(pkg, /"check:payment-production-gates": "node tools\/check-payment-production-gates\.mjs"/);

  const roadmap = readFileSync('docs/payment-readiness-implementation-roadmap.md', 'utf8');
  for (const fragment of [
    'Target-environment gateway validation',
    'Checkout and payment browser QA',
    'Payment operation migration validation',
    'Refund and void live execution enablement',
    'Real notification delivery for payment/order events',
    'End-to-end order, fulfillment, and reconciliation QA',
    'Production monitoring, incident response, and rollback',
    'Do not treat source guards, documentation guards, or repository diffs as provider validation evidence.'
  ]) {
    assert.ok(roadmap.includes(fragment), `Expected roadmap to include: ${fragment}`);
  }

  console.log('payment-production-gates.test.ts passed');
}
