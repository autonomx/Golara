import assert from 'node:assert/strict';
import { checkoutProviderMode } from '../../lib/checkout/payment-provider-mode';

export async function runPaymentProviderModeTests() {
  assert.deepEqual(checkoutProviderMode('manual'), { provider: 'manual', kind: 'local' });
  assert.deepEqual(checkoutProviderMode('domestic_redirect'), { provider: 'domestic_redirect', kind: 'local' });
  assert.deepEqual(checkoutProviderMode('zarinpal'), { provider: 'zarinpal', kind: 'local' });

  assert.deepEqual(checkoutProviderMode('iranian'), { provider: 'iranian', kind: 'adapter' });
  assert.deepEqual(checkoutProviderMode('stripe'), { provider: 'stripe', kind: 'adapter' });
  assert.deepEqual(checkoutProviderMode('whatsapp'), { provider: 'whatsapp', kind: 'adapter' });
  assert.deepEqual(checkoutProviderMode('inquiry'), { provider: 'inquiry', kind: 'adapter' });

  assert.deepEqual(checkoutProviderMode(' STRIPE '), { provider: 'stripe', kind: 'adapter' });
  assert.deepEqual(checkoutProviderMode('UNKNOWN'), { provider: 'manual', kind: 'local' });
  assert.deepEqual(checkoutProviderMode(undefined), { provider: 'manual', kind: 'local' });
  assert.deepEqual(checkoutProviderMode(null), { provider: 'manual', kind: 'local' });

  console.log('payment-provider-mode.test.ts passed');
}
