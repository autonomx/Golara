import assert from 'node:assert/strict';
import {
  appendServerActionFields,
  createAdminCookieJar,
  request,
  responseText,
  submitServerAction,
  type ApiFixture
} from './shared';

export async function runAdminMutationBoundaryTests(fixture: ApiFixture) {
  await runUnavailableProductLineAddDoesNotMutateTest(fixture);
  await runUnavailableVariantLineAddDoesNotMutateTest(fixture);
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
  assertMutationRejected(response, 'order-line-added');
  assert.equal(await fixture.prisma.checkoutOrderItem.count({ where: { orderId: order.id } }), 0);
  assert.equal(await fixture.prisma.adminAuditLog.count({ where: { entityId: order.id, action: 'order.line_item.add' } }), 0);
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
  assertMutationRejected(response, 'order-line-added');
  assert.equal(await fixture.prisma.checkoutOrderItem.count({ where: { orderId: order.id } }), 0);
  assert.equal(await fixture.prisma.adminAuditLog.count({ where: { entityId: order.id, action: 'order.line_item.add' } }), 0);
}

async function runMissingServerActionFieldsDoNotMutateTest(fixture: ApiFixture) {
  const order = await createEditableOrder(fixture, 'API-E2E-ADMIN-BOUNDARY-1003');
  const detailPath = `/admin/orders/${order.id}`;
  const jar = createAdminCookieJar();
  const form = new FormData();
  form.set('lineOption', `${fixture.productId}::${fixture.variantId}`);
  form.set('quantity', '2');

  const response = await submitServerAction(detailPath, form, jar);
  assertMutationRejected(response, 'order-line-added');
  assert.equal(await fixture.prisma.checkoutOrderItem.count({ where: { orderId: order.id } }), 0);
  assert.equal(await fixture.prisma.adminAuditLog.count({ where: { entityId: order.id, action: 'order.line_item.add' } }), 0);
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

function assertMutationRejected(response: Response, successStatus: string) {
  const location = response.headers.get('location') ?? '';
  assert.doesNotMatch(location, new RegExp(successStatus));
  assert.equal([200, 400, 404, 500].includes(response.status), true);
}
