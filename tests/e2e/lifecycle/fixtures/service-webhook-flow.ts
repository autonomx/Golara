import assert from 'node:assert/strict';
import type { ServiceLifecycleState } from './service-lifecycle-context';
import { ensureLifecycleSettlementReconciliationTable } from './payment-fulfillment-fixtures';

export async function runServiceWebhookFlow(state: ServiceLifecycleState) {
  const { prisma, modules } = state;
  const { handlePaymentWebhookRoute } = modules.webhookRoute;
  const { recordPaymentWebhookEvent } = modules.webhookService;

  await ensureLifecycleSettlementReconciliationTable(prisma);
  const rawTablePresence = await prisma.$queryRaw<[{ settlement: string | null; shipment: string | null }]>`
    SELECT
      to_regclass('"PaymentSettlementReconciliation"')::text AS settlement,
      to_regclass('"CheckoutFulfillmentShipment"')::text AS shipment
  `;
  assert.equal(rawTablePresence[0]?.settlement, '"PaymentSettlementReconciliation"');
  assert.equal(rawTablePresence[0]?.shipment, '"CheckoutFulfillmentShipment"');

  const webhookOrder = await prisma.checkoutOrder.create({
    data: {
      orderNumber: 'E2E-WEBHOOK-1001',
      publicLookupToken: 'e2e-webhook-token-1001',
      status: 'pending_payment',
      checkoutMode: 'gateway',
      currency: 'TOMAN',
      subtotalCents: 125000,
      totalCents: 125000
    }
  });
  const webhookAttempt = await prisma.checkoutPaymentAttempt.create({
    data: {
      orderId: webhookOrder.id,
      provider: 'stripe',
      status: 'created',
      amountCents: 125000,
      currency: 'TOMAN',
      providerReference: 'cs_e2e_webhook_1001'
    }
  });

  const invalidRouteResult = await handlePaymentWebhookRoute({
    provider: 'stripe',
    payload: null,
    record: async () => {
      throw new Error('record should not be called for invalid payload');
    }
  });
  assert.equal(invalidRouteResult.statusCode, 400);

  const paidPayload = {
    id: 'evt_e2e_paid_1001',
    type: 'checkout.session.completed',
    data: {
      object: {
        id: 'cs_e2e_webhook_1001',
        payment_status: 'paid',
        amount_total: 125000,
        currency: 'toman',
        metadata: {
          orderNumber: webhookOrder.orderNumber,
          publicLookupToken: webhookOrder.publicLookupToken
        }
      }
    }
  };
  const paidWebhook = await handlePaymentWebhookRoute({ provider: 'stripe', payload: paidPayload, record: recordPaymentWebhookEvent });
  assert.equal(paidWebhook.statusCode, 200);
  assert.equal(paidWebhook.body.status, 'recorded');
  const duplicateWebhook = await handlePaymentWebhookRoute({ provider: 'stripe', payload: paidPayload, record: recordPaymentWebhookEvent });
  assert.equal(duplicateWebhook.body.status, 'duplicate');
  const webhookEventsAfterDuplicate = await prisma.checkoutPaymentEvent.findMany({ where: { paymentAttemptId: webhookAttempt.id } });
  assert.equal(webhookEventsAfterDuplicate.length, 1);
  const verifiedAttempt = await prisma.checkoutPaymentAttempt.findUniqueOrThrow({ where: { id: webhookAttempt.id } });
  const paidWebhookOrder = await prisma.checkoutOrder.findUniqueOrThrow({ where: { id: webhookOrder.id } });
  assert.equal(verifiedAttempt.status, 'verified_paid');
  assert.equal(paidWebhookOrder.status, 'paid');

  const failedWebhook = await handlePaymentWebhookRoute({
    provider: 'stripe',
    payload: {
      id: 'evt_e2e_failed_1001',
      type: 'payment_intent.payment_failed',
      data: {
        object: {
          id: 'cs_e2e_webhook_1001',
          status: 'failed',
          metadata: { orderNumber: webhookOrder.orderNumber }
        }
      }
    },
    record: recordPaymentWebhookEvent
  });
  assert.equal(failedWebhook.body.status, 'needs_attention');
  assert.equal((await prisma.checkoutPaymentAttempt.findUniqueOrThrow({ where: { id: webhookAttempt.id } })).status, 'verified_paid');
}
