import assert from 'node:assert/strict';
import { assertCheckoutPaymentStatus, canTransitionCheckoutPaymentStatus } from '@/lib/checkout/checkout-state-machine';
import { checkoutAttemptStatusForResult } from '@/lib/checkout/payment-result-core';
import type { ServiceLifecycleState } from './service-lifecycle-context';
import { ensureLifecycleShipmentTable } from './payment-fulfillment-fixtures';

export async function runServicePrimaryOrderFlow(state: ServiceLifecycleState) {
  const { prisma, modules, product, variant, secondVariant, multiLineCart } = state;
  assert.ok(product);
  assert.ok(variant);
  assert.ok(secondVariant);
  const { addCustomerAddress, getAdminCustomerDetail, upsertCustomerProfile } = modules.customers;
  const { listCustomerOrdersForSession } = modules.customerAccounts;
  const { createOrderDraft } = modules.orderDrafts;
  const { createCheckoutPaymentAttempt } = modules.paymentProvider;
  const { reserveFulfillmentCapacity } = modules.fulfillmentCapacity;
  const { transitionCheckoutFulfillmentStatus, transitionCheckoutOrderStatus } = modules.checkoutStatus;
  const { createAdminFulfillmentShipment } = modules.fulfillmentShipments;
  const { getAdminCheckoutOrder, listAdminCheckoutOrderPage } = modules.adminOrders;

  const customer = await upsertCustomerProfile({
    phone: '+16045559002',
    displayName: 'E2E Service Customer',
    email: 'service-customer.e2e@golara.test',
    locale: 'fa-IR'
  });
  const address = await addCustomerAddress(customer.id, {
    label: 'E2E service default delivery',
    recipient: 'E2E Service Customer',
    phone: '+16045559002',
    city: 'Vancouver',
    line1: '200 E2E Service Street',
    isDefault: true
  });
  state.customer = customer;
  state.address = address;

  await assert.rejects(
    () =>
      createOrderDraft({
        customerId: customer.id,
        addressId: address.id,
        checkoutMode: 'cart',
        currency: 'TOMAN',
        recipientName: 'E2E Service Customer',
        recipientPhone: '+16045559002',
        items: [{ productId: product.id, variantId: variant.id, quantity: 13 }]
      }),
    /Insufficient inventory/
  );
  const stockAfterRejectedDraft = await prisma.productVariantLocationStock.findFirstOrThrow({ where: { variantId: variant.id } });
  assert.equal(stockAfterRejectedDraft.quantity, 12);
  assert.equal(stockAfterRejectedDraft.reservedQuantity, 0);

  const order = await createOrderDraft({
    customerId: customer.id,
    addressId: address.id,
    checkoutMode: 'cart',
    currency: 'TOMAN',
    deliveryDate: new Date('2026-06-17T18:00:00.000Z'),
    deliveryWindow: '13:00-16:00',
    recipientName: 'E2E Service Customer',
    recipientPhone: '+16045559002',
    customerNote: 'Service-level lifecycle order.',
    items: multiLineCart?.items.map((item: any) => ({ productId: item.productId, variantId: item.variantId ?? undefined, quantity: item.quantity })) ?? []
  });
  assert.equal(order.status, 'draft');
  assert.equal(order.items.length, 2);
  assert.equal(order.totalCents, 325000);
  state.order = order;

  const stockAfterDraft = await prisma.productVariantLocationStock.findFirstOrThrow({ where: { variantId: variant.id } });
  assert.equal(stockAfterDraft.quantity, 12);
  assert.equal(stockAfterDraft.reservedQuantity, 2);
  const secondStockAfterDraft = await prisma.productVariantLocationStock.findFirstOrThrow({ where: { variantId: secondVariant.id } });
  assert.equal(secondStockAfterDraft.quantity, 5);
  assert.equal(secondStockAfterDraft.reservedQuantity, 1);

  const paymentAttempt = await createCheckoutPaymentAttempt({ orderId: order.id, provider: 'manual' });
  assert.equal(paymentAttempt.status, 'manual_pending');
  state.paymentAttempt = paymentAttempt;
  const pendingPaymentOrder = await prisma.checkoutOrder.findUniqueOrThrow({ where: { id: order.id } });
  assert.equal(pendingPaymentOrder.status, 'pending_payment');
  assert.throws(() => assertCheckoutPaymentStatus(paymentAttempt.status), /Unknown checkout payment status/);
  assert.equal(canTransitionCheckoutPaymentStatus('created', 'paid').ok, true);
  assert.equal(checkoutAttemptStatusForResult('paid'), 'verified_paid');

  const bucket = await prisma.fulfillmentCapacityBucket.create({
    data: {
      capacityDate: new Date('2026-06-17T00:00:00.000Z'),
      windowKey: '13:00-16:00',
      fulfillmentType: 'delivery',
      capacity: 1,
      metadata: { lifecycle: true, service: true }
    }
  });
  await reserveFulfillmentCapacity({ bucketId: bucket.id, orderId: order.id, quantity: 1, metadata: { lifecycle: true, service: true } });
  await assert.rejects(
    () => reserveFulfillmentCapacity({ bucketId: bucket.id, orderId: order.id, quantity: 1, metadata: { lifecycle: true, service: true, duplicate: true } }),
    /Insufficient fulfillment capacity/
  );

  await prisma.checkoutOrder.update({ where: { id: order.id }, data: { status: 'pending' } });
  await transitionCheckoutOrderStatus({ orderId: order.id, to: 'confirmed', actorLabel: 'Lifecycle E2E', actorRole: 'system', note: 'Confirm service-level lifecycle order.' });
  await transitionCheckoutFulfillmentStatus({ orderId: order.id, to: 'scheduled', actorLabel: 'Lifecycle E2E', actorRole: 'system', note: 'Schedule service-level lifecycle fulfillment.' });

  const stockAfterConfirm = await prisma.productVariantLocationStock.findFirstOrThrow({ where: { variantId: variant.id } });
  assert.equal(stockAfterConfirm.quantity, 10);
  assert.equal(stockAfterConfirm.reservedQuantity, 0);
  const secondStockAfterConfirm = await prisma.productVariantLocationStock.findFirstOrThrow({ where: { variantId: secondVariant.id } });
  assert.equal(secondStockAfterConfirm.quantity, 4);
  assert.equal(secondStockAfterConfirm.reservedQuantity, 0);

  await ensureLifecycleShipmentTable(prisma);
  const shipmentResult = await createAdminFulfillmentShipment(order.id, {
    status: 'scheduled',
    fulfillmentType: 'delivery',
    carrierName: 'E2E Service Courier',
    trackingNumber: 'E2E-SERVICE-TRACK-1001',
    deliveryWindow: '13:00-16:00',
    recipientName: 'E2E Service Customer',
    recipientPhone: '+16045559002',
    addressSummary: '200 E2E Service Street',
    note: 'Service-level shipment created.',
    actorLabel: 'Lifecycle E2E',
    actorRole: 'system'
  });
  assert.equal(shipmentResult.shipment?.status, 'scheduled');
  assert.equal(shipmentResult.shipment?.trackingNumber, 'E2E-SERVICE-TRACK-1001');

  const confirmedOrder = await prisma.checkoutOrder.findUniqueOrThrow({
    where: { id: order.id },
    include: { capacityReservation: true, timelineEvents: true, items: { include: { stockReservations: true } }, paymentAttempts: true }
  });
  assert.equal(confirmedOrder.status, 'confirmed');
  assert.equal(confirmedOrder.fulfillmentStatus, 'scheduled');
  assert.equal(confirmedOrder.capacityReservation?.status, 'confirmed');
  assert.equal(confirmedOrder.items[0]?.stockReservations[0]?.status, 'committed');
  assert.equal(confirmedOrder.paymentAttempts.some((attempt) => attempt.status === 'manual_pending'), true);
  for (const eventType of ['order_status_changed', 'fulfillment_status_changed', 'fulfillment_shipment_created']) {
    assert.equal(confirmedOrder.timelineEvents.some((event) => event.type === eventType), true);
  }

  const adminPage = await listAdminCheckoutOrderPage({ search: confirmedOrder.orderNumber }, 1, 5);
  assert.equal(adminPage.totalCount, 1);
  assert.equal(adminPage.orders[0]?.latestPaymentStatus, 'manual_pending');
  const adminOrder = await getAdminCheckoutOrder(order.id);
  assert.equal(adminOrder?.id, order.id);
  assert.equal(adminOrder?.activityTimeline.length > 0, true);
  const customerDetail = await getAdminCustomerDetail(customer.id, { revealSensitive: true });
  assert.equal(customerDetail?.orders.some((item) => item.id === order.id), true);
  const customerOrders = await listCustomerOrdersForSession({ customerId: customer.id });
  assert.equal(customerOrders.some((item) => item.id === order.id), true);
}
