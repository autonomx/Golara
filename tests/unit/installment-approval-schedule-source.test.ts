import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const action = readFileSync('app/admin/payments/installments/actions.ts', 'utf8');
const page = readFileSync('app/admin/payments/installments/page.tsx', 'utf8');

for (const fragment of [
  "import { createInstallmentScheduleForApprovedAttempt } from '@/lib/checkout/installment-schedule-foundation';",
  'function optionalDateValue(formData: FormData, key: string)',
  "if (outcome === 'approved')",
  'await createInstallmentScheduleForApprovedAttempt({',
  "firstDueAt: optionalDateValue(formData, 'firstDueAt')",
  'schedulePlanId = schedule.plan?.id ?? null',
  'scheduleEntryCount = schedule.entries.length',
  "schedulePlanId,",
  "scheduleEntryCount,",
  "statusForOutcome(outcome, Boolean(schedulePlanId))"
]) {
  assert.ok(action.includes(fragment), `Expected installment approval schedule action fragment: ${fragment}`);
}

for (const fragment of [
  'Approval now creates the schedule from the approved term and first-due date',
  'name="firstDueAt" type="date"',
  'Approving creates the installment plan and scheduled receivable entries immediately',
  'Approve and create schedule'
]) {
  assert.ok(page.includes(fragment), `Expected installment approval schedule page fragment: ${fragment}`);
}

console.log('installment-approval-schedule-source.test.ts passed');
