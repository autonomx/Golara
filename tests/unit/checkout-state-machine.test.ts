import assert from 'node:assert/strict';
import {
  assertCheckoutFulfillmentStatus,
  assertCheckoutOrderStatus,
  assertCheckoutPaymentStatus,
  canTransitionCheckoutFulfillmentStatus,
  canTransitionCheckoutOrderStatus,
  canTransitionCheckoutPaymentStatus,
  getAllowedCheckoutOrderTransitions,
  isCheckoutFulfillmentStatus,
  isCheckoutOrderStatus,
  isCheckoutPaymentStatus
} from '../../lib/checkout/checkout-state-machine';

export async function runCheckoutStateMachineTests() {
  assert.equal(isCheckoutOrderStatus('draft'), true);
  assert.equal(isCheckoutOrderStatus('bogus'), false);
  assert.equal(isCheckoutPaymentStatus('paid'), true);
  assert.equal(isCheckoutPaymentStatus('authorized'), false);
  assert.equal(isCheckoutFulfillmentStatus('out_for_delivery'), true);
  assert.equal(isCheckoutFulfillmentStatus('shipped'), false);

  assert.equal(assertCheckoutOrderStatus('pending'), 'pending');
  assert.equal(assertCheckoutPaymentStatus('failed'), 'failed');
  assert.equal(assertCheckoutFulfillmentStatus('scheduled'), 'scheduled');
  assert.throws(() => assertCheckoutOrderStatus('unknown'), /Unknown checkout order status/);
  assert.throws(() => assertCheckoutPaymentStatus('unknown'), /Unknown checkout payment status/);
  assert.throws(() => assertCheckoutFulfillmentStatus('unknown'), /Unknown checkout fulfillment status/);

  assert.deepEqual(canTransitionCheckoutOrderStatus('draft', 'pending'), { ok: true });
  assert.deepEqual(canTransitionCheckoutOrderStatus('pending', 'confirmed'), { ok: true });
  assert.deepEqual(canTransitionCheckoutOrderStatus('confirmed', 'completed'), { ok: true });
  assert.deepEqual(canTransitionCheckoutOrderStatus('confirmed', 'pending'), {
    ok: false,
    reason: 'Illegal transition from confirmed to pending.',
    allowedTransitions: ['completed', 'cancelled']
  });
  assert.deepEqual(canTransitionCheckoutOrderStatus('cancelled', 'pending'), {
    ok: false,
    reason: 'Illegal transition from cancelled to pending.',
    allowedTransitions: []
  });
  assert.deepEqual(canTransitionCheckoutOrderStatus('completed', 'completed'), { ok: true });

  assert.deepEqual(canTransitionCheckoutPaymentStatus('created', 'pending'), { ok: true });
  assert.deepEqual(canTransitionCheckoutPaymentStatus('pending', 'paid'), { ok: true });
  assert.deepEqual(canTransitionCheckoutPaymentStatus('paid', 'refunded'), { ok: true });
  assert.deepEqual(canTransitionCheckoutPaymentStatus('refunded', 'paid'), {
    ok: false,
    reason: 'Illegal transition from refunded to paid.',
    allowedTransitions: []
  });
  assert.deepEqual(canTransitionCheckoutPaymentStatus('failed', 'pending'), { ok: true });

  assert.deepEqual(canTransitionCheckoutFulfillmentStatus('not_scheduled', 'scheduled'), { ok: true });
  assert.deepEqual(canTransitionCheckoutFulfillmentStatus('scheduled', 'preparing'), { ok: true });
  assert.deepEqual(canTransitionCheckoutFulfillmentStatus('preparing', 'out_for_delivery'), { ok: true });
  assert.deepEqual(canTransitionCheckoutFulfillmentStatus('out_for_delivery', 'delivered'), { ok: true });
  assert.deepEqual(canTransitionCheckoutFulfillmentStatus('delivered', 'scheduled'), {
    ok: false,
    reason: 'Illegal transition from delivered to scheduled.',
    allowedTransitions: []
  });

  assert.deepEqual(getAllowedCheckoutOrderTransitions('draft'), ['pending', 'cancelled']);

  console.log('checkout-state-machine.test.ts passed');
}
