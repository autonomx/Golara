import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const migration = readFileSync('prisma/migrations/20260616023000_add_installment_schedule_foundation/migration.sql', 'utf8');
const service = readFileSync('lib/checkout/installment-schedule-foundation.ts', 'utf8');

for (const fragment of [
  'CREATE TABLE IF NOT EXISTS "InstallmentPaymentPlan"',
  'CREATE TABLE IF NOT EXISTS "InstallmentPaymentScheduleEntry"',
  '"InstallmentPaymentPlan_paymentAttemptId_key"',
  '"InstallmentPaymentScheduleEntry_planId_sequence_key"',
  '"InstallmentPaymentPlan_amounts_non_negative"',
  '"InstallmentPaymentScheduleEntry_amounts_non_negative"',
  'FOREIGN KEY ("paymentAttemptId") REFERENCES "CheckoutPaymentAttempt"("id") ON DELETE CASCADE',
  'FOREIGN KEY ("planId") REFERENCES "InstallmentPaymentPlan"("id") ON DELETE CASCADE'
]) {
  assert.ok(migration.includes(fragment), `Expected installment schedule migration fragment: ${fragment}`);
}

for (const fragment of [
  'createInstallmentScheduleForApprovedAttempt',
  "paymentMethodType) !== 'installment'",
  "installmentApprovalStatus) !== 'approved'",
  'installmentApprovedTermMonths',
  'installmentDownPaymentCents',
  'splitEvenly(financedAmountCents, termMonths)',
  'SELECT "id" FROM "InstallmentPaymentPlan"',
  'INSERT INTO "InstallmentPaymentPlan"',
  'INSERT INTO "InstallmentPaymentScheduleEntry"',
  'installmentSchedulePlanId',
  "type: 'payment.installment.schedule.created'"
]) {
  assert.ok(service.includes(fragment), `Expected installment schedule service fragment: ${fragment}`);
}

console.log('installment-schedule-foundation-source.test.ts passed');
