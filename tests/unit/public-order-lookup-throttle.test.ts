import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

export async function runPublicOrderLookupThrottleTests() {
  const source = readFileSync('lib/checkout/public-order-repository.ts', 'utf8');
  const getOrderIndex = source.indexOf('export async function getPublicOrderByToken');
  assert.notEqual(getOrderIndex, -1, 'public order lookup function must exist');
  const lookupSource = source.slice(getOrderIndex);
  const throttleIndex = lookupSource.indexOf('allowPublicOrderLookupAttempt(normalized)');
  const prismaIndex = lookupSource.indexOf('prisma.checkoutOrder.findUnique');

  assert.ok(source.includes('PUBLIC_ORDER_LOOKUP_WINDOW_MS'), 'public order lookup must define a throttle window');
  assert.ok(source.includes('PUBLIC_ORDER_LOOKUP_MAX_ATTEMPTS'), 'public order lookup must define an attempt limit');
  assert.ok(source.includes('publicOrderLookupThrottleKey'), 'public order lookup must hash throttle keys');
  assert.ok(source.includes("createHash('sha256')"), 'public order lookup throttle keys must use a one-way hash');
  assert.ok(throttleIndex >= 0, 'public order lookup must check the throttle before querying');
  assert.ok(prismaIndex >= 0, 'public order lookup must query orders after safety checks');
  assert.ok(throttleIndex < prismaIndex, 'public order lookup throttle must run before prisma lookup');
  assert.doesNotMatch(source, /console\.(?:warn|error|log)\([^)]*token/i, 'public order lookup must not log raw lookup tokens');
  assert.doesNotMatch(source, /new Map<string, PublicOrderLookupBucket>\(\[\]/, 'public order lookup throttle must not seed raw token buckets');

  const cartSource = readFileSync('lib/cart/cart-repository.ts', 'utf8');
  assert.ok(cartSource.includes('CART_MUTATION_THROTTLE_WINDOW_MS'), 'cart mutations must define a throttle window');
  assert.ok(cartSource.includes('CART_MUTATION_THROTTLE_LIMIT'), 'cart mutations must define an attempt limit');
  assert.ok(cartSource.includes('function enforceCartMutationThrottle'), 'cart mutations must use an explicit throttle boundary');
  assert.ok(cartSource.includes("createHash('sha256')"), 'cart throttle keys must hash cart tokens before storing buckets');
  assert.doesNotMatch(cartSource, /console\.(?:warn|error|log)\([^)]*(?:token|productId|lineKey)/i, 'cart throttle must not log raw cart tokens or item identifiers');

  const addCartItem = cartSource.slice(cartSource.indexOf('export async function addCartItem'));
  const addThrottle = addCartItem.indexOf('enforceCartMutationThrottle({ token: input.token, fallback: productId });');
  const productLookup = addCartItem.indexOf('prisma.product.findFirst');
  assert.ok(addThrottle >= 0 && productLookup >= 0 && addThrottle < productLookup, 'addCartItem must throttle before product lookup or cart creation');

  const updateCartItem = cartSource.slice(cartSource.indexOf('export async function updateCartItem'));
  const updateThrottle = updateCartItem.indexOf('enforceCartMutationThrottle({ token: input.token, fallback: input.lineKey });');
  const activeCartLookup = updateCartItem.indexOf('findActiveCart(input.token)');
  assert.ok(updateThrottle >= 0 && activeCartLookup >= 0 && updateThrottle < activeCartLookup, 'updateCartItem must throttle before active cart lookup');

  const clearCart = cartSource.slice(cartSource.indexOf('export async function clearCart'));
  const clearThrottle = clearCart.indexOf("enforceCartMutationThrottle({ token, fallback: 'clear' });");
  const clearLookup = clearCart.indexOf('findActiveCart(token)');
  assert.ok(clearThrottle >= 0 && clearLookup >= 0 && clearThrottle < clearLookup, 'clearCart must throttle before active cart lookup');

  const expireOldCarts = cartSource.slice(cartSource.indexOf('export async function expireOldCarts'));
  assert.ok(cartSource.includes('CART_EXPIRY_CLEANUP_BATCH_LIMIT'), 'abandoned cart cleanup must define a bounded batch limit');
  assert.ok(expireOldCarts.includes("status: 'expired'"), 'abandoned cart cleanup must only prune expired carts');
  assert.ok(expireOldCarts.includes('take: CART_EXPIRY_CLEANUP_BATCH_LIMIT'), 'abandoned cart cleanup must bound expired cart batch size');
  assert.ok(expireOldCarts.includes('select: { id: true }'), 'abandoned cart cleanup must only select expired cart IDs');
  assert.ok(expireOldCarts.includes('prisma.cartItem.deleteMany'), 'abandoned cart cleanup must prune expired cart items');
  assert.ok(expireOldCarts.includes('cartId: { in: expiredCartIds }'), 'abandoned cart cleanup must delete only items for the bounded expired cart batch');
  assert.doesNotMatch(expireOldCarts, /deleteMany\(\{\s*where:\s*\{\s*\}\s*\}\)/, 'abandoned cart cleanup must never run an unbounded deleteMany');

  console.log('public-order-lookup-throttle.test.ts passed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runPublicOrderLookupThrottleTests().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
