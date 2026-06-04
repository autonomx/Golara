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
  assert.match(service, /settlementReconciliation,/);

  const createIndex = service.indexOf('checkoutPaymentEvent.create');
  const stateIndex = service.indexOf('await applyTrustedWebhookStateChange');
  const settlementIndex = service.indexOf('const settlementReconciliation = await paymentSettlementRepository.upsertForPaymentEvent(created.id)');
  assert.ok(createIndex > -1);
  assert.ok(stateIndex > createIndex);
  assert.ok(settlementIndex > stateIndex);

  console.log('payment-webhook-service-settlement.test.ts passed');
}
