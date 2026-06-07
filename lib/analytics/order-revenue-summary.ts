import 'server-only';

import { hasDatabase, prisma } from '@/lib/prisma';

export type OrderRevenueSourceRow = {
  id: string;
  status: string;
  currency: string;
  totalCents: number;
  createdAt: Date;
};

export type CurrencyRevenueSummary = {
  currency: string;
  orderCount: number;
  revenueCents: number;
  averageOrderValueCents: number;
};

export type OrderRevenueSummary = {
  totalOrders: number;
  totalRevenueCents: number;
  averageOrderValueCents: number;
  recentOrders: number;
  recentRevenueCents: number;
  openOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  byStatus: Record<string, number>;
  byCurrency: CurrencyRevenueSummary[];
  primaryCurrency: string;
  generatedAt: Date;
};

const REVENUE_EXCLUDED_STATUSES = new Set(['cancelled', 'canceled', 'refunded', 'voided']);
const COMPLETED_STATUSES = new Set(['completed', 'fulfilled', 'delivered', 'closed']);
const CANCELLED_STATUSES = new Set(['cancelled', 'canceled', 'voided']);

export const EMPTY_ORDER_REVENUE_SUMMARY: OrderRevenueSummary = {
  totalOrders: 0,
  totalRevenueCents: 0,
  averageOrderValueCents: 0,
  recentOrders: 0,
  recentRevenueCents: 0,
  openOrders: 0,
  completedOrders: 0,
  cancelledOrders: 0,
  byStatus: {},
  byCurrency: [],
  primaryCurrency: 'CAD',
  generatedAt: new Date(0)
};

function normalizeStatus(value?: string | null) {
  return value?.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'unknown';
}

function normalizeCurrency(value?: string | null) {
  const normalized = value?.trim().toUpperCase().replace(/[^A-Z]/g, '');
  return normalized || 'CAD';
}

export function normalizeRevenueCents(value?: number | null) {
  if (!Number.isFinite(value ?? NaN)) return 0;
  return Math.max(0, Math.trunc(value ?? 0));
}

export function isRevenueEligibleStatus(status: string) {
  return !REVENUE_EXCLUDED_STATUSES.has(normalizeStatus(status));
}

export function isCompletedOrderStatus(status: string) {
  return COMPLETED_STATUSES.has(normalizeStatus(status));
}

export function isCancelledOrderStatus(status: string) {
  return CANCELLED_STATUSES.has(normalizeStatus(status));
}

export function formatRevenueCents(value: number, currency = 'CAD') {
  const amount = normalizeRevenueCents(value) / 100;
  const normalizedCurrency = normalizeCurrency(currency);
  try {
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: normalizedCurrency }).format(amount);
  } catch (error) {
    if (error instanceof RangeError) return `${amount.toFixed(2)} ${normalizedCurrency}`;
    throw error;
  }
}

export function buildOrderRevenueSummary(rows: OrderRevenueSourceRow[], now = new Date()): OrderRevenueSummary {
  const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const byStatus: Record<string, number> = {};
  const currencyBuckets = new Map<string, { orderCount: number; revenueCents: number }>();
  let totalRevenueCents = 0;
  let recentOrders = 0;
  let recentRevenueCents = 0;
  let completedOrders = 0;
  let cancelledOrders = 0;

  for (const row of rows) {
    const status = normalizeStatus(row.status);
    const currency = normalizeCurrency(row.currency);
    const revenueCents = isRevenueEligibleStatus(status) ? normalizeRevenueCents(row.totalCents) : 0;
    byStatus[status] = (byStatus[status] ?? 0) + 1;
    if (isCompletedOrderStatus(status)) completedOrders += 1;
    if (isCancelledOrderStatus(status)) cancelledOrders += 1;
    if (row.createdAt >= cutoff) {
      recentOrders += 1;
      recentRevenueCents += revenueCents;
    }
    totalRevenueCents += revenueCents;
    const bucket = currencyBuckets.get(currency) ?? { orderCount: 0, revenueCents: 0 };
    bucket.orderCount += 1;
    bucket.revenueCents += revenueCents;
    currencyBuckets.set(currency, bucket);
  }

  const byCurrency = Array.from(currencyBuckets.entries()).map(([currency, bucket]) => ({
    currency,
    orderCount: bucket.orderCount,
    revenueCents: bucket.revenueCents,
    averageOrderValueCents: bucket.orderCount ? Math.round(bucket.revenueCents / bucket.orderCount) : 0
  })).sort((a, b) => b.revenueCents - a.revenueCents || a.currency.localeCompare(b.currency));
  const primaryCurrency = byCurrency[0]?.currency ?? EMPTY_ORDER_REVENUE_SUMMARY.primaryCurrency;

  return {
    totalOrders: rows.length,
    totalRevenueCents,
    averageOrderValueCents: rows.length ? Math.round(totalRevenueCents / rows.length) : 0,
    recentOrders,
    recentRevenueCents,
    openOrders: Math.max(0, rows.length - completedOrders - cancelledOrders),
    completedOrders,
    cancelledOrders,
    byStatus: Object.fromEntries(Object.entries(byStatus).sort(([a], [b]) => a.localeCompare(b))),
    byCurrency,
    primaryCurrency,
    generatedAt: now
  };
}

export const orderRevenueSummaryService = {
  async summary(): Promise<OrderRevenueSummary> {
    if (!hasDatabase()) return { ...EMPTY_ORDER_REVENUE_SUMMARY, generatedAt: new Date() };

    const rows = await prisma.checkoutOrder.findMany({
      orderBy: { createdAt: 'desc' },
      take: 1000,
      select: {
        id: true,
        status: true,
        currency: true,
        totalCents: true,
        createdAt: true
      }
    });

    return buildOrderRevenueSummary(rows);
  }
};
