import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const repoRoot = process.cwd();
const source = readFileSync(join(repoRoot, 'lib/cart/cart-repository.ts'), 'utf8');

function indexOfRequired(needle: string) {
  const index = source.indexOf(needle);
  assert.notEqual(index, -1, `Expected cart repository to include ${needle}`);
  return index;
}

function sliceFunction(name: string) {
  const start = indexOfRequired(`export async function ${name}`);
  const nextExport = source.indexOf('\nexport async function ', start + 1);
  return source.slice(start, nextExport === -1 ? source.length : nextExport);
}

assert.match(source, /createHash\('sha256'\)/, 'cart throttle keys must hash cart tokens before storing buckets');
assert.match(source, /CART_MUTATION_THROTTLE_WINDOW_MS\s*=\s*60_000/, 'cart mutation throttle must use a bounded one-minute window');
assert.match(source, /CART_MUTATION_THROTTLE_LIMIT\s*=\s*120/, 'cart mutation throttle must keep a bounded per-window limit');
assert.match(source, /cartMutationThrottleBuckets\s*=\s*new Map/, 'cart mutations must use an explicit throttle bucket map');

const throttleStart = indexOfRequired('function enforceCartMutationThrottle');
const throttleEnd = indexOfRequired('function normalizeLocale');
const throttleFunction = source.slice(throttleStart, throttleEnd);
assert.match(throttleFunction, /throw new Error\('Too many cart updates\. Please wait before trying again\.'\)/, 'cart throttle must reject over-limit mutation bursts');
assert.ok(!throttleFunction.includes('console.'), 'cart throttle must not log raw cart tokens or product identifiers');

const addCartItem = sliceFunction('addCartItem');
const productRequired = addCartItem.indexOf("if (!productId) throw new Error('Product is required.');");
const addThrottle = addCartItem.indexOf('enforceCartMutationThrottle({ token: input.token, fallback: productId });');
const productLookup = addCartItem.indexOf('prisma.product.findFirst');
assert.ok(productRequired !== -1 && addThrottle > productRequired, 'addCartItem must validate product id before throttle fallback selection');
assert.ok(addThrottle !== -1 && addThrottle < productLookup, 'addCartItem must throttle before product lookup or cart creation');

const updateCartItem = sliceFunction('updateCartItem');
const updateThrottle = updateCartItem.indexOf('enforceCartMutationThrottle({ token: input.token, fallback: input.lineKey });');
const activeCartLookup = updateCartItem.indexOf('findActiveCart(input.token)');
assert.ok(updateThrottle !== -1 && updateThrottle < activeCartLookup, 'updateCartItem must throttle before active cart lookup');

const clearCart = sliceFunction('clearCart');
const clearThrottle = clearCart.indexOf("enforceCartMutationThrottle({ token, fallback: 'clear' });");
const clearLookup = clearCart.indexOf('findActiveCart(token)');
assert.ok(clearThrottle !== -1 && clearThrottle < clearLookup, 'clearCart must throttle before active cart lookup');

console.log('cart mutation throttle gate passed');
