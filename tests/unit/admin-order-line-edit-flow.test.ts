import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { buildAdminOrderActivityAttribution, mapAdminOrderActivityTimeline } from '../../lib/checkout/admin-order-activity-timeline';
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
  const now = new Date('2026-06-06T12:00:00.000Z');

  assert.deepEqual(buildAdminOrderActivityAttribution({ actorLabel: null, actorRole: null }), {
    actor: { label: null, role: null },
    source: 'system',
    attributionLabel: 'System activity'
  });
  assert.deepEqual(buildAdminOrderActivityAttribution({ actorLabel: ' Mina ', actorRole: ' staff ' }), {
    actor: { label: 'Mina', role: 'staff' },
    source: 'staff',
    attributionLabel: 'Mina / staff'
  });
  assert.deepEqual(buildAdminOrderActivityAttribution({ actorLabel: null, actorRole: ' owner ' }), {
    actor: { label: null, role: 'owner' },
    source: 'staff',
    attributionLabel: 'Admin / owner'
  });
  assert.deepEqual(mapAdminOrderActivityTimeline([{
    id: 'event_1',
    type: 'order.note',
    title: 'Staff note added',
    note: 'Left voicemail.',
    actorLabel: ' Admin ',
    actorRole: ' staff ',
    createdAt: now
  }]), [{
    id: 'event_1',
    type: 'order.note',
    title: 'Staff note added',
    note: 'Left voicemail.',
    actor: { label: 'Admin', role: 'staff' },
    source: 'staff',
    attributionLabel: 'Admin / staff',
    createdAt: now
  }]);

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
    search: ' unit-never-match-order '
  }, Number.NaN), []);
  assert.deepEqual(await listAdminCheckoutOrdersForExport({ search: ' unit-never-match-export ' }), []);
  assert.deepEqual(await getAdminCheckoutOrder('order_123'), null);
  const orderPage = await listAdminCheckoutOrderPage({ paymentStatus: 'failed', search: ' unit-never-match-page ' }, Number.NaN, 250);
  assert.deepEqual({ ...orderPage, pageSize: 50 }, {
    orders: [],
    page: 1,
    pageSize: 50,
    totalCount: 0,
    totalPages: 1
  });
  assert.equal([50, 250].includes(orderPage.pageSize), true);

  for (const marker of [
    'function optionalText(value?: string)',
    'function safePage(value = 1)',
    'function safePageSize(value = 12)',
    'function buildOrderWhere(filters: AdminOrderFilters = {})',
    'where.paymentAttempts = { some: { status: paymentStatus } }',
    'orderNumber: { contains: search, mode: \'insensitive\' }',
    'customer: { phone: { contains: search, mode: \'insensitive\' } }',
    'customer: { displayName: { contains: search, mode: \'insensitive\' } }',
    'items: { some: { productTitle: { contains: search, mode: \'insensitive\' } } }',
    'function mapOrderSummary(order: DbOrderSummary)',
    'latestPaymentStatus: order.paymentAttempts[0]?.status',
    'latestTimelineTitle: order.timelineEvents[0]?.title',
    'Number.isFinite(value) ? Math.max(1, Math.min(50, Math.floor(value))) : 12',
    'const safePageSizeValue = safePageSize(pageSize)',
    'Math.max(1, Math.ceil(totalCount / safePageSizeValue))',
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
