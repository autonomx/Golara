import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const checkoutActionSource = readFileSync('app/cart/checkout/actions.ts', 'utf8');
const walletCaptureSource = readFileSync('lib/checkout/customer-wallet-checkout-capture.ts', 'utf8');

function indexOfRequired(source: string, marker: string, context: string) {
  const index = source.indexOf(marker);
  assert.notEqual(index, -1, `${context} must contain ${marker}`);
  return index;
}

function assertOrder(source: string, earlier: string, later: string, context: string) {
  const earlierIndex = indexOfRequired(source, earlier, context);
  const laterIndex = indexOfRequired(source, later, context);
  assert.ok(earlierIndex < laterIndex, `${context} must call ${earlier} before ${later}`);
}

assert.match(checkoutActionSource, /import \{ captureCustomerWalletCheckoutPayment \} from '@\/lib\/checkout\/customer-wallet-checkout-capture';/, 'checkout action must import the wallet capture service');
assert.match(checkoutActionSource, /if \(paymentMethodSelection\.selection\.methodType === 'wallet'\) \{\s*await captureCustomerWalletCheckoutPayment\(\{/s, 'checkout action must only capture wallet funds for wallet methods');
assert.match(checkoutActionSource, /paymentAttemptId: attempt\.id,/, 'wallet checkout capture must be tied to the created payment attempt');
assert.match(checkoutActionSource, /paymentAttemptForRedirect = \{ \.\.\.attempt, status: 'paid' \};/, 'wallet checkout should redirect using a paid payment-attempt status after capture');
assertOrder(checkoutActionSource, 'const attempt = await createCheckoutPaymentAttempt({', 'await captureCustomerWalletCheckoutPayment({', 'checkout wallet flow');
assertOrder(checkoutActionSource, 'await captureCustomerWalletCheckoutPayment({', 'await completeCartCheckout(token)', 'checkout wallet flow');
assertOrder(checkoutActionSource, 'await completeCartCheckout(token)', 'redirectTarget = checkoutActionNextPath(order, paymentAttemptForRedirect)', 'checkout wallet flow');

for (const marker of [
  'FOR UPDATE',
  'wallet:checkout_reservation:',
  'wallet:checkout_capture:',
  'checkout_reservation',
  'checkout_capture',
  "if (wallet.availableBalanceCents < attempt.amountCents) throw new Error('Wallet balance is insufficient for checkout capture.');",
  "status: 'paid'",
  'providerReference: `wallet:${captureEntry.id}`',
  'walletReservationEntryId: reservationEntry.id',
  'walletCaptureEntryId: captureEntry.id',
  'confirmOrderFulfillmentCapacityReservation(result.orderId)',
  'commitOrderInventoryReservations(result.orderId)'
]) {
  assert.ok(walletCaptureSource.includes(marker), `wallet checkout capture service must include ${marker}`);
}

assert.match(walletCaptureSource, /function isWalletPaymentMetadata\(metadata: Prisma\.JsonObject\) \{\s*return metadataText\(metadata\.paymentMethodType\) === 'wallet' \|\| metadataText\(metadata\.paymentMethodKey\) === 'wallet-credit';\s*\}/s, 'wallet capture must reject non-wallet payment attempts');
assert.match(walletCaptureSource, /SELECT \* FROM "CustomerWalletBalance"[\s\S]*FOR UPDATE/s, 'wallet capture must lock the balance row before debiting to prevent double-spend');
assert.match(walletCaptureSource, /WHERE "idempotencyKey" = \$\{captureIdempotencyKey\}/, 'wallet capture must check the capture idempotency key before debiting');

console.log('wallet-checkout-capture-source.test.ts passed');
