import 'server-only';

import { buildAnalyticsComparisonDelta, type AnalyticsComparisonDelta } from '@/lib/analytics/analytics-comparison';
import {
  getAdminAnalyticsPreviousRangeStart,
  isWithinAdminAnalyticsPreviousRange,
  isWithinAdminAnalyticsRange,
  resolveAdminAnalyticsRange,
  startOfUtcDay,
  type AdminAnalyticsRangeInput,
  type AdminAnalyticsResolvedRange
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
  customerId?: string | null;
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

export type OrderCustomerCohortSummary = {
  guestOrders: number;
  guestRevenueCents: number;
  knownCustomerOrders: number;
  knownCustomerRevenueCents: number;
  knownCustomerCount: number;
  firstTimeKnownCustomerOrders: number;
  firstTimeKnownCustomerRevenueCents: number;
  returningKnownCustomerOrders: number;
  returningKnownCustomerRevenueCents: number;
  returningKnownCustomerOrderRatePercent: number;
};

export type OrderRevenueComparisonSummary = {
  totalOrders: AnalyticsComparisonDelta;
  totalRevenueCents: AnalyticsComparisonDelta;
  averageOrderValueCents: AnalyticsComparisonDelta;
  openOrders: AnalyticsComparisonDelta;
  completedOrders: AnalyticsComparisonDelta;
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
  customerCohorts: OrderCustomerCohortSummary;
  comparison: OrderRevenueComparisonSummary;
  recentDaily: OrderRevenueDailyPoint[];
  analyticsRangeDays: number;
  analyticsRangeLabel: string;
  analyticsRangeMode: 'preset' | 'custom';
  analyticsRangeStart: Date;
  analyticsRangeEnd: Date;
  primaryCurrency: string;
  generatedAt: Date;
};

export type OrderRevenueSummaryOptions = {
  rangeDays?: AdminAnalyticsRangeInput;
  start?: AdminAnalyticsRangeInput;
  end?: AdminAnalyticsRangeInput;
  analyticsRange?: AdminAnalyticsResolvedRange;
};

const REVENUE_EXCLUDED_STATUSES = new Set(['cancelled', 'canceled', 'refunded', 'voided']);
const COMPLETED_STATUSES = new Set(['completed', 'fulfilled', 'delivered', 'closed']);
const CANCELLED_STATUSES = new Set(['cancelled', 'canceled', 'voided']);
const DAY_MS = 24 * 60 * 60 * 1000;
const ZERO_DELTA = buildAnalyticsComparisonDelta(0, 0);
const EMPTY_RANGE = resolveAdminAnalyticsRange(new Date(0));
const EMPTY_ORDER_CUSTOMER_COHORTS: OrderCustomerCohortSummary = {
  guestOrders: 0,
  guestRevenueCents: 0,
  knownCustomerOrders: 0,
  knownCustomerRevenueCents: 0,
  knownCustomerCount: 0,
  firstTimeKnownCustomerOrders: 0,
  firstTimeKnownCustomerRevenueCents: 0,
  returningKnownCustomerOrders: 0,
  returningKnownCustomerRevenueCents: 0,
  returningKnownCustomerOrderRatePercent: 0
};

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
  customerCohorts: EMPTY_ORDER_CUSTOMER_COHORTS,
  comparison: {
    totalOrders: ZERO_DELTA,
    totalRevenueCents: ZERO_DELTA,
    averageOrderValueCents: ZERO_DELTA,
    openOrders: ZERO_DELTA,
    completedOrders: ZERO_DELTA
  },
  recentDaily: [],
  analyticsRangeDays: 30,
  analyticsRangeLabel: EMPTY_RANGE.label,
  analyticsRangeMode: EMPTY_RANGE.mode,
  analyticsRangeStart: EMPTY_RANGE.startDate,
  analyticsRangeEnd: EMPTY_RANGE.endDate,
  primaryCurrency: 'CAD',
  generatedAt: new Date(0)
};

function resolveSummaryRange(now: Date, options: OrderRevenueSummaryOptions) {
  return options.analyticsRange ?? resolveAdminAnalyticsRange(now, {
    range: options.rangeDays,
    start: options.start,
    end: options.end
  });
}

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

function buildRecentDailyPoints(rows: OrderRevenueSourceRow[], range: AdminAnalyticsResolvedRange): OrderRevenueDailyPoint[] {
  const buckets = new Map<string, { orderCount: number; revenueCents: number }>();

  for (let offset = 0; offset < range.rangeDays; offset += 1) {
    const day = new Date(range.startDate.getTime() + offset * DAY_MS);
    buckets.set(utcDateKey(day), { orderCount: 0, revenueCents: 0 });
  }

  for (const row of rows) {
    const day = startOfUtcDay(row.createdAt);
    if (day < range.startDate || day > range.endDate) continue;
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

type OrderComparisonSnapshot = {
  totalOrders: number;
  totalRevenueCents: number;
  averageOrderValueCents: number;
  openOrders: number;
  completedOrders: number;
};

function buildOrderComparisonSnapshot(rows: OrderRevenueSourceRow[]): OrderComparisonSnapshot {
  let totalRevenueCents = 0;
  let completedOrders = 0;
  let cancelledOrders = 0;

  for (const row of rows) {
    const status = normalizeStatus(row.status);
    if (isCompletedOrderStatus(status)) completedOrders += 1;
    if (isCancelledOrderStatus(status)) cancelledOrders += 1;
    totalRevenueCents += isRevenueEligibleStatus(status) ? normalizeRevenueCents(row.totalCents) : 0;
  }

  return {
    totalOrders: rows.length,
    totalRevenueCents,
    averageOrderValueCents: rows.length ? Math.round(totalRevenueCents / rows.length) : 0,
    openOrders: Math.max(0, rows.length - completedOrders - cancelledOrders),
    completedOrders
  };
}

function buildOrderCustomerCohorts(rows: OrderRevenueSourceRow[]): OrderCustomerCohortSummary {
  const seenKnownCustomers = new Set<string>();
  let guestOrders = 0;
  let guestRevenueCents = 0;
  let knownCustomerOrders = 0;
  let knownCustomerRevenueCents = 0;
  let firstTimeKnownCustomerOrders = 0;
  let firstTimeKnownCustomerRevenueCents = 0;
  let returningKnownCustomerOrders = 0;
  let returningKnownCustomerRevenueCents = 0;

  for (const row of [...rows].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() || a.id.localeCompare(b.id))) {
    const status = normalizeStatus(row.status);
    const revenueCents = isRevenueEligibleStatus(status) ? normalizeRevenueCents(row.totalCents) : 0;
    const accountKey = row.customerId?.trim();

    if (!accountKey) {
      guestOrders += 1;
      guestRevenueCents += revenueCents;
      continue;
    }

    knownCustomerOrders += 1;
    knownCustomerRevenueCents += revenueCents;

    if (seenKnownCustomers.has(accountKey)) {
      returningKnownCustomerOrders += 1;
      returningKnownCustomerRevenueCents += revenueCents;
    } else {
      seenKnownCustomers.add(accountKey);
      firstTimeKnownCustomerOrders += 1;
      firstTimeKnownCustomerRevenueCents += revenueCents;
    }
  }

  return {
    guestOrders,
    guestRevenueCents,
    knownCustomerOrders,
    knownCustomerRevenueCents,
    knownCustomerCount: seenKnownCustomers.size,
    firstTimeKnownCustomerOrders,
    firstTimeKnownCustomerRevenueCents,
    returningKnownCustomerOrders,
    returningKnownCustomerRevenueCents,
    returningKnownCustomerOrderRatePercent: knownCustomerOrders ? Math.round((returningKnownCustomerOrders / knownCustomerOrders) * 1000) / 10 : 0
  };
}

function buildOrderRevenueComparison(current: OrderComparisonSnapshot, previous: OrderComparisonSnapshot): OrderRevenueComparisonSummary {
  return {
    totalOrders: buildAnalyticsComparisonDelta(current.totalOrders, previous.totalOrders),
    totalRevenueCents: buildAnalyticsComparisonDelta(current.totalRevenueCents, previous.totalRevenueCents),
    averageOrderValueCents: buildAnalyticsComparisonDelta(current.averageOrderValueCents, previous.averageOrderValueCents),
    openOrders: buildAnalyticsComparisonDelta(current.openOrders, previous.openOrders),
    completedOrders: buildAnalyticsComparisonDelta(current.completedOrders, previous.completedOrders)
  };
}

export function buildOrderRevenueSummary(rows: OrderRevenueSourceRow[], now = new Date(), options: OrderRevenueSummaryOptions = {}): OrderRevenueSummary {
  const analyticsRange = resolveSummaryRange(now, options);
  const scopedRows = rows.filter((row) => isWithinAdminAnalyticsRange(row.createdAt, now, analyticsRange));
  const previousRows = rows.filter((row) => isWithinAdminAnalyticsPreviousRange(row.createdAt, now, analyticsRange));
  const cutoff = analyticsRange.startDate;
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
  const currentSnapshot: OrderComparisonSnapshot = {
    totalOrders: scopedRows.length,
    totalRevenueCents,
    averageOrderValueCents: scopedRows.length ? Math.round(totalRevenueCents / scopedRows.length) : 0,
    openOrders: Math.max(0, scopedRows.length - completedOrders - cancelledOrders),
    completedOrders
  };
  const previousSnapshot = buildOrderComparisonSnapshot(previousRows);

  return {
    totalOrders: currentSnapshot.totalOrders,
    totalRevenueCents,
    averageOrderValueCents: currentSnapshot.averageOrderValueCents,
    recentOrders,
    recentRevenueCents,
    openOrders: currentSnapshot.openOrders,
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
    customerCohorts: buildOrderCustomerCohorts(scopedRows),
    comparison: buildOrderRevenueComparison(currentSnapshot, previousSnapshot),
    recentDaily: buildRecentDailyPoints(scopedRows, analyticsRange),
    analyticsRangeDays: analyticsRange.rangeDays,
    analyticsRangeLabel: analyticsRange.label,
    analyticsRangeMode: analyticsRange.mode,
    analyticsRangeStart: analyticsRange.startDate,
    analyticsRangeEnd: analyticsRange.endDate,
    primaryCurrency,
    generatedAt: now
  };
}

export const orderRevenueSummaryService = {
  async summary(options: OrderRevenueSummaryOptions = {}): Promise<OrderRevenueSummary> {
    const now = new Date();
    const analyticsRange = resolveSummaryRange(now, options);
    if (!hasDatabase()) {
      return {
        ...EMPTY_ORDER_REVENUE_SUMMARY,
        analyticsRangeDays: analyticsRange.rangeDays,
        analyticsRangeLabel: analyticsRange.label,
        analyticsRangeMode: analyticsRange.mode,
        analyticsRangeStart: analyticsRange.startDate,
        analyticsRangeEnd: analyticsRange.endDate,
        generatedAt: now
      };
    }

    const rows = await prisma.checkoutOrder.findMany({
      where: {
        createdAt: {
          gte: getAdminAnalyticsPreviousRangeStart(now, analyticsRange)
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 2000,
      select: {
        id: true,
        customerId: true,
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

    return buildOrderRevenueSummary(rows, now, { analyticsRange });
  }
};
