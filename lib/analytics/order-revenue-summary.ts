import 'server-only';

import {
  getAdminAnalyticsRangeStart,
  isWithinAdminAnalyticsRange,
  normalizeAdminAnalyticsRangeDays,
  startOfUtcDay,
  type AdminAnalyticsRangeDays,
  type AdminAnalyticsRangeInput
} from '@/lib/analytics/admin-analytics-range';
import { hasDatabase, prisma } from '@/lib/prisma';

export type OrderRevenuePaymentAttemptSourceRow = {
  provider: string;
  status: string;
  amountCents: number;
  currency: string;
};

export type OrderRevenueSourceRow = {
  id: string;
  status: string;
  fulfillmentStatus?: string | null;
  currency: string;
  totalCents: number;
  discountCents?: number | null;
  createdAt: Date;
  paymentAttempts?: OrderRevenuePaymentAttemptSourceRow[];
};

export type CurrencyRevenueSummary = {
  currency: string;
  orderCount: number;
  revenueCents: number;
  averageOrderValueCents: number;
};

export type OrderRevenueDailyPoint = {
  date: string;
  orderCount: number;
  revenueCents: number;
  averageOrderValueCents: number;
};

export type OrderOperationalStatusSummary = {
  status: string;
  orderCount: number;
  revenueCents: number;
};

export type PaymentProviderRevenueSummary = {
  provider: string;
  attemptCount: number;
  orderCount: number;
  amountCents: number;
  currency: string;
};

export type OrderDiscountImpactSummary = {
  discountedOrders: number;
  undiscountedOrders: number;
  totalDiscountCents: number;
  discountedRevenueCents: number;
  undiscountedRevenueCents: number;
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
  byFulfillmentStatus: OrderOperationalStatusSummary[];
  byPaymentProvider: PaymentProviderRevenueSummary[];
  discountImpact: OrderDiscountImpactSummary;
  recentDaily: OrderRevenueDailyPoint[];
  analyticsRangeDays: AdminAnalyticsRangeDays;
  primaryCurrency: string;
  generatedAt: Date;
};

export type OrderRevenueSummaryOptions = {
  rangeDays?: AdminAnalyticsRangeInput;
};

const REVENUE_EXCLUDED_STATUSES = new Set(['cancelled', 'canceled', 'refunded', 'voided']);
const COMPLETED_STATUSES = new Set(['completed', 'fulfilled', 'delivered', 'closed']);
const CANCELLED_STATUSES = new Set(['cancelled', 'canceled', 'voided']);
const DAY_MS = 24 * 60 * 60 * 1000;

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
  byFulfillmentStatus: [],
  byPaymentProvider: [],
  discountImpact: {
    discountedOrders: 0,
    undiscountedOrders: 0,
    totalDiscountCents: 0,
    discountedRevenueCents: 0,
    undiscountedRevenueCents: 0
  },
  recentDaily: [],
  analyticsRangeDays: 30,
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

function utcDateKey(value: Date) {
  return startOfUtcDay(value).toISOString().slice(0, 10);
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

function buildRecentDailyPoints(rows: OrderRevenueSourceRow[], now: Date, rangeDays: AdminAnalyticsRangeDays): OrderRevenueDailyPoint[] {
  const end = startOfUtcDay(now);
  const start = new Date(end.getTime() - (rangeDays - 1) * DAY_MS);
  const buckets = new Map<string, { orderCount: number; revenueCents: number }>();

  for (let offset = 0; offset < rangeDays; offset += 1) {
    const day = new Date(start.getTime() + offset * DAY_MS);
    buckets.set(utcDateKey(day), { orderCount: 0, revenueCents: 0 });
  }

  for (const row of rows) {
    const day = startOfUtcDay(row.createdAt);
    if (day < start || day > end) continue;
    const key = utcDateKey(day);
    const bucket = buckets.get(key);
    if (!bucket) continue;
    const status = normalizeStatus(row.status);
    bucket.orderCount += 1;
    bucket.revenueCents += isRevenueEligibleStatus(status) ? normalizeRevenueCents(row.totalCents) : 0;
  }

  return Array.from(buckets.entries()).map(([date, bucket]) => ({
    date,
    orderCount: bucket.orderCount,
    revenueCents: bucket.revenueCents,
    averageOrderValueCents: bucket.orderCount ? Math.round(bucket.revenueCents / bucket.orderCount) : 0
  }));
}

function buildOperationalStatusRows(buckets: Map<string, { orderCount: number; revenueCents: number }>): OrderOperationalStatusSummary[] {
  return Array.from(buckets.entries())
    .map(([status, bucket]) => ({ status, orderCount: bucket.orderCount, revenueCents: bucket.revenueCents }))
    .sort((a, b) => b.orderCount - a.orderCount || b.revenueCents - a.revenueCents || a.status.localeCompare(b.status));
}

function buildPaymentProviderRows(buckets: Map<string, { attemptCount: number; orderIds: Set<string>; amountCents: number; currency: string }>): PaymentProviderRevenueSummary[] {
  return Array.from(buckets.entries())
    .map(([provider, bucket]) => ({
      provider,
      attemptCount: bucket.attemptCount,
      orderCount: bucket.orderIds.size,
      amountCents: bucket.amountCents,
      currency: bucket.currency
    }))
    .sort((a, b) => b.attemptCount - a.attemptCount || b.amountCents - a.amountCents || a.provider.localeCompare(b.provider));
}

export function buildOrderRevenueSummary(rows: OrderRevenueSourceRow[], now = new Date(), options: OrderRevenueSummaryOptions = {}): OrderRevenueSummary {
  const analyticsRangeDays = normalizeAdminAnalyticsRangeDays(options.rangeDays);
  const scopedRows = rows.filter((row) => isWithinAdminAnalyticsRange(row.createdAt, now, analyticsRangeDays));
  const cutoff = getAdminAnalyticsRangeStart(now, analyticsRangeDays);
  const byStatus: Record<string, number> = {};
  const currencyBuckets = new Map<string, { orderCount: number; revenueCents: number }>();
  const fulfillmentBuckets = new Map<string, { orderCount: number; revenueCents: number }>();
  const paymentProviderBuckets = new Map<string, { attemptCount: number; orderIds: Set<string>; amountCents: number; currency: string }>();
  let totalRevenueCents = 0;
  let recentOrders = 0;
  let recentRevenueCents = 0;
  let completedOrders = 0;
  let cancelledOrders = 0;
  let discountedOrders = 0;
  let totalDiscountCents = 0;
  let discountedRevenueCents = 0;
  let undiscountedRevenueCents = 0;

  for (const row of scopedRows) {
    const status = normalizeStatus(row.status);
    const fulfillmentStatus = normalizeStatus(row.fulfillmentStatus ?? 'not_scheduled');
    const currency = normalizeCurrency(row.currency);
    const revenueCents = isRevenueEligibleStatus(status) ? normalizeRevenueCents(row.totalCents) : 0;
    const discountCents = normalizeRevenueCents(row.discountCents ?? 0);
    byStatus[status] = (byStatus[status] ?? 0) + 1;
    if (isCompletedOrderStatus(status)) completedOrders += 1;
    if (isCancelledOrderStatus(status)) cancelledOrders += 1;
    if (row.createdAt >= cutoff) {
      recentOrders += 1;
      recentRevenueCents += revenueCents;
    }
    totalRevenueCents += revenueCents;

    if (discountCents > 0) {
      discountedOrders += 1;
      totalDiscountCents += discountCents;
      discountedRevenueCents += revenueCents;
    } else {
      undiscountedRevenueCents += revenueCents;
    }

    const bucket = currencyBuckets.get(currency) ?? { orderCount: 0, revenueCents: 0 };
    bucket.orderCount += 1;
    bucket.revenueCents += revenueCents;
    currencyBuckets.set(currency, bucket);

    const fulfillmentBucket = fulfillmentBuckets.get(fulfillmentStatus) ?? { orderCount: 0, revenueCents: 0 };
    fulfillmentBucket.orderCount += 1;
    fulfillmentBucket.revenueCents += revenueCents;
    fulfillmentBuckets.set(fulfillmentStatus, fulfillmentBucket);

    for (const attempt of row.paymentAttempts ?? []) {
      const provider = normalizeStatus(attempt.provider);
      const providerCurrency = normalizeCurrency(attempt.currency || currency);
      const providerBucket = paymentProviderBuckets.get(provider) ?? {
        attemptCount: 0,
        orderIds: new Set<string>(),
        amountCents: 0,
        currency: providerCurrency
      };
      providerBucket.attemptCount += 1;
      providerBucket.orderIds.add(row.id);
      providerBucket.amountCents += normalizeRevenueCents(attempt.amountCents);
      paymentProviderBuckets.set(provider, providerBucket);
    }
  }

  const byCurrency = Array.from(currencyBuckets.entries()).map(([currency, bucket]) => ({
    currency,
    orderCount: bucket.orderCount,
    revenueCents: bucket.revenueCents,
    averageOrderValueCents: bucket.orderCount ? Math.round(bucket.revenueCents / bucket.orderCount) : 0
  })).sort((a, b) => b.revenueCents - a.revenueCents || a.currency.localeCompare(b.currency));
  const primaryCurrency = byCurrency[0]?.currency ?? EMPTY_ORDER_REVENUE_SUMMARY.primaryCurrency;

  return {
    totalOrders: scopedRows.length,
    totalRevenueCents,
    averageOrderValueCents: scopedRows.length ? Math.round(totalRevenueCents / scopedRows.length) : 0,
    recentOrders,
    recentRevenueCents,
    openOrders: Math.max(0, scopedRows.length - completedOrders - cancelledOrders),
    completedOrders,
    cancelledOrders,
    byStatus: Object.fromEntries(Object.entries(byStatus).sort(([a], [b]) => a.localeCompare(b))),
    byCurrency,
    byFulfillmentStatus: buildOperationalStatusRows(fulfillmentBuckets),
    byPaymentProvider: buildPaymentProviderRows(paymentProviderBuckets),
    discountImpact: {
      discountedOrders,
      undiscountedOrders: Math.max(0, scopedRows.length - discountedOrders),
      totalDiscountCents,
      discountedRevenueCents,
      undiscountedRevenueCents
    },
    recentDaily: buildRecentDailyPoints(scopedRows, now, analyticsRangeDays),
    analyticsRangeDays,
    primaryCurrency,
    generatedAt: now
  };
}

export const orderRevenueSummaryService = {
  async summary(options: OrderRevenueSummaryOptions = {}): Promise<OrderRevenueSummary> {
    const now = new Date();
    const rangeDays = normalizeAdminAnalyticsRangeDays(options.rangeDays);
    if (!hasDatabase()) return { ...EMPTY_ORDER_REVENUE_SUMMARY, analyticsRangeDays: rangeDays, generatedAt: now };

    const rows = await prisma.checkoutOrder.findMany({
      where: {
        createdAt: {
          gte: getAdminAnalyticsRangeStart(now, rangeDays)
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 1000,
      select: {
        id: true,
        status: true,
        fulfillmentStatus: true,
        currency: true,
        totalCents: true,
        discountCents: true,
        createdAt: true,
        paymentAttempts: {
          select: {
            provider: true,
            status: true,
            amountCents: true,
            currency: true
          }
        }
      }
    });

    return buildOrderRevenueSummary(rows, now, { rangeDays });
  }
};
