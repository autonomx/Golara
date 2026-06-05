import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

function assertNoExecutionSurface(pageSource: string) {
  assert.equal(pageSource.includes('fetch('), false);
  assert.equal(pageSource.includes('@prisma/client'), false);
  assert.equal(pageSource.includes('prisma.'), false);
  assert.equal(pageSource.includes('executePaymentOperationAdapter'), false);
  assert.equal(pageSource.includes('createStripePaymentOperationHttpAdapter'), false);
  assert.equal(pageSource.includes('createZarinPalPaymentOperationHttpAdapter'), false);
  assert.equal(pageSource.includes('https://api.stripe.com'), false);
  assert.equal(pageSource.includes('https://www.zarinpal.com'), false);
  assert.equal(pageSource.includes('onClick='), false);
  assert.equal(pageSource.includes('<button'), false);
  assert.equal(pageSource.includes('CheckoutOrder" SET'), false);
  assert.equal(pageSource.includes('CheckoutPaymentAttempt" SET'), false);
}

export async function runPaymentOperationPhase33CloseoutTests() {
  const closeout = source('docs/production-roadmap-phase33-repo-side-closeout.md');

  assert.ok(closeout.includes('Phase 33 Repo-Side Closeout'));
  assert.ok(closeout.includes('repo-side/read-only foundation complete'));
  assert.ok(closeout.includes('live refund/void execution remains **NO-GO**'));
  assert.ok(closeout.includes('Provider-neutral refund/void operation planning'));
  assert.ok(closeout.includes('Migration-gated repository/service foundations'));
  assert.ok(closeout.includes('Read-only provider readiness diagnostics'));
  assert.ok(closeout.includes('Do not add or enable these behaviors'));
  assert.ok(closeout.includes('Live Stripe/ZarinPal refund or void HTTP calls'));
  assert.ok(closeout.includes('Default live provider endpoint URLs or default fetch behavior'));
  assert.ok(closeout.includes('Admin refund/void execution buttons or click handlers'));
  assert.ok(closeout.includes('Order/payment mutation paths'));
  assert.ok(closeout.includes('Inventory/capacity release execution'));
  assert.ok(closeout.includes('Prisma model/client access for `PaymentOperationRecord`'));
  assert.ok(closeout.includes('Apply and verify the `PaymentOperationRecord` migration'));
  assert.ok(closeout.includes('provider readiness evidence packets'));
  assert.ok(closeout.includes('Phase 34 may start while Phase 33 live execution remains blocked'));
  assert.ok(closeout.includes('Add documentation and source guards before execution controls'));
  assert.ok(closeout.includes('known Vercel quota/build-rate-limit status'));
  assertNoExecutionSurface(closeout);

  console.log('payment-operation-phase33-closeout.test.ts passed');
}
