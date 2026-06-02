import 'server-only';

import type { Product, ProductVariant } from '@/lib/catalog';
import { listAdminProducts } from '@/lib/cms/catalog-repository';
import { getVariantStockSummary, type VariantStockStatus } from '@/lib/inventory/variant-stock-status';

export type LowStockAlertSeverity = 'out_of_stock' | 'low_stock';

export type LowStockAlertRow = {
  productId: string;
  productTitle: string;
  productCode: string;
  variantId: string;
  variantName: string;
  sku: string;
  stockQuantity: number;
  lowStockThreshold?: number;
  status: LowStockAlertSeverity;
  statusLabel: string;
  detail: string;
  canSell: boolean;
};

export type LowStockAlertsSummary = {
  alerts: LowStockAlertRow[];
  trackedVariants: number;
  lowStockVariants: number;
  outOfStockVariants: number;
  untrackedVariants: number;
  inactiveVariants: number;
  generatedAt: Date;
};

export const EMPTY_LOW_STOCK_ALERTS_SUMMARY: LowStockAlertsSummary = {
  alerts: [],
  trackedVariants: 0,
  lowStockVariants: 0,
  outOfStockVariants: 0,
  untrackedVariants: 0,
  inactiveVariants: 0,
  generatedAt: new Date(0)
};

function severityRank(status: LowStockAlertSeverity) {
  return status === 'out_of_stock' ? 0 : 1;
}

function safeStockQuantity(value: number | null | undefined) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

function toAlert(product: Product, variant: ProductVariant, status: LowStockAlertSeverity): LowStockAlertRow {
  const summary = getVariantStockSummary(variant);
  return {
    productId: product.id ?? product.slug,
    productTitle: product.title,
    productCode: product.code,
    variantId: variant.id,
    variantName: variant.name,
    sku: variant.sku,
    stockQuantity: safeStockQuantity(variant.stockQuantity),
    lowStockThreshold: variant.lowStockThreshold,
    status,
    statusLabel: summary.label,
    detail: summary.detail,
    canSell: summary.canSell
  };
}

export function isLowStockAlertStatus(status: VariantStockStatus): status is LowStockAlertSeverity {
  return status === 'out_of_stock' || status === 'low_stock';
}

export function buildLowStockAlertsSummary(products: Product[], now = new Date(), limit = 8): LowStockAlertsSummary {
  const alerts: LowStockAlertRow[] = [];
  let trackedVariants = 0;
  let lowStockVariants = 0;
  let outOfStockVariants = 0;
  let untrackedVariants = 0;
  let inactiveVariants = 0;

  for (const product of products) {
    for (const variant of product.variants ?? []) {
      const summary = getVariantStockSummary(variant);
      if (summary.status === 'inactive') inactiveVariants += 1;
      if (summary.status === 'untracked') untrackedVariants += 1;
      if (variant.isActive && (variant.trackInventory ?? true)) trackedVariants += 1;
      if (summary.status === 'low_stock') lowStockVariants += 1;
      if (summary.status === 'out_of_stock') outOfStockVariants += 1;
      if (isLowStockAlertStatus(summary.status)) alerts.push(toAlert(product, variant, summary.status));
    }
  }

  const safeLimit = Math.max(1, Math.min(25, Math.floor(limit)));
  alerts.sort((a, b) => severityRank(a.status) - severityRank(b.status) || a.stockQuantity - b.stockQuantity || a.productTitle.localeCompare(b.productTitle) || a.variantName.localeCompare(b.variantName));

  return {
    alerts: alerts.slice(0, safeLimit),
    trackedVariants,
    lowStockVariants,
    outOfStockVariants,
    untrackedVariants,
    inactiveVariants,
    generatedAt: now
  };
}

export const lowStockAlertsService = {
  async summary(): Promise<LowStockAlertsSummary> {
    const products = await listAdminProducts();
    return buildLowStockAlertsSummary(products);
  }
};
