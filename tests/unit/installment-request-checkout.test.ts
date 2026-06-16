import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

export async function runInstallmentRequestCheckoutTests() {
  const checkoutPage = readFileSync('app/cart/checkout/page.tsx', 'utf8');
  const checkoutAction = readFileSync('app/cart/checkout/actions.ts', 'utf8');

  for (const fragment of [
    "installmentTitle: 'Installment or credit purchase request'",
    "installmentTitle: 'درخواست خرید اقساطی یا اعتباری'",
    "const showInstallmentRequest = method.methodType === 'installment';",
    'name="installmentRequestedTermMonths"',
    'name="installmentRequestNote"',
    'installmentTermThree',
    'installmentTermSix',
    'installmentTermTwelve',
    'installmentTermEighteen'
  ]) {
    assert.ok(checkoutPage.includes(fragment), `checkout page must include installment request fragment: ${fragment}`);
  }

  for (const fragment of [
    'function installmentRequestMetadata(formData: FormData, methodType: string)',
    "if (methodType !== 'installment') return {};",
    "const allowedTerms = new Set(['3', '6', '12', '18']);",
    "installmentApprovalStatus: 'pending_review'",
    '...(installmentRequestedTermMonths ? { installmentRequestedTermMonths } : {})',
    '...(installmentRequestNote ? { installmentRequestNote } : {})',
    '...installmentRequestMetadata(formData, paymentMethodSelection.selection.methodType)'
  ]) {
    assert.ok(checkoutAction.includes(fragment), `checkout action must include installment metadata fragment: ${fragment}`);
  }

  assert.ok(!checkoutAction.includes('installmentRequestedTermMonths: undefined'), 'installment term must not persist undefined metadata values.');
  assert.ok(!checkoutAction.includes('installmentRequestNote: undefined'), 'installment note must not persist undefined metadata values.');
  assert.ok(!checkoutAction.includes('installmentRequestNote: null'), 'installment note must not persist null metadata values.');

  console.log('installment-request-checkout.test.ts passed');
}
