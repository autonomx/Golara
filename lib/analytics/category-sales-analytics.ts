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

export type CategorySalesSourceRow = {
  orderId: string;
  orderStatus: string;
  currency: string;
  categoryId: string;
  categoryTitle: string;
  categorySlug?: string | null;
  quantity: number;
  lineTotalCents: number;
  createdAt: Date;
};

export type CategorySalesAnalyticsRow = {
  categoryId: string;
  label: string;
  categorySlug?: string | null;
  orderCount: number;
  quantitySold: number;
  revenueCents: number;
  averageUnitRevenueCents: number;
  currency: string;
};

export type CategorySalesAnalyticsSummary = {
  rows: CategorySalesAnalyticsRow[];
  analyticsRangeDays: AdminAnalyticsRangeDays;
  primaryCurrency: string;
  generatedAt: Date;
};

export type CategorySalesAnalyticsSummaryOptions = {
  rangeDays?: AdminAnalyticsRangeInput;
};

const TOP_CATEGORY_SALES_LIMIT = 10;

export const EMPTY_CATEGORY_SALES_ANALYTICS_SUMMARY: CategorySalesAnalyticsSummary = {
  rows: [],
  analyticsRangeDays: 30,
  primaryCurrency: 'CAD',
  generatedAt: new Date(0)
};

function normalizeCategoryLabel(value?: string | null, fallback = 'Unknown category') {
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

export function buildCategorySalesAnalyticsSummary(
  rows: CategorySalesSourceRow[],
  now = new Date(),
  options: CategorySalesAnalyticsSummaryOptions = {}
): CategorySalesAnalyticsSummary {
  const analyticsRangeDays = normalizeAdminAnalyticsRangeDays(options.rangeDays);
  const buckets = new Map<string, {
    categoryId: string;
    label: string;
    categorySlug?: string | null;
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

    const categoryId = normalizeCategoryLabel(row.categoryId, 'unknown-category');
    const label = normalizeCategoryLabel(row.categoryTitle, row.categorySlug || categoryId);
    const currency = normalizeCurrency(row.currency);
    const bucket = buckets.get(categoryId) ?? {
      categoryId,
      label,
      categorySlug: row.categorySlug ?? null,
      orderIds: new Set<string>(),
      quantitySold: 0,
      revenueCents: 0,
      currency
    };

    bucket.orderIds.add(row.orderId);
    bucket.quantitySold += quantity;
    bucket.revenueCents += revenueCents;
    bucket.currency = bucket.currency || currency;
    buckets.set(categoryId, bucket);
  }

  const rowsByRevenue = Array.from(buckets.values())
    .map((bucket) => ({
      categoryId: bucket.categoryId,
      label: bucket.label,
      categorySlug: bucket.categorySlug,
      orderCount: bucket.orderIds.size,
      quantitySold: bucket.quantitySold,
      revenueCents: bucket.revenueCents,
      averageUnitRevenueCents: bucket.quantitySold ? Math.round(bucket.revenueCents / bucket.quantitySold) : 0,
      currency: bucket.currency
    }))
    .sort((a, b) => b.revenueCents - a.revenueCents || b.quantitySold - a.quantitySold || a.label.localeCompare(b.label))
    .slice(0, TOP_CATEGORY_SALES_LIMIT);

  return {
    rows: rowsByRevenue,
    analyticsRangeDays,
    primaryCurrency: rowsByRevenue[0]?.currency ?? EMPTY_CATEGORY_SALES_ANALYTICS_SUMMARY.primaryCurrency,
    generatedAt: now
  };
}

export const categorySalesAnalyticsService = {
  async summary(options: CategorySalesAnalyticsSummaryOptions = {}): Promise<CategorySalesAnalyticsSummary> {
    const now = new Date();
    const rangeDays = normalizeAdminAnalyticsRangeDays(options.rangeDays);
    if (!hasDatabase()) return { ...EMPTY_CATEGORY_SALES_ANALYTICS_SUMMARY, analyticsRangeDays: rangeDays, generatedAt: now };

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
        quantity: true,
        lineTotalCents: true,
        order: {
          select: {
            status: true,
            currency: true,
            createdAt: true
          }
        },
        product: {
          select: {
            category: {
              select: {
                id: true,
                slug: true,
                title: true
              }
            }
          }
        }
      }
    });

    return buildCategorySalesAnalyticsSummary(items.map((item) => ({
      orderId: item.orderId,
      orderStatus: item.order.status,
      currency: item.order.currency,
      categoryId: item.product.category.id,
      categoryTitle: item.product.category.title,
      categorySlug: item.product.category.slug,
      quantity: item.quantity,
      lineTotalCents: item.lineTotalCents,
      createdAt: item.order.createdAt
    })), now, { rangeDays });
  },

  formatRevenueCents
};
