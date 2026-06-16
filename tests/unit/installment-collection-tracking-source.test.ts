import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const service = readFileSync('lib/checkout/installment-collection.ts', 'utf8');
const page = readFileSync('app/admin/payments/installments/page.tsx', 'utf8');
const actions = readFileSync('app/admin/payments/installments/actions.ts', 'utf8');

for (const fragment of [
  "INSTALLMENT_COLLECTION_OUTCOMES = ['paid', 'failed', 'waived']",
  'listInstallmentCollectionQueue',
  'collectInstallmentScheduleEntry',
  'FROM "InstallmentPaymentScheduleEntry" entry',
  "entry.\"status\" IN ('scheduled', 'failed')",
  'installmentCollectionStatus',
  'lastInstallmentCollectionEvent',
  'payment.installment.collection.${outcome}',
  'Finalized installment schedule entries cannot be collected again.'
]) {
  assert.ok(service.includes(fragment), `Expected installment collection service fragment: ${fragment}`);
}

for (const fragment of [
  'listInstallmentCollectionQueue()',
  'collectionItems.length',
  'Scheduled installment payments',
  'collectInstallmentScheduleEntryAction',
  'hiddenCollectionFields(entry, \'paid\')',
  'hiddenCollectionFields(entry, \'failed\')',
  'hiddenCollectionFields(entry, \'waived\')',
  'Collected amount cents'
]) {
  assert.ok(page.includes(fragment), `Expected installment collection page fragment: ${fragment}`);
}

for (const fragment of [
  "assertAdminRole('staff')",
  'parseCollectionOutcome',
  'collectInstallmentScheduleEntry({',
  "action: 'payment.installment.collection'",
  "entity: 'installmentPaymentScheduleEntry'",
  'statusForCollectionOutcome(outcome)',
  'revalidatePath(`/admin/orders/${collected.orderId}`)'
]) {
  assert.ok(actions.includes(fragment), `Expected installment collection action fragment: ${fragment}`);
}

console.log('installment-collection-tracking-source.test.ts passed');
