import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runPaymentWebhookServiceSettlementTests() {
  const service = source('lib/checkout/payment-webhook-service.ts');
  const repository = source('lib/checkout/payment-settlement-repository.ts');

  assert.match(repository, /paymentSettlementRepository = \{/);
  assert.match(repository, /upsertForPaymentEvent/);
  assert.match(service, /paymentSettlementRepository/);
  assert.match(service, /settlementReconciliation\?: PaymentSettlementReconciliationRecord \| null/);
  assert.match(service, /settlementReconciliation: await paymentSettlementRepository\.upsertForPaymentEvent\(existing\.id\)/);
  assert.match(service, /const settlementReconciliation = await paymentSettlementRepository\.upsertForPaymentEvent\(created\.id\)/);
  assert.match(service, /function shouldApplyWebhookStateChange/);
  assert.match(service, /settlementReconciliation,/);

  const createIndex = service.indexOf('checkoutPaymentEvent.create');
  const settlementIndex = service.indexOf('const settlementReconciliation = await paymentSettlementRepository.upsertForPaymentEvent(created.id)');
  const gateIndex = service.indexOf('const shouldApplyState = shouldApplyWebhookStateChange');
  const stateIndex = service.indexOf('await applyTrustedWebhookStateChange');
  assert.ok(createIndex > -1);
  assert.ok(settlementIndex > createIndex);
  assert.ok(gateIndex > settlementIndex);
  assert.ok(stateIndex > gateIndex);

  console.log('payment-webhook-service-settlement.test.ts passed');
}
