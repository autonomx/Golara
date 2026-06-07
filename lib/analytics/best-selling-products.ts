import 'server-only';

import { hasDatabase, prisma } from '@/lib/prisma';

export type BestSellingProductSourceRow = {
  id: string;
  orderId: string;
  productId: string | null;
  variantId?: string | null;
  productTitle: string;
  productCode?: string | null;
  variantName?: string | null;
  quantity: number;
  lineTotalCents: number;
  createdAt: Date;
  order: {
    status: string;
    currency: string;
    createdAt: Date;
  };
};

export type BestSellingProductRow = {
  productId: string;
  productTitle: string;
  productCode?: string;
  quantitySold: number;
  orderCount: number;
  revenueCents: number;
  recentQuantitySold: number;
  recentRevenueCents: number;
  currency: string;
  variantNames: string[];
};

export type BestSellingProductsSummary = {
  products: BestSellingProductRow[];
  totalQuantitySold: number;
  totalRevenueCents: number;
  recentQuantitySold: number;
  recentRevenueCents: number;
  generatedAt: Date;
};

const SALES_EXCLUDED_STATUSES = new Set(['cancelled', 'canceled', 'refunded', 'voided']);

export const EMPTY_BEST_SELLING_PRODUCTS_SUMMARY: BestSellingProductsSummary = {
  products: [],
  totalQuantitySold: 0,
  totalRevenueCents: 0,
  recentQuantitySold: 0,
  recentRevenueCents: 0,
  generatedAt: new Date(0)
};

function normalizeStatus(value?: string | null) {
  return value?.trim().toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'unknown';
}

function normalizeCurrency(value?: string | null) {
  const normalized = value?.trim().toUpperCase().replace(/[^A-Z]/g, '');
  return normalized || 'CAD';
}

function normalizeQuantity(value?: number | null) {
  if (!Number.isFinite(value ?? NaN)) return 0;
  return Math.max(0, Math.trunc(value ?? 0));
}

function normalizeCents(value?: number | null) {
  if (!Number.isFinite(value ?? NaN)) return 0;
  return Math.max(0, Math.trunc(value ?? 0));
}

export function isBestSellingSalesEligibleStatus(status: string) {
  return !SALES_EXCLUDED_STATUSES.has(normalizeStatus(status));
}

export function formatBestSellingRevenue(value: number, currency = 'CAD') {
  const amount = normalizeCents(value) / 100;
  const normalizedCurrency = normalizeCurrency(currency);
  try {
    return new Intl.NumberFormat('en-CA', { style: 'currency', currency: normalizedCurrency }).format(amount);
  } catch (error) {
    if (error instanceof RangeError) return `${amount.toFixed(2)} ${normalizedCurrency}`;
    throw error;
  }
}

export function buildBestSellingProductsSummary(rows: BestSellingProductSourceRow[], now = new Date(), limit = 5): BestSellingProductsSummary {
  const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const buckets = new Map<string, BestSellingProductRow & { orderIds: Set<string>; variants: Set<string> }>();
  let totalQuantitySold = 0;
  let totalRevenueCents = 0;
  let recentQuantitySold = 0;
  let recentRevenueCents = 0;

  for (const row of rows) {
    if (!isBestSellingSalesEligibleStatus(row.order.status)) continue;
    const quantity = normalizeQuantity(row.quantity);
    const revenueCents = normalizeCents(row.lineTotalCents);
    const productId = row.productId?.trim() || row.productTitle.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || row.id;
    const currency = normalizeCurrency(row.order.currency);
    const existing = buckets.get(productId) ?? {
      productId,
      productTitle: row.productTitle,
      productCode: row.productCode?.trim() || undefined,
      quantitySold: 0,
      orderCount: 0,
      revenueCents: 0,
      recentQuantitySold: 0,
      recentRevenueCents: 0,
      currency,
      variantNames: [],
      orderIds: new Set<string>(),
      variants: new Set<string>()
    };

    existing.quantitySold += quantity;
    existing.revenueCents += revenueCents;
    existing.orderIds.add(row.orderId);
    if (row.variantName?.trim()) existing.variants.add(row.variantName.trim());
    if (row.order.createdAt >= cutoff || row.createdAt >= cutoff) {
      existing.recentQuantitySold += quantity;
      existing.recentRevenueCents += revenueCents;
      recentQuantitySold += quantity;
      recentRevenueCents += revenueCents;
    }
    totalQuantitySold += quantity;
    totalRevenueCents += revenueCents;
    buckets.set(productId, existing);
  }

  const products = Array.from(buckets.values())
    .map(({ orderIds, variants, ...row }) => ({ ...row, orderCount: orderIds.size, variantNames: Array.from(variants).sort((a, b) => a.localeCompare(b)) }))
    .sort((a, b) => b.quantitySold - a.quantitySold || b.revenueCents - a.revenueCents || a.productTitle.localeCompare(b.productTitle))
    .slice(0, Math.max(1, Math.min(20, Math.floor(limit))));

  return {
    products,
    totalQuantitySold,
    totalRevenueCents,
    recentQuantitySold,
    recentRevenueCents,
    generatedAt: now
  };
}

export const bestSellingProductsService = {
  async summary(): Promise<BestSellingProductsSummary> {
    if (!hasDatabase()) return { ...EMPTY_BEST_SELLING_PRODUCTS_SUMMARY, generatedAt: new Date() };

    const rows = await prisma.checkoutOrderItem.findMany({
      orderBy: { createdAt: 'desc' },
      take: 1000,
      select: {
        id: true,
        orderId: true,
        productId: true,
        variantId: true,
        productTitle: true,
        productCode: true,
        variantName: true,
        quantity: true,
        lineTotalCents: true,
        createdAt: true,
        order: {
          select: {
            status: true,
            currency: true,
            createdAt: true
          }
        }
      }
    });

    return buildBestSellingProductsSummary(rows);
  }
};
