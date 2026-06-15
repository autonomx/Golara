import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  isPaymentProductionMonitoringEvidenceComplete,
  listPaymentProductionMonitoringRequirements,
  validatePaymentProductionMonitoringEvidence
} from '@/lib/checkout/payment-production-monitoring-matrix';

export function runPaymentProductionMonitoringMatrixTests() {
  const requirements = listPaymentProductionMonitoringRequirements();

  assert.equal(requirements.length, 9);
  assert.deepEqual(requirements.map((requirement) => requirement.id), [
    'checkout_creation_errors',
    'provider_handoff_failures',
    'payment_return_anomalies',
    'webhook_signature_failures',
    'settlement_mismatches',
    'refund_void_operation_failures',
    'notification_delivery_failures',
    'admin_payment_action_audit',
    'gateway_mode_rollback_drill'
  ]);

  assert.deepEqual(new Set(requirements.map((requirement) => requirement.domain)), new Set([
    'checkout',
    'payment_return',
    'webhook',
    'settlement',
    'refund_void',
    'notification',
    'admin_payment_action',
    'rollback'
  ]));

  assert.ok(requirements.every((requirement) => requirement.requiredSignal.length > 20));
  assert.ok(requirements.every((requirement) => requirement.requiredRunbook.length > 20));
  assert.equal(requirements.filter((requirement) => requirement.rollbackEvidenceRequired).length, 7);

  const blank = validatePaymentProductionMonitoringEvidence([]);
  assert.equal(blank.length, requirements.length);
  assert.ok(blank.every((check) => !check.complete));
  assert.ok(blank.find((check) => check.id === 'checkout_creation_errors')?.missing.includes('signal_evidence_missing'));
  assert.ok(blank.find((check) => check.id === 'checkout_creation_errors')?.missing.includes('rollback_evidence_missing'));
  assert.ok(!blank.find((check) => check.id === 'notification_delivery_failures')?.missing.includes('rollback_evidence_missing'));

  const partial = validatePaymentProductionMonitoringEvidence([
    {
      id: 'checkout_creation_errors',
      signalCaptured: true,
      runbookLinked: true,
      ownerAssigned: true
    }
  ]);
  assert.equal(partial.find((check) => check.id === 'checkout_creation_errors')?.complete, false);
  assert.deepEqual(partial.find((check) => check.id === 'checkout_creation_errors')?.missing, ['rollback_evidence_missing']);

  const completeInputs = requirements.map((requirement) => ({
    id: requirement.id,
    signalCaptured: true,
    runbookLinked: true,
    ownerAssigned: true,
    rollbackEvidenceCaptured: requirement.rollbackEvidenceRequired
  }));
  assert.ok(isPaymentProductionMonitoringEvidenceComplete(completeInputs));

  const source = readFileSync('lib/checkout/payment-production-monitoring-matrix.ts', 'utf8');
  assert.match(source, /checkout_creation_errors/);
  assert.match(source, /webhook_signature_failures/);
  assert.match(source, /settlement_mismatches/);
  assert.match(source, /refund_void_operation_failures/);
  assert.match(source, /notification_delivery_failures/);
  assert.match(source, /gateway_mode_rollback_drill/);
  assert.match(source, /signal_evidence_missing/);
  assert.match(source, /runbook_link_missing/);
  assert.match(source, /owner_assignment_missing/);
  assert.match(source, /rollback_evidence_missing/);
  assert.doesNotMatch(source, /fetch\s*\(/);
  assert.doesNotMatch(source, /prisma\./i);
  assert.doesNotMatch(source, /process\.env/);

  console.log('payment-production-monitoring-matrix.test.ts passed');
}
