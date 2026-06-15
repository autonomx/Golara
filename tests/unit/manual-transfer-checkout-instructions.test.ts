import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const checkoutPage = readFileSync('app/cart/checkout/page.tsx', 'utf8');
const checkoutAction = readFileSync('app/cart/checkout/actions.ts', 'utf8');

for (const fragment of [
  'transferTitle',
  'manualPaymentReference',
  'manualPaymentProofUrl',
  "method.methodType === 'manual_transfer'",
  'Bank transfer or card-to-card instructions',
  'راهنمای کارت‌به‌کارت یا انتقال بانکی'
]) {
  assert.ok(checkoutPage.includes(fragment), `Expected checkout page to expose manual-transfer fragment: ${fragment}`);
}

for (const fragment of [
  'function manualTransferMetadata(formData: FormData, methodType: string)',
  "if (methodType !== 'manual_transfer') return {};",
  "manualPaymentReference: boundedStringField(formData, 'manualPaymentReference', 120) || null",
  "manualPaymentProofUrl: boundedStringField(formData, 'manualPaymentProofUrl', 240) || null",
  'manualPaymentInstructionsAcknowledged: true',
  '...checkoutPaymentMethodMetadata(paymentMethodSelection.selection)',
  '...manualTransferMetadata(formData, paymentMethodSelection.selection.methodType)'
]) {
  assert.ok(checkoutAction.includes(fragment), `Expected checkout action to persist manual-transfer fragment: ${fragment}`);
}

assert.ok(!checkoutAction.includes("metadata: checkoutPaymentMethodMetadata(paymentMethodSelection.selection)"), 'Expected payment metadata to include manual-transfer metadata extension.');

console.log('manual-transfer-checkout-instructions.test.ts passed');
