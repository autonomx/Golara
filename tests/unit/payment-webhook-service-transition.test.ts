import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runPaymentWebhookServiceTransitionTests() {
  const service = source('lib/checkout/payment-webhook-service.ts');
  const planner = source('lib/checkout/payment-webhook-transition-plan.ts');
  const schema = source('prisma/schema.prisma');

  assert.match(schema, /model CheckoutOrder/);
  assert.match(schema, /model CheckoutPaymentAttempt/);
  assert.match(schema, /model CheckoutPaymentEvent/);
  assert.match(schema, /model CheckoutOrderTimelineEvent/);

  assert.match(planner, /export function planPaymentWebhookStateChange/);
  assert.match(planner, /planCheckoutResultTransition/);

  assert.match(service, /planPaymentWebhookStateChange/);
  assert.match(service, /statePlan\?: PaymentWebhookStatePlan/);
  assert.match(service, /timelineEvents: \{/);
  assert.match(service, /where: \{ type: 'payment_result' \}/);
  assert.match(service, /async function applyTrustedWebhookStateChange/);
  assert.match(service, /if \(!input\.statePlan\.trusted\) return/);
  assert.match(service, /function shouldApplyWebhookStateChange/);
  assert.match(service, /checkoutPaymentEvent\.create/);
  assert.match(service, /checkoutPaymentEvent\.update/);
  assert.match(service, /checkoutPaymentAttempt\.update/);
  assert.match(service, /checkoutOrder\.update/);
  assert.match(service, /timelineEvents: \{/);
  assert.match(service, /webhookStateTrusted/);
  assert.match(service, /webhookStateReason/);
  assert.match(service, /webhookNextOrderStatus/);
  assert.match(service, /webhookNextAttemptStatus/);
  assert.match(service, /webhookSettlementStatus/);
  assert.match(service, /processedAt: new Date\(\)/);
  assert.match(service, /status: 'duplicate'/);
  assert.match(service, /missingPaymentAttempt: true/);

  const createIndex = service.indexOf('checkoutPaymentEvent.create');
  const reconcileIndex = service.indexOf('paymentSettlementRepository.upsertForPaymentEvent(created.id)');
  const applyIndex = service.indexOf('await applyTrustedWebhookStateChange');
  assert.ok(createIndex > -1);
  assert.ok(reconcileIndex > createIndex);
  assert.ok(applyIndex > reconcileIndex);

  console.log('payment-webhook-service-transition.test.ts passed');
}
