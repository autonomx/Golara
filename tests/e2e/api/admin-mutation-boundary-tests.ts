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

export async function runAdminBoundaryPostTests(fixture: ApiFixture) {
  await runUnavailableProductLineAddDoesNotMutateTest(fixture);
  await runUnavailableVariantLineAddDoesNotMutateTest(fixture);
  await runInvalidOrderStatusDoesNotMutateTest(fixture);
  await runInvalidFulfillmentStatusDoesNotMutateTest(fixture);
  await runMissingTimelineNoteDoesNotMutateTest(fixture);
  await runMissingManualPaymentAttemptDoesNotMutateTest(fixture);
  await runMissingServerActionFieldsDoNotMutateTest(fixture);
}

async function runUnavailableProductLineAddDoesNotMutateTest(fixture: ApiFixture) {
  const order = await createEditableOrder(fixture, 'API-E2E-ADMIN-BOUNDARY-1001');
  const detailPath = `/admin/orders/${order.id}`;
  const jar = createAdminCookieJar();
  const html = await responseText(await request(detailPath, { headers: { cookie: jar.header() } }));
  const form = new FormData();
  appendServerActionFields(form, html, 'name="lineOption"');
  form.set('lineOption', 'missing-product-id::missing-variant-id');
  form.set('quantity', '2');

  const response = await submitServerAction(detailPath, form, jar);
  assertRedirect(response, `${detailPath}?status=order-line-product-unavailable`);
  await assertNoLineAddMutation(fixture, order.id);
}

async function runUnavailableVariantLineAddDoesNotMutateTest(fixture: ApiFixture) {
  const order = await createEditableOrder(fixture, 'API-E2E-ADMIN-BOUNDARY-1002');
  const detailPath = `/admin/orders/${order.id}`;
  const jar = createAdminCookieJar();
  const html = await responseText(await request(detailPath, { headers: { cookie: jar.header() } }));
  const form = new FormData();
  appendServerActionFields(form, html, 'name="lineOption"');
  form.set('lineOption', `${fixture.productId}::missing-variant-id`);
  form.set('quantity', '2');

  const response = await submitServerAction(detailPath, form, jar);
  assertRedirect(response, `${detailPath}?status=order-line-variant-unavailable`);
  await assertNoLineAddMutation(fixture, order.id);
}

async function runInvalidOrderStatusDoesNotMutateTest(fixture: ApiFixture) {
  const order = await createEditableOrder(fixture, 'API-E2E-ADMIN-BOUNDARY-1004');
  const detailPath = `/admin/orders/${order.id}`;
  const listPath = `/admin/orders?orderSearch=${encodeURIComponent(order.orderNumber)}`;
  const jar = createAdminCookieJar();
  const html = await responseText(await request(listPath, { headers: { cookie: jar.header() } }));
  const form = new FormData();
  appendServerActionFields(form, html, 'name="status"');
  form.set('status', 'not-a-real-status');
  form.set('staffNotes', 'Invalid order status should not mutate.');

  const response = await submitServerAction(listPath, form, jar);
  assertRedirect(response, `${detailPath}?status=order-status-invalid`);
  assert.equal((await fixture.prisma.checkoutOrder.findUniqueOrThrow({ where: { id: order.id } })).status, 'draft');
  assert.equal(await fixture.prisma.adminAuditLog.count({ where: { entityId: order.id, action: 'order.status.update' } }), 0);
}

async function runInvalidFulfillmentStatusDoesNotMutateTest(fixture: ApiFixture) {
  const order = await createEditableOrder(fixture, 'API-E2E-ADMIN-BOUNDARY-1005');
  const detailPath = `/admin/orders/${order.id}`;
  const jar = createAdminCookieJar();
  const html = await responseText(await request(detailPath, { headers: { cookie: jar.header() } }));
  const form = new FormData();
  appendServerActionFields(form, html, 'name="fulfillmentStatus"');
  form.set('fulfillmentStatus', 'not-a-real-fulfillment-status');
  form.set('fulfillmentNote', 'Invalid fulfillment status should not mutate.');

  const response = await submitServerAction(detailPath, form, jar);
  assertRedirect(response, `${detailPath}?status=fulfillment-status-invalid`);
  const reloaded = await fixture.prisma.checkoutOrder.findUniqueOrThrow({ where: { id: order.id } });
  assert.equal(reloaded.fulfillmentStatus, 'not_scheduled');
  assert.equal(reloaded.fulfillmentNote, null);
  assert.equal(await fixture.prisma.adminAuditLog.count({ where: { entityId: order.id, action: 'order.fulfillment.update' } }), 0);
}

async function runMissingTimelineNoteDoesNotMutateTest(fixture: ApiFixture) {
  const order = await createEditableOrder(fixture, 'API-E2E-ADMIN-BOUNDARY-1006');
  const detailPath = `/admin/orders/${order.id}`;
  const jar = createAdminCookieJar();
  const html = await responseText(await request(detailPath, { headers: { cookie: jar.header() } }));
  const form = new FormData();
  appendServerActionFields(form, html, 'name="note"');
  form.set('note', '');

  const response = await submitServerAction(detailPath, form, jar);
  assertRedirect(response, `${detailPath}?status=order-note-required`);
  assert.equal(await fixture.prisma.checkoutOrderTimelineEvent.count({ where: { orderId: order.id, type: 'staff_note' } }), 0);
  assert.equal(await fixture.prisma.adminAuditLog.count({ where: { entityId: order.id, action: 'order.timeline.note.create' } }), 0);
}

async function runMissingManualPaymentAttemptDoesNotMutateTest(fixture: ApiFixture) {
  const order = await createEditableOrder(fixture, 'API-E2E-ADMIN-BOUNDARY-1007');
  const paymentAttempt = await fixture.prisma.checkoutPaymentAttempt.create({
    data: {
      orderId: order.id,
      provider: 'manual',
      status: 'paid',
      amountCents: 1000,
      currency: 'TOMAN',
      providerReference: 'api-e2e-missing-manual-refund'
    }
  });
  const detailPath = `/admin/orders/${order.id}`;
  const jar = createAdminCookieJar();
  const html = await responseText(await request(detailPath, { headers: { cookie: jar.header() } }));
  const form = new FormData();
  appendServerActionFields(form, html, 'Refund manual payment');
  await fixture.prisma.checkoutPaymentAttempt.delete({ where: { id: paymentAttempt.id } });

  const response = await submitServerAction(detailPath, form, jar);
  assertRedirect(response, `${detailPath}?status=manual-payment-not-found`);
  assert.equal(await fixture.prisma.adminAuditLog.count({ where: { entityId: order.id, action: 'order.payment.manual.refund' } }), 0);
}

async function runMissingServerActionFieldsDoNotMutateTest(fixture: ApiFixture) {
  const order = await createEditableOrder(fixture, 'API-E2E-ADMIN-BOUNDARY-1003');
  const detailPath = `/admin/orders/${order.id}`;
  const jar = createAdminCookieJar();
  const form = new FormData();
  form.set('lineOption', `${fixture.productId}::${fixture.variantId}`);
  form.set('quantity', '2');

  const response = await submitServerAction(detailPath, form, jar);
  const location = response.headers.get('location') ?? '';
  assert.doesNotMatch(location, /order-line-added/);
  assert.equal([400, 404, 500].includes(response.status), true);
  await assertNoLineAddMutation(fixture, order.id);
}

async function createEditableOrder(fixture: ApiFixture, orderNumber: string) {
  return fixture.prisma.checkoutOrder.create({
    data: {
      orderNumber,
      publicLookupToken: `${orderNumber.toLowerCase()}-token`,
      status: 'draft',
      checkoutMode: 'staff',
      currency: 'TOMAN',
      recipientName: 'API E2E Admin Boundary Recipient',
      recipientPhone: '+16045559801'
    }
  });
}

async function assertNoLineAddMutation(fixture: ApiFixture, orderId: string) {
  assert.equal(await fixture.prisma.checkoutOrderItem.count({ where: { orderId } }), 0);
  assert.equal(await fixture.prisma.adminAuditLog.count({ where: { entityId: orderId, action: 'order.line_item.add' } }), 0);
}
