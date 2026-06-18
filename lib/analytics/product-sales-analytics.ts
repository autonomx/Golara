import 'server-only';

import {
  getAdminAnalyticsRangeStart,
  isWithinAdminAnalyticsRange,
  normalizeAdminAnalyticsRangeDays,
  type AdminAnalyticsRangeDays,
  type AdminAnalyticsRangeInput
} from '@/lib/analytics/admin-analytics-range';
import { formatRevenueCents, isRevenueEligibleStatus, normalizeRevenueCents } from '@/lib/analytics/order-revenue-summary';
import { hasDatabase, prisma } from '@/lib/prisma';

export type ProductSalesSourceRow = {
  orderId: string;
  orderStatus: string;
  currency: string;
  productId: string;
  productTitle: string;
  productCode?: string | null;
  quantity: number;
  lineTotalCents: number;
  createdAt: Date;
};

export type ProductSalesAnalyticsRow = {
  productId: string;
  label: string;
  productCode?: string | null;
  orderCount: number;
  quantitySold: number;
  revenueCents: number;
  averageUnitRevenueCents: number;
  currency: string;
};

export type ProductSalesAnalyticsSummary = {
  rows: ProductSalesAnalyticsRow[];
  analyticsRangeDays: AdminAnalyticsRangeDays;
  primaryCurrency: string;
  generatedAt: Date;
};

export type ProductSalesAnalyticsSummaryOptions = {
  rangeDays?: AdminAnalyticsRangeInput;
};

const TOP_PRODUCT_SALES_LIMIT = 10;

export const EMPTY_PRODUCT_SALES_ANALYTICS_SUMMARY: ProductSalesAnalyticsSummary = {
  rows: [],
  analyticsRangeDays: 30,
  primaryCurrency: 'CAD',
  generatedAt: new Date(0)
};

function normalizeProductLabel(value?: string | null, fallback = 'Unknown product') {
  const trimmed = value?.trim().replace(/\s+/g, ' ');
  return trimmed ? trimmed.slice(0, 140) : fallback;
}

function normalizeQuantity(value?: number | null) {
  if (!Number.isFinite(value ?? NaN)) return 0;
  return Math.max(0, Math.trunc(value ?? 0));
}

function normalizeCurrency(value?: string | null) {
  const normalized = value?.trim().toUpperCase().replace(/[^A-Z]/g, '');
  return normalized || 'CAD';
}

export function buildProductSalesAnalyticsSummary(
  rows: ProductSalesSourceRow[],
  now = new Date(),
  options: ProductSalesAnalyticsSummaryOptions = {}
): ProductSalesAnalyticsSummary {
  const analyticsRangeDays = normalizeAdminAnalyticsRangeDays(options.rangeDays);
  const buckets = new Map<string, {
    productId: string;
    label: string;
    productCode?: string | null;
    orderIds: Set<string>;
    quantitySold: number;
    revenueCents: number;
    currency: string;
  }>();

  for (const row of rows) {
    if (!isWithinAdminAnalyticsRange(row.createdAt, now, analyticsRangeDays)) continue;
    if (!isRevenueEligibleStatus(row.orderStatus)) continue;

    const quantity = normalizeQuantity(row.quantity);
    const revenueCents = normalizeRevenueCents(row.lineTotalCents);
    if (quantity <= 0 && revenueCents <= 0) continue;

    const productId = normalizeProductLabel(row.productId, 'unknown-product');
    const label = normalizeProductLabel(row.productTitle, row.productCode || productId);
    const currency = normalizeCurrency(row.currency);
    const bucket = buckets.get(productId) ?? {
      productId,
      label,
      productCode: row.productCode ?? null,
      orderIds: new Set<string>(),
      quantitySold: 0,
      revenueCents: 0,
      currency
    };

    bucket.orderIds.add(row.orderId);
    bucket.quantitySold += quantity;
    bucket.revenueCents += revenueCents;
    bucket.currency = bucket.currency || currency;
    buckets.set(productId, bucket);
  }

  const rowsByRevenue = Array.from(buckets.values())
    .map((bucket) => ({
      productId: bucket.productId,
      label: bucket.label,
      productCode: bucket.productCode,
      orderCount: bucket.orderIds.size,
      quantitySold: bucket.quantitySold,
      revenueCents: bucket.revenueCents,
      averageUnitRevenueCents: bucket.quantitySold ? Math.round(bucket.revenueCents / bucket.quantitySold) : 0,
      currency: bucket.currency
    }))
    .sort((a, b) => b.revenueCents - a.revenueCents || b.quantitySold - a.quantitySold || a.label.localeCompare(b.label))
    .slice(0, TOP_PRODUCT_SALES_LIMIT);

  return {
    rows: rowsByRevenue,
    analyticsRangeDays,
    primaryCurrency: rowsByRevenue[0]?.currency ?? EMPTY_PRODUCT_SALES_ANALYTICS_SUMMARY.primaryCurrency,
    generatedAt: now
  };
}

export const productSalesAnalyticsService = {
  async summary(options: ProductSalesAnalyticsSummaryOptions = {}): Promise<ProductSalesAnalyticsSummary> {
    const now = new Date();
    const rangeDays = normalizeAdminAnalyticsRangeDays(options.rangeDays);
    if (!hasDatabase()) return { ...EMPTY_PRODUCT_SALES_ANALYTICS_SUMMARY, analyticsRangeDays: rangeDays, generatedAt: now };

    const items = await prisma.checkoutOrderItem.findMany({
      where: {
        order: {
          createdAt: {
            gte: getAdminAnalyticsRangeStart(now, rangeDays)
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5000,
      select: {
        orderId: true,
        productId: true,
        productTitle: true,
        productCode: true,
        quantity: true,
        lineTotalCents: true,
        order: {
          select: {
            status: true,
            currency: true,
            createdAt: true
          }
        }
      }
    });

    return buildProductSalesAnalyticsSummary(items.map((item) => ({
      orderId: item.orderId,
      orderStatus: item.order.status,
      currency: item.order.currency,
      productId: item.productId,
      productTitle: item.productTitle,
      productCode: item.productCode,
      quantity: item.quantity,
      lineTotalCents: item.lineTotalCents,
      createdAt: item.order.createdAt
    })), now, { rangeDays });
  },

  formatRevenueCents
};
