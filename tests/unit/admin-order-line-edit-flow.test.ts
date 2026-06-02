import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runAdminOrderLineEditFlowTests() {
  const repository = source('lib/checkout/admin-order-line-repository.ts');
  const actions = source('app/admin/order-actions.ts');
  const detail = source('app/admin/orders/[orderId]/page.tsx');
  const inventoryReservations = source('lib/inventory/inventory-reservation-service.ts');

  assert.match(repository, /const EDITABLE_ORDER_STATUSES = new Set\(\['draft', 'pending'\]\)/);
  assert.match(repository, /export async function listAdminOrderLineProductOptions/);
  assert.match(repository, /export function parseAdminOrderLineSelection/);
  assert.match(repository, /export function isAdminOrderLineEditable/);
  assert.match(repository, /export async function addAdminOrderLineItem/);
  assert.match(repository, /export async function updateAdminOrderLineItemQuantity/);
  assert.match(repository, /export async function removeAdminOrderLineItem/);
  assert.match(repository, /recalculateOrderTotals/);
  assert.match(repository, /releaseOrderInventoryReservations\(orderId, tx\)/);
  assert.match(repository, /reserveOrderInventory\(orderId, tx\)/);

  assert.match(actions, /export async function addOrderLineItemAction/);
  assert.match(actions, /export async function updateOrderLineItemQuantityAction/);
  assert.match(actions, /export async function removeOrderLineItemAction/);
  assert.match(actions, /action: 'order.line_item.add'/);
  assert.match(actions, /action: 'order.line_item.update'/);
  assert.match(actions, /action: 'order.line_item.remove'/);

  assert.match(detail, /isAdminOrderLineEditable\(order.status\)/);
  assert.match(detail, /listAdminOrderLineProductOptions/);
  assert.match(detail, /Add line/);
  assert.match(detail, /Update/);
  assert.match(detail, /Remove/);
  assert.match(detail, /order-line-added/);
  assert.match(detail, /order-line-updated/);
  assert.match(detail, /order-line-removed/);

  assert.match(inventoryReservations, /releaseOrderInventoryReservations\(orderId: string, tx\?: InventoryTx\)/);

  console.log('admin-order-line-edit-flow.test.ts passed');
}
