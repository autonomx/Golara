import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  getAdminCheckoutOrder,
  listAdminCheckoutOrderPage,
  listAdminCheckoutOrders,
  listAdminCheckoutOrdersForExport
} from '../../lib/checkout/admin-order-repository';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runAdminOrderLineEditFlowTests() {
  const repository = source('lib/checkout/admin-order-line-repository.ts');
  const adminOrderRepository = source('lib/checkout/admin-order-repository.ts');
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

  assert.deepEqual(await listAdminCheckoutOrders({
    status: ' pending ',
    paymentStatus: ' paid ',
    fulfillmentStatus: ' unfulfilled ',
    search: ' G-1001 '
  }, Number.NaN), []);
  assert.deepEqual(await listAdminCheckoutOrdersForExport({ search: ' guest@example.invalid ' }), []);
  assert.deepEqual(await getAdminCheckoutOrder('order_123'), null);
  assert.deepEqual(await listAdminCheckoutOrderPage({ paymentStatus: 'failed' }, Number.NaN, 250), {
    orders: [],
    page: 1,
    pageSize: 250,
    totalCount: 0,
    totalPages: 1
  });

  for (const marker of [
    'function optionalText(value?: string)',
    'function safePage(value = 1)',
    'function buildOrderWhere(filters: AdminOrderFilters = {})',
    'where.paymentAttempts = { some: { status: paymentStatus } }',
    'orderNumber: { contains: search, mode: \'insensitive\' }',
    'customer: { phone: { contains: search, mode: \'insensitive\' } }',
    'customer: { displayName: { contains: search, mode: \'insensitive\' } }',
    'items: { some: { productTitle: { contains: search, mode: \'insensitive\' } } }',
    'function mapOrderSummary(order: DbOrderSummary)',
    'latestPaymentStatus: order.paymentAttempts[0]?.status',
    'latestTimelineTitle: order.timelineEvents[0]?.title',
    'Math.max(1, Math.min(50, Math.floor(limit)))',
    'Math.max(1, Math.min(50, Math.floor(pageSize)))',
    'Math.max(1, Math.ceil(totalCount / safePageSize))',
    'page: Math.min(currentPage, totalPages)',
    'mapAdminOrderActivityTimeline(order.timelineEvents)'
  ]) {
    assert.ok(adminOrderRepository.includes(marker), `admin order repository source must include ${marker}`);
  }

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
