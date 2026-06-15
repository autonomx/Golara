import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const serviceSource = readFileSync('lib/checkout/manual-transfer-verification.ts', 'utf8');
const actionSource = readFileSync('app/admin/payments/manual-transfer/actions.ts', 'utf8');
const pageSource = readFileSync('app/admin/payments/manual-transfer/page.tsx', 'utf8');

for (const fragment of [
  "export const MANUAL_TRANSFER_VERIFICATION_OUTCOMES = ['received', 'rejected', 'needs_follow_up'] as const;",
  "paymentMethodType) === 'manual_transfer'",
  "manualTransferVerificationStatus: outcome",
  "manualTransferVerifiedAt: verifiedAt",
  "manualTransferVerifiedBy:",
  "manualTransferReceivedAmountCents: receivedAmountCents",
  "transitionCheckoutPaymentStatus({",
  "paymentAttemptId: attempt.id,",
  "to,"
]) {
  assert.ok(serviceSource.includes(fragment), `Expected manual transfer service fragment: ${fragment}`);
}

for (const fragment of [
  "const actor = await assertAdminRole('owner');",
  "verifyManualTransferPaymentAttempt(orderId, paymentAttemptId, {",
  "recordAdminAuditLog({",
  "action: `order.payment.manual_transfer.${outcome}`",
  "revalidatePath('/admin/payments/manual-transfer');",
  "redirect(`/admin/payments/manual-transfer?status=${statusForOutcome(outcome)}`);"
]) {
  assert.ok(actionSource.includes(fragment), `Expected manual transfer action fragment: ${fragment}`);
}

for (const fragment of [
  "listManualTransferReviewQueue()",
  "Manual transfer review",
  "outcome=\"received\"",
  "outcome=\"needs_follow_up\"",
  "outcome=\"rejected\"",
  "name=\"receivedAmountCents\"",
  "name=\"providerReference\"",
  "name=\"note\"",
  "Open order"
]) {
  assert.ok(pageSource.includes(fragment), `Expected manual transfer review page fragment: ${fragment}`);
}

for (const forbidden of [
  "assertAdminRole('staff');\n  const outcome",
  "metadata: { verified: true }"
]) {
  assert.ok(!actionSource.includes(forbidden), `Manual transfer action must not include unsafe fragment: ${forbidden}`);
}

console.log('manual transfer verification workflow guard passed');
