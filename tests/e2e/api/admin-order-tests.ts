import assert from 'node:assert/strict';
import {
  appendServerActionFields,
  assertRedirect,
  createAdminCookieJar,
  request,
  responseText,
  submitServerAction,
  type ApiFixture
} from './shared';

export async function runAdminOrderOperationsActionTests(fixture: ApiFixture) {
  const adminJar = createAdminCookieJar();
  const editableOrder = await fixture.prisma.checkoutOrder.create({
    data: {
      orderNumber: 'API-E2E-ADMIN-EDIT-1001',
      publicLookupToken: 'api-e2e-admin-edit-token',
      status: 'draft',
      checkoutMode: 'staff',
      currency: 'TOMAN',
      recipientName: 'API Admin Draft Recipient',
      recipientPhone: '+16045559200',
      paymentAttempts: {
        create: {
          provider: 'manual',
          status: 'created',
          amountCents: 0,
          currency: 'TOMAN',
          providerReference: 'api-e2e-voidable-manual'
        }
      }
    }
  });
  const detailPath = `/admin/orders/${editableOrder.id}`;
  const lineOption = `${fixture.productId}::${fixture.variantId}`;

  const addLineHtml = await responseText(await request(detailPath, { headers: { cookie: adminJar.header() } }));
  const addLineForm = new FormData();
  appendServerActionFields(addLineForm, addLineHtml, 'name="lineOption"');
  addLineForm.set('lineOption', lineOption);
  addLineForm.set('quantity', '2');
  const addLineResponse = await submitServerAction(detailPath, addLineForm, adminJar);
  assertRedirect(addLineResponse, `${detailPath}?status=order-line-added`);

  let lineItem = await fixture.prisma.checkoutOrderItem.findFirstOrThrow({
    where: { orderId: editableOrder.id, productId: fixture.productId, variantId: fixture.variantId }
  });
  assert.equal(lineItem.quantity, 2);
  assert.equal(lineItem.lineTotalCents, 250000);
  assert.equal(await fixture.prisma.inventoryStockReservation.count({ where: { orderItemId: lineItem.id, status: 'held' } }), 1);

  const updateLineHtml = await responseText(await request(detailPath, { headers: { cookie: adminJar.header() } }));
  const updateLineForm = new FormData();
  appendServerActionFields(updateLineForm, updateLineHtml, `value="${lineItem.quantity}"`);
  updateLineForm.set('quantity', '3');
  const updateLineResponse = await submitServerAction(detailPath, updateLineForm, adminJar);
  assertRedirect(updateLineResponse, `${detailPath}?status=order-line-updated`);

  lineItem = await fixture.prisma.checkoutOrderItem.findUniqueOrThrow({ where: { id: lineItem.id } });
  assert.equal(lineItem.quantity, 3);
  assert.equal(lineItem.lineTotalCents, 375000);
  assert.equal(await fixture.prisma.inventoryStockReservation.count({ where: { orderItemId: lineItem.id, status: 'held' } }), 1);

  const lowerBoundHtml = await responseText(await request(detailPath, { headers: { cookie: adminJar.header() } }));
  const lowerBoundForm = new FormData();
  appendServerActionFields(lowerBoundForm, lowerBoundHtml, `value="${lineItem.quantity}"`);
  lowerBoundForm.set('quantity', '0');
  const lowerBoundResponse = await submitServerAction(detailPath, lowerBoundForm, adminJar);
  assertRedirect(lowerBoundResponse, `${detailPath}?status=order-line-updated`);

  lineItem = await fixture.prisma.checkoutOrderItem.findUniqueOrThrow({ where: { id: lineItem.id } });
  assert.equal(lineItem.quantity, 1);
  assert.equal(lineItem.lineTotalCents, 125000);
  assert.equal(await fixture.prisma.inventoryStockReservation.count({ where: { orderItemId: lineItem.id, status: 'held' } }), 1);

  const discountHtml = await responseText(await request(detailPath, { headers: { cookie: adminJar.header() } }));
  const discountForm = new FormData();
  appendServerActionFields(discountForm, discountHtml, 'name="discountCents"');
  discountForm.set('discountCents', '25000');
  discountForm.set('discountNote', 'API E2E admin discount');
  const discountResponse = await submitServerAction(detailPath, discountForm, adminJar);
  assertRedirect(discountResponse, `${detailPath}?status=order-discount-updated`);

  let order = await fixture.prisma.checkoutOrder.findUniqueOrThrow({ where: { id: editableOrder.id } });
  assert.equal(order.subtotalCents, 125000);
  assert.equal(order.discountCents, 25000);
  assert.equal(order.totalCents, 100000);

  const clampedDiscountHtml = await responseText(await request(detailPath, { headers: { cookie: adminJar.header() } }));
  const clampedDiscountForm = new FormData();
  appendServerActionFields(clampedDiscountForm, clampedDiscountHtml, 'name="discountCents"');
  clampedDiscountForm.set('discountCents', '9999999');
  clampedDiscountForm.set('discountNote', 'API E2E admin discount clamp');
  const clampedDiscountResponse = await submitServerAction(detailPath, clampedDiscountForm, adminJar);
  assertRedirect(clampedDiscountResponse, `${detailPath}?status=order-discount-updated`);

  order = await fixture.prisma.checkoutOrder.findUniqueOrThrow({ where: { id: editableOrder.id } });
  assert.equal(order.discountCents, 125000);
  assert.equal(order.totalCents, 0);

  const noteHtml = await responseText(await request(detailPath, { headers: { cookie: adminJar.header() } }));
  const noteForm = new FormData();
  appendServerActionFields(noteForm, noteHtml, 'name="note"');
  noteForm.set('note', 'API E2E staff timeline note');
  const noteResponse = await submitServerAction(detailPath, noteForm, adminJar);
  assertRedirect(noteResponse, `${detailPath}?status=order-note-added`);

  assert.equal(await fixture.prisma.checkoutOrderTimelineEvent.count({
    where: { orderId: editableOrder.id, type: 'staff_note', note: 'API E2E staff timeline note' }
  }), 1);

  const fulfillmentHtml = await responseText(await request(detailPath, { headers: { cookie: adminJar.header() } }));
  const fulfillmentForm = new FormData();
  appendServerActionFields(fulfillmentForm, fulfillmentHtml, 'name="fulfillmentStatus"');
  fulfillmentForm.set('fulfillmentStatus', 'scheduled');
  fulfillmentForm.set('courierName', 'API Courier');
  fulfillmentForm.set('courierPhone', '+16045559299');
  fulfillmentForm.set('fulfillmentNote', 'API E2E fulfillment note');
  const fulfillmentResponse = await submitServerAction(detailPath, fulfillmentForm, adminJar);
  assertRedirect(fulfillmentResponse, `${detailPath}?status=fulfillment-updated`);

  order = await fixture.prisma.checkoutOrder.findUniqueOrThrow({ where: { id: editableOrder.id } });
  assert.equal(order.fulfillmentStatus, 'scheduled');
  assert.equal(order.courierName, 'API Courier');
  assert.equal(order.fulfillmentNote, 'API E2E fulfillment note');

  const customer = await fixture.prisma.customerProfile.create({
    data: {
      phone: '+16045559222',
      displayName: 'API E2E Assigned Customer',
      email: 'api-assigned-customer.e2e@golara.test',
      locale: 'fa-IR',
      accounts: {
        create: {
          provider: 'phone',
          providerAccountId: '+16045559222',
          phone: '+16045559222',
          email: 'api-assigned-customer.e2e@golara.test',
          phoneVerifiedAt: new Date('2026-06-01T12:00:00.000Z'),
          metadata: { apiE2e: true }
        }
      },
      addresses: {
        create: {
          label: 'API E2E assigned delivery',
          recipient: 'API E2E Assigned Customer',
          phone: '+16045559222',
          city: 'Vancouver',
          line1: '789 API Assignment Avenue',
          line2: 'Suite 22',
          notes: 'Assigned through admin order API E2E.',
          isDefault: true
        }
      }
    },
    include: { addresses: true }
  });
  const assignmentHtml = await responseText(await request(detailPath, { headers: { cookie: adminJar.header() } }));
  const assignmentForm = new FormData();
  appendServerActionFields(assignmentForm, assignmentHtml, 'name="customerId"');
  assignmentForm.set('customerId', customer.id);
  assignmentForm.set('addressId', customer.addresses[0]?.id ?? '');
  const assignmentResponse = await submitServerAction(detailPath, assignmentForm, adminJar);
  assertRedirect(assignmentResponse, `${detailPath}?status=order-customer-assigned`);

  order = await fixture.prisma.checkoutOrder.findUniqueOrThrow({ where: { id: editableOrder.id } });
  assert.equal(order.customerId, customer.id);
  assert.equal(order.addressId, customer.addresses[0]?.id);
  assert.equal(order.recipientName, 'API E2E Assigned Customer');

  const manualPaymentHtml = await responseText(await request(detailPath, { headers: { cookie: adminJar.header() } }));
  const manualPaymentForm = new FormData();
  appendServerActionFields(manualPaymentForm, manualPaymentHtml, 'name="providerReference"');
  manualPaymentForm.set('amountCents', '0');
  manualPaymentForm.set('providerReference', 'api-e2e-admin-manual-paid');
  manualPaymentForm.set('note', 'API E2E admin paid receipt');
  const manualPaymentResponse = await submitServerAction(detailPath, manualPaymentForm, adminJar);
  assertRedirect(manualPaymentResponse, `${detailPath}?status=manual-payment-marked`);

  const paidAttempt = await fixture.prisma.checkoutPaymentAttempt.findFirstOrThrow({
    where: { orderId: editableOrder.id, providerReference: 'api-e2e-admin-manual-paid' }
  });
  assert.equal(paidAttempt.status, 'paid');
  assert.equal(paidAttempt.amountCents, 0);

  const refundHtml = await responseText(await request(detailPath, { headers: { cookie: adminJar.header() } }));
  const refundForm = new FormData();
  appendServerActionFields(refundForm, refundHtml, 'Refund manual payment');
  const refundResponse = await submitServerAction(detailPath, refundForm, adminJar);
  assertRedirect(refundResponse, `${detailPath}?status=manual-payment-refunded`);
  assert.equal((await fixture.prisma.checkoutPaymentAttempt.findUniqueOrThrow({ where: { id: paidAttempt.id } })).status, 'refunded');

  await fixture.prisma.checkoutPaymentAttempt.create({
    data: {
      orderId: editableOrder.id,
      provider: 'manual',
      status: 'created',
      amountCents: 50000,
      currency: 'TOMAN',
      providerReference: 'api-e2e-admin-manual-void'
    }
  });
  const voidHtml = await responseText(await request(detailPath, { headers: { cookie: adminJar.header() } }));
  const voidForm = new FormData();
  appendServerActionFields(voidForm, voidHtml, 'Void manual payment');
  const voidResponse = await submitServerAction(detailPath, voidForm, adminJar);
  assertRedirect(voidResponse, `${detailPath}?status=manual-payment-voided`);
  const voidedAttempt = await fixture.prisma.checkoutPaymentAttempt.findFirstOrThrow({
    where: { orderId: editableOrder.id, providerReference: 'api-e2e-admin-manual-void' }
  });
  assert.equal(voidedAttempt.status, 'cancelled');

  const removeHtml = await responseText(await request(detailPath, { headers: { cookie: adminJar.header() } }));
  const removeForm = new FormData();
  appendServerActionFields(removeForm, removeHtml, 'Remove');
  const removeResponse = await submitServerAction(detailPath, removeForm, adminJar);
  assertRedirect(removeResponse, `${detailPath}?status=order-line-removed`);
  assert.equal(await fixture.prisma.checkoutOrderItem.count({ where: { orderId: editableOrder.id } }), 0);
  assert.equal(await fixture.prisma.inventoryStockReservation.count({ where: { orderItem: { orderId: editableOrder.id }, status: 'held' } }), 0);

  for (const entry of [
    'order.line_item.add',
    ['order.line_item.update', 2],
    ['order.discount.update', 2],
    'order.timeline.note.create',
    'order.fulfillment.update',
    'order.customer.assign',
    'order.payment.manual.mark_paid',
    'order.payment.manual.refund',
    'order.payment.manual.void',
    'order.line_item.remove'
  ] as Array<string | [string, number]>) {
    const action = Array.isArray(entry) ? entry[0] : entry;
    const expectedCount = Array.isArray(entry) ? entry[1] : 1;
    assert.equal(await fixture.prisma.adminAuditLog.count({ where: { action, entityId: editableOrder.id } }), expectedCount, `${action} audit log`);
  }
}
