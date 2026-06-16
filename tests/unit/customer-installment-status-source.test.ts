import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const readModel = readFileSync('lib/checkout/customer-installment-status.ts', 'utf8');
const page = readFileSync('app/account/orders/page.tsx', 'utf8');

for (const fragment of [
  'listCustomerInstallmentScheduleStatuses(customerId: string)',
  'WHERE "customerId" = ${customerId}',
  'FROM "InstallmentPaymentPlan"',
  'FROM "InstallmentPaymentScheduleEntry"',
  'Prisma.join(planIds)',
  'entries: entriesByPlan.get(plan.id) ?? []'
]) {
  assert.ok(readModel.includes(fragment), `Expected customer installment read-model fragment: ${fragment}`);
}

for (const fragment of [
  'listCustomerOrdersForSession(session)',
  'listCustomerInstallmentScheduleStatuses(session.customerId)',
  'installmentStatusByAttemptId',
  "textMetadataValue(metadata.paymentMethodType) === 'installment'",
  'InstallmentStatusCard',
  'installmentApprovalStatus',
  'installmentApprovedTermMonths',
  'installmentDownPaymentCents',
  'schedule.entries.slice(0, 6)'
]) {
  assert.ok(page.includes(fragment), `Expected customer installment page fragment: ${fragment}`);
}

console.log('customer-installment-status-source.test.ts passed');
