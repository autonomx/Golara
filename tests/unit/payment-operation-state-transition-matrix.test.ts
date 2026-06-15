import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import {
  getPaymentOperationStateTransitionCaseIds,
  getPaymentOperationStateTransitionMatrix
} from '@/lib/checkout/payment-operation-state-transition-matrix';

const matrix = getPaymentOperationStateTransitionMatrix();
const caseIds = getPaymentOperationStateTransitionCaseIds();

for (const requiredId of [
  'full-refund-before-fulfillment',
  'full-refund-after-fulfillment-started',
  'partial-refund',
  'void-before-fulfillment',
  'void-after-fulfillment-started',
  'provider-operation-failed'
]) {
  assert.ok(caseIds.includes(requiredId), `Expected payment operation transition case ${requiredId}`);
}

for (const entry of matrix) {
  assert.ok(entry.requiredEvidence.length >= 3, `${entry.id} should require concrete evidence`);
  assert.ok(entry.requiredGuards.length >= 3, `${entry.id} should require source/behavior guards`);
  assert.ok(entry.orderStatusExpectation, `${entry.id} should define order status expectation`);
  assert.ok(entry.paymentStatusExpectation, `${entry.id} should define payment status expectation`);
}

const partialRefund = matrix.find((entry) => entry.id === 'partial-refund');
assert.equal(partialRefund?.releaseExpectation, 'none');
assert.ok(partialRefund?.requiredGuards.includes('no_inventory_release_for_partial_refund'));
assert.ok(partialRefund?.requiredEvidence.includes('partial_amount_reconciliation'));

const providerFailure = matrix.find((entry) => entry.id === 'provider-operation-failed');
assert.equal(providerFailure?.orderStatusExpectation, 'unchanged');
assert.equal(providerFailure?.paymentStatusExpectation, 'unchanged');
assert.equal(providerFailure?.releaseExpectation, 'none');
assert.ok(providerFailure?.requiredGuards.includes('no_state_mutation_after_provider_failure'));
assert.ok(providerFailure?.requiredGuards.includes('no_inventory_release_after_provider_failure'));

const voidBeforeFulfillment = matrix.find((entry) => entry.id === 'void-before-fulfillment');
assert.equal(voidBeforeFulfillment?.orderStatusExpectation, 'cancelled_after_provider_success');
assert.equal(voidBeforeFulfillment?.paymentStatusExpectation, 'voided_after_provider_success');
assert.ok(voidBeforeFulfillment?.requiredGuards.includes('void_only_before_capture'));

const source = readFileSync('lib/checkout/payment-operation-state-transition-matrix.ts', 'utf8');
for (const forbidden of ['fetch(', 'PrismaClient', 'process.env', 'updateMany', 'deleteMany', 'executeRaw', 'window.', 'document.']) {
  assert.ok(!source.includes(forbidden), `Transition matrix must not use ${forbidden}`);
}

console.log('payment operation state transition matrix guard passed');
