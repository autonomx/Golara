import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';

const selectionSource = readFileSync('lib/checkout/payment-method-checkout-selection.ts', 'utf8');

for (const fragment of [
  "export type CheckoutPaymentMethodSelectionFailureCode = 'payment-method-disabled' | 'payment-method-unavailable' | 'payment-method-required';",
  'function requestedDisabledMethod(settings: PaymentMethodSetting[], requestedKey?: string | null)',
  'settings.find((method) => method.key === normalizedKey && !method.isActive)',
  'const disabledMethod = requestedDisabledMethod(settings, requestedKey);',
  "if (disabledMethod) return { ok: false, code: 'payment-method-disabled', methods };",
  'const methods = activeMethods(settings);'
]) {
  assert.ok(selectionSource.includes(fragment), `Expected disabled fallback fragment: ${fragment}`);
}

const checkoutActionSource = readFileSync('app/cart/checkout/actions.ts', 'utf8');
assert.ok(
  checkoutActionSource.includes('if (!paymentMethodSelection.ok) redirect(checkoutPath(paymentMethodSelection.code));'),
  'Checkout action must redirect on disabled method selection before payment attempt creation.'
);

const roadmap = readFileSync('docs/digikala-style-payment-remaining-phases.md', 'utf8');
assert.ok(
  roadmap.includes('Gateway fallback/disable behavior rejects disabled selected methods before provider routing.'),
  'Roadmap should record gateway disable/fallback completion.'
);
assert.ok(
  roadmap.includes('Done for this phase; future gateway refund/void behavior is tracked in P6.'),
  'Roadmap should close P5 after disabled-method handling.'
);
assert.ok(
  roadmap.includes('Start **Phase P6 — gateway refund/void adapter boundary**'),
  'Roadmap should recommend the P6 gateway refund/void boundary next.'
);

console.log('gateway-disable-fallback-source.test.ts passed');
