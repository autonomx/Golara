import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  buildBestSellingProductsSummary,
  formatBestSellingRevenue,
  isBestSellingSalesEligibleStatus
} from '../../lib/analytics/best-selling-products';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runBestSellingProductsTests() {
  const service = source('lib/analytics/best-selling-products.ts');
  const panel = source('components/admin/AdminBestSellingProductsPanel.tsx');
  const orderPanel = source('components/admin/AdminOrderRevenueSummaryPanel.tsx');
  const roadmap = source('docs/ADMIN_SALEOR_PARITY_ROADMAP.md');

  assert.equal(isBestSellingSalesEligibleStatus('completed'), true);
  assert.equal(isBestSellingSalesEligibleStatus('cancelled'), false);
  assert.equal(isBestSellingSalesEligibleStatus('refunded'), false);
  assert.equal(formatBestSellingRevenue(12345, 'CAD'), '$123.45');

  const now = new Date('2026-06-02T12:00:00Z');
  const summary = buildBestSellingProductsSummary([
    { id: 'line-1', orderId: 'order-1', productId: 'roses', productTitle: 'Roses', productCode: 'ROS', variantName: 'Red', quantity: 3, lineTotalCents: 9000, createdAt: new Date('2026-06-01T12:00:00Z'), order: { status: 'completed', currency: 'CAD', createdAt: new Date('2026-06-01T12:00:00Z') } },
    { id: 'line-2', orderId: 'order-2', productId: 'roses', productTitle: 'Roses', productCode: 'ROS', variantName: 'White', quantity: 2, lineTotalCents: 6000, createdAt: new Date('2026-05-20T12:00:00Z'), order: { status: 'fulfilled', currency: 'CAD', createdAt: new Date('2026-05-20T12:00:00Z') } },
    { id: 'line-3', orderId: 'order-3', productId: 'lilies', productTitle: 'Lilies', productCode: 'LIL', quantity: 4, lineTotalCents: 8000, createdAt: new Date('2026-04-01T12:00:00Z'), order: { status: 'completed', currency: 'CAD', createdAt: new Date('2026-04-01T12:00:00Z') } },
    { id: 'line-4', orderId: 'order-4', productId: 'orchids', productTitle: 'Orchids', productCode: 'ORC', quantity: 9, lineTotalCents: 45000, createdAt: new Date('2026-05-31T12:00:00Z'), order: { status: 'cancelled', currency: 'CAD', createdAt: new Date('2026-05-31T12:00:00Z') } }
  ], now);

  assert.equal(summary.totalQuantitySold, 9);
  assert.equal(summary.totalRevenueCents, 23000);
  assert.equal(summary.recentQuantitySold, 5);
  assert.equal(summary.recentRevenueCents, 15000);
  assert.equal(summary.products[0].productId, 'roses');
  assert.equal(summary.products[0].quantitySold, 5);
  assert.equal(summary.products[0].orderCount, 2);
  assert.deepEqual(summary.products[0].variantNames, ['Red', 'White']);
  assert.equal(summary.products[1].productId, 'lilies');
  assert.equal(summary.products.find((row) => row.productId === 'orchids'), undefined);

  assert.match(service, /export type BestSellingProductsSummary/);
  assert.match(service, /buildBestSellingProductsSummary/);
  assert.match(service, /bestSellingProductsService = \{/);
  assert.match(service, /prisma\.checkoutOrderItem\.findMany/);
  assert.match(service, /SALES_EXCLUDED_STATUSES/);
  assert.match(service, /orderId: true/);

  assert.match(panel, /export function AdminBestSellingProductsPanel/);
  assert.match(panel, /Best-selling products/);
  assert.match(panel, /checkout line items/);
  assert.match(panel, /No eligible checkout line items/);

  assert.match(orderPanel, /AdminBestSellingProductsPanel/);
  assert.match(orderPanel, /bestSellingProductsService\.summary\(\)/);
  assert.match(orderPanel, /AdminBestSellingProductsPanel summary=\{bestSellingProductsSummary\}/);

  assert.match(roadmap, /- \[x\] Add best-selling products\./);

  console.log('best-selling-products.test.ts passed');
}
