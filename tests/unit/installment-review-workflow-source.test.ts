import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const service = readFileSync('lib/checkout/installment-review.ts', 'utf8');
const action = readFileSync('app/admin/payments/installments/actions.ts', 'utf8');
const page = readFileSync('app/admin/payments/installments/page.tsx', 'utf8');

for (const fragment of [
  "INSTALLMENT_REVIEW_OUTCOMES = ['approved', 'rejected', 'needs_follow_up']",
  "paymentMethodType) === 'installment'",
  "installmentApprovalStatus: approvalStatus",
  'installmentReviewedAt',
  'installmentApprovedTermMonths',
  'installmentDownPaymentCents',
  'transitionCheckoutPaymentStatus({',
  "if (outcome === 'rejected') return 'failed' as const;"
]) {
  assert.ok(service.includes(fragment), `Expected installment review service fragment: ${fragment}`);
}

for (const fragment of [
  'await requireAdminActionSession()',
  "if (admin.role !== 'owner')",
  "action: 'payment.installment.review'",
  "entity: 'checkoutPaymentAttempt'",
  "revalidatePath('/admin/payments/installments')",
  "revalidatePath('/admin/orders')"
]) {
  assert.ok(action.includes(fragment), `Expected installment review action fragment: ${fragment}`);
}

for (const fragment of [
  'listInstallmentReviewQueue()',
  'reviewInstallmentAction',
  "hiddenFields(item, 'approved')",
  "hiddenFields(item, 'needs_follow_up')",
  "hiddenFields(item, 'rejected')",
  'Only owners can approve or reject installment requests'
]) {
  assert.ok(page.includes(fragment), `Expected installment review page fragment: ${fragment}`);
}

console.log('installment-review-workflow-source.test.ts passed');
