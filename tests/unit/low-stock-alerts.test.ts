import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildLowStockAlertsSummary, isLowStockAlertStatus } from '../../lib/analytics/low-stock-alerts';
import type { Product } from '../../lib/catalog';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runLowStockAlertsTests() {
  const service = source('lib/analytics/low-stock-alerts.ts');
  const panel = source('components/admin/AdminLowStockAlertsPanel.tsx');
  const orderPanel = source('components/admin/AdminOrderRevenueSummaryPanel.tsx');
  const roadmap = source('docs/ADMIN_SALEOR_PARITY_ROADMAP.md');

  assert.equal(isLowStockAlertStatus('low_stock'), true);
  assert.equal(isLowStockAlertStatus('out_of_stock'), true);
  assert.equal(isLowStockAlertStatus('in_stock'), false);
  assert.equal(isLowStockAlertStatus('untracked'), false);

  const products: Product[] = [
    {
      id: 'p1',
      slug: 'roses',
      code: 'ROS',
      title: 'Roses',
      category: 'flowers',
      price: 30,
      currency: 'CAD',
      availableToday: true,
      image: '/roses.jpg',
      description: 'Roses',
      variants: [
        { id: 'v1', productId: 'p1', sku: 'ROS-RED', name: 'Red', price: 30, currency: 'CAD', stockQuantity: 0, trackInventory: true, lowStockThreshold: 3, isActive: true, sortOrder: 1 },
        { id: 'v2', productId: 'p1', sku: 'ROS-WHT', name: 'White', price: 30, currency: 'CAD', stockQuantity: 2, trackInventory: true, lowStockThreshold: 3, isActive: true, sortOrder: 2 },
        { id: 'v3', productId: 'p1', sku: 'ROS-MTO', name: 'Made to order', price: 30, currency: 'CAD', stockQuantity: 0, trackInventory: false, isActive: true, sortOrder: 3 }
      ]
    },
    {
      id: 'p2',
      slug: 'lilies',
      code: 'LIL',
      title: 'Lilies',
      category: 'flowers',
      price: 25,
      currency: 'CAD',
      availableToday: true,
      image: '/lilies.jpg',
      description: 'Lilies',
      variants: [
        { id: 'v4', productId: 'p2', sku: 'LIL-STD', name: 'Standard', price: 25, currency: 'CAD', stockQuantity: 12, trackInventory: true, lowStockThreshold: 3, isActive: true, sortOrder: 1 },
        { id: 'v5', productId: 'p2', sku: 'LIL-OLD', name: 'Old', price: 25, currency: 'CAD', stockQuantity: 0, trackInventory: true, lowStockThreshold: 3, isActive: false, sortOrder: 2 }
      ]
    }
  ];
  const summary = buildLowStockAlertsSummary(products, new Date('2026-06-02T12:00:00Z'));

  assert.equal(summary.trackedVariants, 3);
  assert.equal(summary.outOfStockVariants, 1);
  assert.equal(summary.lowStockVariants, 1);
  assert.equal(summary.untrackedVariants, 1);
  assert.equal(summary.inactiveVariants, 1);
  assert.equal(summary.alerts.length, 2);
  assert.equal(summary.alerts[0].status, 'out_of_stock');
  assert.equal(summary.alerts[0].canSell, false);
  assert.equal(summary.alerts.find((row) => row.variantId === 'v2')?.status, 'low_stock');
  assert.equal(summary.alerts.find((row) => row.variantId === 'v5'), undefined);

  assert.match(service, /export type LowStockAlertsSummary/);
  assert.match(service, /buildLowStockAlertsSummary/);
  assert.match(service, /lowStockAlertsService = \{/);
  assert.match(service, /listAdminProducts\(\)/);
  assert.match(service, /getVariantStockSummary/);

  assert.match(panel, /export function AdminLowStockAlertsPanel/);
  assert.match(panel, /Low-stock alerts/);
  assert.match(panel, /Out of stock/);
  assert.match(panel, /No low-stock or out-of-stock tracked variants/);

  assert.match(orderPanel, /AdminLowStockAlertsPanel/);
  assert.match(orderPanel, /lowStockAlertsService\.summary\(\)/);
  assert.match(orderPanel, /AdminLowStockAlertsPanel summary=\{lowStockAlertsSummary\}/);

  assert.match(roadmap, /- \[x\] Add low-stock alerts\./);

  console.log('low-stock-alerts.test.ts passed');
}
