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

  console.log('public-order-lookup-throttle.test.ts passed');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runPublicOrderLookupThrottleTests().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
