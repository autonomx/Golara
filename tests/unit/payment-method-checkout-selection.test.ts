import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { checkoutPaymentMethodMetadata, resolveCheckoutPaymentMethodSelection } from '@/lib/checkout/payment-method-checkout-selection';
import { DEFAULT_DIGIKALA_PAYMENT_METHOD_SETTINGS } from '@/lib/settings/payment-method-settings';

const defaultSelection = resolveCheckoutPaymentMethodSelection(DEFAULT_DIGIKALA_PAYMENT_METHOD_SETTINGS);
assert.equal(defaultSelection.ok, true);
if (defaultSelection.ok) {
  assert.equal(defaultSelection.selection.methodKey, 'iranian-ipg');
  assert.equal(defaultSelection.selection.provider, 'zarinpal');
  assert.equal(defaultSelection.selection.requiresManualReview, false);
}

const walletSelection = resolveCheckoutPaymentMethodSelection(DEFAULT_DIGIKALA_PAYMENT_METHOD_SETTINGS, 'wallet-credit');
assert.equal(walletSelection.ok, true);
if (walletSelection.ok) {
  assert.equal(walletSelection.selection.provider, 'manual');
  assert.equal(walletSelection.selection.requiresManualReview, true);
  assert.deepEqual(checkoutPaymentMethodMetadata(walletSelection.selection), {
    paymentMethodKey: 'wallet-credit',
    paymentMethodLabel: 'Wallet / store credit',
    paymentMethodType: 'wallet',
    paymentProviderKey: 'internal_wallet',
    paymentCaptureMode: 'ledger_capture',
    paymentSettlementMode: 'internal_ledger',
    paymentRequiresManualReview: true
  });
}

const unavailableSelection = resolveCheckoutPaymentMethodSelection(DEFAULT_DIGIKALA_PAYMENT_METHOD_SETTINGS, 'disabled-method');
assert.equal(unavailableSelection.ok, false);
if (!unavailableSelection.ok) assert.equal(unavailableSelection.code, 'payment-method-unavailable');

const inactiveSelection = resolveCheckoutPaymentMethodSelection(DEFAULT_DIGIKALA_PAYMENT_METHOD_SETTINGS.map((method) => ({ ...method, isActive: false })), 'iranian-ipg');
assert.equal(inactiveSelection.ok, false);
if (!inactiveSelection.ok) assert.equal(inactiveSelection.code, 'payment-method-required');

const checkoutPageSource = readFileSync('app/cart/checkout/page.tsx', 'utf8');
assert.ok(checkoutPageSource.includes('paymentMethodSettingsService.list()'), 'Checkout page should load configured payment methods.');
assert.ok(checkoutPageSource.includes('name="paymentMethodKey"'), 'Checkout page should submit the selected method key.');
assert.ok(checkoutPageSource.includes('buildPaymentMethodReadinessNotes(method, process.env)'), 'Checkout page should show readiness notes for configured methods.');

const checkoutActionSource = readFileSync('app/cart/checkout/actions.ts', 'utf8');
assert.ok(checkoutActionSource.includes("stringField(formData, 'paymentMethodKey')"), 'Checkout action should read paymentMethodKey.');
assert.ok(checkoutActionSource.includes('resolveCheckoutPaymentMethodSelection(await paymentMethodSettingsService.list(), paymentMethodKey)'), 'Checkout action should validate selected method against active settings.');
assert.ok(checkoutActionSource.includes('provider: paymentMethodSelection.selection.provider'), 'Checkout action should route payment attempt through the resolved provider.');
assert.ok(checkoutActionSource.includes('metadata: checkoutPaymentMethodMetadata(paymentMethodSelection.selection)'), 'Checkout action should persist selected method metadata.');

const providerSource = readFileSync('lib/checkout/payment-provider.ts', 'utf8');
assert.ok(providerSource.includes('metadata?: PaymentMetadata;'), 'Payment provider should accept checkout method metadata.');
assert.ok(providerSource.includes('const mergedMetadata = { ...(input.metadata ?? {}), ...(result.metadata ?? {}) };'), 'Payment provider should merge selected method metadata with provider metadata.');

console.log('payment-method-checkout-selection.test.ts passed');
