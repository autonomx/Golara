import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runOrderDiscountFlowTests() {
  const actions = source('app/admin/order-actions.ts');
  const detail = source('app/admin/orders/[orderId]/page.tsx');

  assert.match(actions, /export async function updateOrderDiscountAction/);
  assert.match(actions, /isAdminOrderLineEditable\(existing.status\)/);
  assert.match(actions, /Order discounts can only be edited before confirmation/);
  assert.match(actions, /maxDiscountCents = existing.subtotalCents \+ existing.deliveryCents/);
  assert.match(actions, /type: 'order_discount_updated'/);
  assert.match(actions, /action: 'order.discount.update'/);

  assert.match(detail, /updateOrderDiscountAction/);
  assert.match(detail, /order-discount-updated/);
  assert.match(detail, /Save discount/);
  assert.match(detail, /name="discountCents"/);

  console.log('order-discount-flow.test.ts passed');
}
