import 'server-only';

import type { CheckoutOrderSummary } from '@/lib/catalog';
import { listAdminCheckoutOrders } from '@/lib/checkout/admin-order-repository';

export type FulfillmentQueueSourceRow = Pick<CheckoutOrderSummary, 'id' | 'orderNumber' | 'status' | 'fulfillmentStatus' | 'checkoutMode' | 'customerName' | 'customerPhone' | 'itemCount' | 'createdAt'>;

export type FulfillmentQueueOrder = {
  id: string;
  orderNumber: string;
  orderStatus: string;
  fulfillmentStatus: string;
  checkoutMode: string;
  customerLabel: string;
  itemCount: number;
  ageDays: number;
  priority: 'overdue' | 'today' | 'normal';
};

export type FulfillmentQueueSummary = {
  queuedOrders: FulfillmentQueueOrder[];
  totalOrdersReviewed: number;
  queueCount: number;
  overdueCount: number;
  dueTodayCount: number;
  inProgressCount: number;
  readyOrScheduledCount: number;
  unfulfilledCount: number;
  byFulfillmentStatus: { status: string; count: number }[];
  generatedAt: Date;
};

const CANCELLED_ORDER_STATUSES = new Set(['cancelled', 'canceled', 'refunded', 'voided']);
const COMPLETE_FULFILLMENT_STATUSES = new Set(['fulfilled', 'delivered', 'complete', 'completed', 'cancelled', 'canceled']);
const IN_PROGRESS_FULFILLMENT_STATUSES = new Set(['processing', 'packing', 'packed', 'in_progress', 'in_transit']);
const READY_OR_SCHEDULED_FULFILLMENT_STATUSES = new Set(['ready', 'ready_for_pickup', 'scheduled']);
const UNFULFILLED_STATUSES = new Set(['unfulfilled', 'pending', 'new', 'created', '']);

export const EMPTY_FULFILLMENT_QUEUE_SUMMARY: FulfillmentQueueSummary = {
  queuedOrders: [],
  totalOrdersReviewed: 0,
  queueCount: 0,
  overdueCount: 0,
  dueTodayCount: 0,
  inProgressCount: 0,
  readyOrScheduledCount: 0,
  unfulfilledCount: 0,
  byFulfillmentStatus: [],
  generatedAt: new Date(0)
};

export function normalizeFulfillmentQueueStatus(value?: string | null) {
  return value?.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') ?? '';
}

export function isFulfillmentQueueOrder(row: FulfillmentQueueSourceRow) {
  if (CANCELLED_ORDER_STATUSES.has(normalizeFulfillmentQueueStatus(row.status))) return false;
  const fulfillmentStatus = normalizeFulfillmentQueueStatus(row.fulfillmentStatus) || 'unfulfilled';
  return !COMPLETE_FULFILLMENT_STATUSES.has(fulfillmentStatus);
}

function ageDays(createdAt: Date, now: Date) {
  const elapsed = now.getTime() - createdAt.getTime();
  if (!Number.isFinite(elapsed) || elapsed <= 0) return 0;
  return Math.floor(elapsed / (24 * 60 * 60 * 1000));
}

function priorityForAge(days: number) {
  if (days >= 2) return 'overdue' as const;
  if (days === 0) return 'today' as const;
  return 'normal' as const;
}

function customerLabel(row: FulfillmentQueueSourceRow) {
  return row.customerName?.trim() || row.customerPhone?.trim() || 'Guest checkout';
}

export function buildFulfillmentQueueSummary(rows: FulfillmentQueueSourceRow[], now = new Date(), limit = 8): FulfillmentQueueSummary {
  const byFulfillmentStatus = new Map<string, number>();
  const queuedOrders: FulfillmentQueueOrder[] = [];
  let overdueCount = 0;
  let dueTodayCount = 0;
  let inProgressCount = 0;
  let readyOrScheduledCount = 0;
  let unfulfilledCount = 0;

  for (const row of rows) {
    if (!isFulfillmentQueueOrder(row)) continue;
    const fulfillmentStatus = normalizeFulfillmentQueueStatus(row.fulfillmentStatus) || 'unfulfilled';
    byFulfillmentStatus.set(fulfillmentStatus, (byFulfillmentStatus.get(fulfillmentStatus) ?? 0) + 1);
    if (IN_PROGRESS_FULFILLMENT_STATUSES.has(fulfillmentStatus)) inProgressCount += 1;
    if (READY_OR_SCHEDULED_FULFILLMENT_STATUSES.has(fulfillmentStatus)) readyOrScheduledCount += 1;
    if (UNFULFILLED_STATUSES.has(fulfillmentStatus)) unfulfilledCount += 1;

    const days = ageDays(row.createdAt, now);
    const priority = priorityForAge(days);
    if (priority === 'overdue') overdueCount += 1;
    if (priority === 'today') dueTodayCount += 1;

    queuedOrders.push({
      id: row.id,
      orderNumber: row.orderNumber,
      orderStatus: normalizeFulfillmentQueueStatus(row.status) || 'unknown',
      fulfillmentStatus,
      checkoutMode: row.checkoutMode,
      customerLabel: customerLabel(row),
      itemCount: Math.max(0, Math.floor(row.itemCount || 0)),
      ageDays: days,
      priority
    });
  }

  const safeLimit = Math.max(1, Math.min(25, Math.floor(limit)));
  queuedOrders.sort((a, b) => {
    const priorityRank = { overdue: 0, today: 1, normal: 2 } as const;
    return priorityRank[a.priority] - priorityRank[b.priority] || b.ageDays - a.ageDays || a.orderNumber.localeCompare(b.orderNumber);
  });

  return {
    queuedOrders: queuedOrders.slice(0, safeLimit),
    totalOrdersReviewed: rows.length,
    queueCount: queuedOrders.length,
    overdueCount,
    dueTodayCount,
    inProgressCount,
    readyOrScheduledCount,
    unfulfilledCount,
    byFulfillmentStatus: Array.from(byFulfillmentStatus.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count || a.status.localeCompare(b.status)),
    generatedAt: now
  };
}

export const fulfillmentQueueSummaryService = {
  async summary(): Promise<FulfillmentQueueSummary> {
    const orders = await listAdminCheckoutOrders({}, 50);
    return buildFulfillmentQueueSummary(orders);
  }
};
