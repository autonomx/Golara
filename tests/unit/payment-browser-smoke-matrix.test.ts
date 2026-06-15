import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  getRequiredPaymentBrowserSmokeCases,
  paymentBrowserSmokeMatrix,
  summarizePaymentBrowserSmokeReadiness
} from '@/lib/checkout/payment-browser-smoke-matrix';

export function runPaymentBrowserSmokeMatrixTests() {
  assert.equal(paymentBrowserSmokeMatrix.length >= 9, true);

  const areas = new Set(paymentBrowserSmokeMatrix.map((testCase) => testCase.area));
  for (const area of [
    'cart',
    'checkout',
    'provider_handoff',
    'payment_return',
    'public_order',
    'localization',
    'account_context'
  ]) {
    assert.equal(areas.has(area as never), true, `Expected browser smoke area: ${area}`);
  }

  const required = getRequiredPaymentBrowserSmokeCases();
  assert.equal(required.length, paymentBrowserSmokeMatrix.length);
  assert.equal(required.every((testCase) => testCase.requiredForGatewayLaunch), true);
  assert.equal(required.every((testCase) => testCase.evidence.length >= 3), true);

  const none = summarizePaymentBrowserSmokeReadiness([]);
  assert.equal(none.ready, false);
  assert.equal(none.completedCount, 0);
  assert.equal(none.missing.length, required.length);

  const all = summarizePaymentBrowserSmokeReadiness(required.map((testCase) => testCase.id));
  assert.equal(all.ready, true);
  assert.equal(all.completedCount, required.length);
  assert.equal(all.missing.length, 0);

  const partial = summarizePaymentBrowserSmokeReadiness([required[0].id]);
  assert.equal(partial.ready, false);
  assert.equal(partial.completedCount, 1);
  assert.equal(partial.missing.length, required.length - 1);

  const source = readFileSync('lib/checkout/payment-browser-smoke-matrix.ts', 'utf8');
  for (const marker of [
    'provider-handoff-idempotency',
    'return-success-public-order',
    'return-cancel-failure',
    'public-order-privacy',
    'localization-en-fa-payment-copy',
    'account-context-order-history'
  ]) {
    assert.match(source, new RegExp(marker));
  }
  assert.doesNotMatch(source, /fetch\s*\(/);
  assert.doesNotMatch(source, /prisma\./i);
  assert.doesNotMatch(source, /stripe\./i);
  assert.doesNotMatch(source, /zarinpal\./i);

  const docs = readFileSync('docs/payment-browser-smoke-matrix.md', 'utf8');
  for (const marker of [
    'PAYMENT_BROWSER_SMOKE_TESTS_CONFIRMED="true"',
    'Guest cart add/update/remove/clear/subtotal/count behavior.',
    'Provider handoff idempotency',
    'English LTR and Persian RTL payment/checkout/order copy',
    'Do not set this flag based only on unit guards, source guards, documentation guards, or local static route checks.'
  ]) {
    assert.ok(docs.includes(marker), `Expected payment browser smoke docs to include: ${marker}`);
  }

  const evidence = readFileSync('docs/payment-browser-smoke-validation-evidence.md', 'utf8');
  for (const marker of [
    'PAYMENT_BROWSER_SMOKE_TESTS_CONFIRMED="true"',
    '| cart-guest-add-update-remove | Pending |',
    '| provider-handoff-idempotency | Pending |',
    '| localization-en-fa-payment-copy | Pending |',
    'Unit tests, source guards, static route smoke tests, and documentation-only checks do not count as target-environment browser smoke evidence.'
  ]) {
    assert.ok(evidence.includes(marker), `Expected browser smoke evidence template to include: ${marker}`);
  }

  console.log('payment-browser-smoke-matrix.test.ts passed');
}
