import assert from 'node:assert/strict';
import type { ServiceLifecycleState } from './service-lifecycle-context';

export async function runServiceCancellationRefundAdminFlow(state: ServiceLifecycleState) {
  const { prisma, modules, customer, address, product, variant } = state;
  assert.ok(customer);
  assert.ok(address);
  assert.ok(product);
  assert.ok(variant);
  const { addCustomerAddress, upsertCustomerProfile } = modules.customers;
  const { createOrderDraft } = modules.orderDrafts;
  const { markOrderManualPayment } = modules.manualPayments;
  const { reserveFulfillmentCapacity } = modules.fulfillmentCapacity;
  const { transitionCheckoutOrderStatus, transitionCheckoutPaymentStatus } = modules.checkoutStatus;
  const { assignAdminOrderCustomer } = modules.orderAssignments;
  const { updateAdminOrderLineItemQuantity } = modules.orderLines;
  const { getAdminCheckoutOrder, listAdminCheckoutOrderPage } = modules.adminOrders;

  const cancellationOrder = await createOrderDraft({
    customerId: customer.id,
    addressId: address.id,
    checkoutMode: 'cart',
    currency: 'TOMAN',
    recipientName: 'E2E Service Customer',
    recipientPhone: '+16045559002',
    items: [{ productId: product.id, variantId: variant.id, quantity: 1 }]
  });
  const cancellationBucket = await prisma.fulfillmentCapacityBucket.create({
    data: {
      capacityDate: new Date('2026-06-18T00:00:00.000Z'),
      windowKey: '09:00-11:00',
      fulfillmentType: 'delivery',
      capacity: 2,
      metadata: { lifecycle: true, cancellation: true }
    }
  });
  await reserveFulfillmentCapacity({ bucketId: cancellationBucket.id, orderId: cancellationOrder.id, quantity: 1, metadata: { lifecycle: true, cancellation: true } });
  await transitionCheckoutOrderStatus({ orderId: cancellationOrder.id, to: 'cancelled', actorLabel: 'Lifecycle E2E', actorRole: 'system', note: 'Cancel service-level lifecycle order.' });
  const cancelledOrder = await prisma.checkoutOrder.findUniqueOrThrow({
    where: { id: cancellationOrder.id },
    include: { capacityReservation: true, items: { include: { stockReservations: true } } }
  });
  assert.equal(cancelledOrder.status, 'cancelled');
  assert.equal(cancelledOrder.capacityReservation?.status, 'released');
  assert.equal(cancelledOrder.items[0]?.stockReservations[0]?.status, 'released');
  const stockAfterCancellation = await prisma.productVariantLocationStock.findFirstOrThrow({ where: { variantId: variant.id } });
  assert.equal(stockAfterCancellation.quantity, 10);
  assert.equal(stockAfterCancellation.reservedQuantity, 0);
  const cancelledReadPage = await listAdminCheckoutOrderPage({ status: 'cancelled' }, 1, 10);
  assert.equal(cancelledReadPage.orders.some((item) => item.id === cancellationOrder.id), true);

  const refundOrder = await createOrderDraft({
    customerId: customer.id,
    addressId: address.id,
    checkoutMode: 'cart',
    currency: 'TOMAN',
    recipientName: 'E2E Service Customer',
    recipientPhone: '+16045559002',
    items: [{ productId: product.id, variantId: variant.id, quantity: 1 }]
  });
  const refundBucket = await prisma.fulfillmentCapacityBucket.create({
    data: {
      capacityDate: new Date('2026-06-19T00:00:00.000Z'),
      windowKey: '11:00-13:00',
      fulfillmentType: 'delivery',
      capacity: 2,
      metadata: { lifecycle: true, refund: true }
    }
  });
  await reserveFulfillmentCapacity({ bucketId: refundBucket.id, orderId: refundOrder.id, quantity: 1, metadata: { lifecycle: true, refund: true } });
  const paidAttempt = await markOrderManualPayment(refundOrder.id, {
    providerReference: 'E2E-REFUND-PAID-1001',
    note: 'Lifecycle refund setup.',
    actorLabel: 'Lifecycle E2E',
    actorRole: 'system'
  });
  await transitionCheckoutPaymentStatus({ paymentAttemptId: paidAttempt.id, to: 'refunded', actorLabel: 'Lifecycle E2E', actorRole: 'system', note: 'Lifecycle refund simulation.' });
  const refundedAttempt = await prisma.checkoutPaymentAttempt.findUniqueOrThrow({ where: { id: paidAttempt.id } });
  const refundedOrder = await prisma.checkoutOrder.findUniqueOrThrow({
    where: { id: refundOrder.id },
    include: { capacityReservation: true, items: { include: { stockReservations: true } } }
  });
  assert.equal(refundedAttempt.status, 'refunded');
  assert.equal(refundedOrder.capacityReservation?.status, 'released');
  assert.equal(refundedOrder.items[0]?.stockReservations[0]?.status, 'committed');
  const stockAfterRefund = await prisma.productVariantLocationStock.findFirstOrThrow({ where: { variantId: variant.id } });
  assert.equal(stockAfterRefund.quantity, 9);
  assert.equal(stockAfterRefund.reservedQuantity, 0);
  const refundReadOrder = await getAdminCheckoutOrder(refundOrder.id);
  assert.equal(refundReadOrder?.paymentAttempts.some((attempt) => attempt.status === 'refunded'), true);

  const editableOrder = await createOrderDraft({
    customerId: customer.id,
    addressId: address.id,
    checkoutMode: 'cart',
    currency: 'TOMAN',
    recipientName: 'E2E Service Customer',
    recipientPhone: '+16045559002',
    items: [{ productId: product.id, variantId: variant.id, quantity: 1 }]
  });
  const alternateCustomer = await upsertCustomerProfile({ phone: '+16045559003', displayName: 'E2E Alternate Customer', email: 'alternate.e2e@golara.test', locale: 'fa-IR' });
  const alternateAddress = await addCustomerAddress(alternateCustomer.id, {
    label: 'E2E alternate delivery',
    recipient: 'E2E Alternate Customer',
    phone: '+16045559003',
    city: 'Vancouver',
    line1: '300 E2E Alternate Street',
    isDefault: true
  });
  await assignAdminOrderCustomer(editableOrder.id, { customerId: alternateCustomer.id, addressId: alternateAddress.id, actorLabel: 'Lifecycle E2E', actorRole: 'system' });
  await assert.rejects(
    () => assignAdminOrderCustomer(editableOrder.id, { customerId: alternateCustomer.id, addressId: address.id, actorLabel: 'Lifecycle E2E', actorRole: 'system' }),
    /Address does not belong/
  );
  const editableItem = await prisma.checkoutOrderItem.findFirstOrThrow({ where: { orderId: editableOrder.id } });
  await updateAdminOrderLineItemQuantity(editableOrder.id, editableItem.id, { quantity: 2, actorLabel: 'Lifecycle E2E', actorRole: 'system' });
  await prisma.checkoutOrder.update({ where: { id: editableOrder.id }, data: { status: 'confirmed' } });
  await assert.rejects(
    () => updateAdminOrderLineItemQuantity(editableOrder.id, editableItem.id, { quantity: 1, actorLabel: 'Lifecycle E2E', actorRole: 'system' }),
    /before confirmation/
  );
  await prisma.adminAuditLog.createMany({
    data: [
      auditRow(editableOrder.id, 'order.customer.assign', 'Lifecycle customer assignment audit.'),
      auditRow(editableOrder.id, 'order.line_item.update', 'Lifecycle line item update audit.')
    ]
  });
  const editedOrder = await prisma.checkoutOrder.findUniqueOrThrow({
    where: { id: editableOrder.id },
    include: { items: { include: { stockReservations: true } }, timelineEvents: true }
  });
  assert.equal(editedOrder.customerId, alternateCustomer.id);
  assert.equal(editedOrder.addressId, alternateAddress.id);
  assert.equal(editedOrder.items[0]?.quantity, 2);
  assert.equal(editedOrder.totalCents, 250000);
  assert.equal(editedOrder.items[0]?.stockReservations.some((reservation) => reservation.status === 'held' && reservation.quantity === 2), true);
  assert.equal(editedOrder.timelineEvents.some((event) => event.type === 'order_customer_assigned'), true);
  assert.equal(editedOrder.timelineEvents.some((event) => event.type === 'order_line_item_updated'), true);
  const adminAuditActions = await prisma.adminAuditLog.findMany({ where: { entity: 'checkoutOrder', entityId: editableOrder.id }, select: { action: true } });
  assert.equal(adminAuditActions.some((log) => log.action === 'order.customer.assign'), true);
  assert.equal(adminAuditActions.some((log) => log.action === 'order.line_item.update'), true);
}

function auditRow(entityId: string, action: string, summary: string) {
  return {
    action,
    entity: 'checkoutOrder',
    entityId,
    summary,
    actorType: 'system',
    actorLabel: 'Lifecycle E2E',
    actorRole: 'system',
    actorProvider: 'e2e',
    metadata: { lifecycle: true }
  };
}
