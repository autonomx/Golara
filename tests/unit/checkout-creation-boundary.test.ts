import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

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

export async function runCheckoutCreationBoundaryTests() {
  const checkoutActionSource = readFileSync('app/cart/checkout/actions.ts', 'utf8');
  const orderDraftRepositorySource = readFileSync('lib/checkout/order-draft-repository.ts', 'utf8');
  const cartRepositorySource = readFileSync('lib/cart/cart-repository.ts', 'utf8');

  assert.match(
    checkoutActionSource,
    /await assertSameOriginServerAction\(\)/,
    'checkout order creation must retain the same-origin server-action boundary'
  );
  assertOrder(checkoutActionSource, 'await claimCartForCheckout(token)', 'await createOrderDraft({', 'checkout action');
  assertOrder(checkoutActionSource, 'await createOrderDraft({', 'await createCheckoutPaymentAttempt({ orderId: order.id })', 'checkout action');
  assertOrder(checkoutActionSource, 'await createCheckoutPaymentAttempt({ orderId: order.id })', 'await completeCartCheckout(token)', 'checkout action');
  assertOrder(checkoutActionSource, 'await completeCartCheckout(token)', 'await clearCartTokenCookie()', 'checkout action');
  assert.match(
    checkoutActionSource,
    /if \(claimAcquired && !checkoutCompleted\) \{\s*await releaseCartCheckoutClaim\(token\);\s*\}/s,
    'checkout action must release the checkout claim when order/payment creation does not complete'
  );
  assert.doesNotMatch(
    checkoutActionSource,
    /createOrderDraft\(\{[\s\S]*cartToken|createCheckoutPaymentAttempt\(\{[\s\S]*cartToken/,
    'checkout order/payment creation must not pass raw cart tokens into order or payment records'
  );

  assert.match(
    cartRepositorySource,
    /const CHECKOUT_PENDING_STATUS = 'checkout_pending'/,
    'cart repository must keep an explicit checkout-pending status for creation idempotency'
  );
  assert.match(
    cartRepositorySource,
    /prisma\.cartSession\.updateMany\(\{\s*where:\s*\{\s*token:\s*normalized,\s*status:\s*'active',\s*expiresAt:\s*\{ gt: new Date\(\) \}/s,
    'claimCartForCheckout must atomically move only active, unexpired carts into checkout-pending state'
  );
  assert.match(
    cartRepositorySource,
    /if \(claimed\.count !== 1\) return null/,
    'claimCartForCheckout must reject duplicate or already-claimed checkout attempts'
  );
  assert.match(
    cartRepositorySource,
    /findCartByStatus\(normalized, \[CHECKOUT_PENDING_STATUS\]\)/,
    'claimCartForCheckout must return only the claimed checkout-pending cart'
  );
  assert.match(
    cartRepositorySource,
    /findCartByStatus\(normalized, \[CHECKOUT_PENDING_STATUS, 'active'\]\)/,
    'completeCartCheckout must only complete active or checkout-pending cart sessions'
  );
  assert.match(
    cartRepositorySource,
    /status:\s*CHECKED_OUT_STATUS/,
    'completeCartCheckout must mark completed carts as checked out'
  );

  assert.match(orderDraftRepositorySource, /prisma\.\$transaction\(async \(tx\) => \{/, 'order draft creation must remain transactional');
  assert.match(orderDraftRepositorySource, /await reserveOrderInventory\(order\.id, tx\)/, 'order draft creation must reserve inventory inside the transaction');

  console.log('checkout-creation-boundary.test.ts passed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runCheckoutCreationBoundaryTests().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
