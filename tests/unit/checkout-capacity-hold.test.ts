import assert from 'node:assert/strict';

const DEFAULT_HOLD_MINUTES = 20;

function normalizeText(value: string | undefined, fallback: string) {
  const normalized = value?.trim();
  return normalized || fallback;
}

function normalizeQuantity(value?: number) {
  if (!value || !Number.isFinite(value)) return 1;
  return Math.max(1, Math.floor(value));
}

function normalizeHoldMinutes(value?: number) {
  if (!value || !Number.isFinite(value)) return DEFAULT_HOLD_MINUTES;
  return Math.min(Math.max(Math.floor(value), 1), 24 * 60);
}

export async function runCheckoutCapacityHoldTests() {
  assert.equal(normalizeText(' morning ', 'default'), 'morning');
  assert.equal(normalizeText('   ', 'default'), 'default');
  assert.equal(normalizeText(undefined, 'delivery'), 'delivery');

  assert.equal(normalizeQuantity(undefined), 1);
  assert.equal(normalizeQuantity(0), 1);
  assert.equal(normalizeQuantity(2.9), 2);
  assert.equal(normalizeQuantity(Number.NaN), 1);

  assert.equal(normalizeHoldMinutes(undefined), 20);
  assert.equal(normalizeHoldMinutes(0), 20);
  assert.equal(normalizeHoldMinutes(1), 1);
  assert.equal(normalizeHoldMinutes(90.5), 90);
  assert.equal(normalizeHoldMinutes(99999), 1440);

  console.log('checkout-capacity-hold.test.ts passed');
}
