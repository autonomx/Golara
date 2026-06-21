import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildAdminTodayCards } from '../../lib/admin/admin-today-cards';
import type { CheckoutOrderSummary, Product } from '../../lib/catalog';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

const baseProduct = {
  id: 'p1',
  slug: 'rose-box',
  code: 'RBX',
  title: 'Rose box',
  category: 'flowers',
  price: 120,
  currency: 'CAD',
  availableToday: true,
  image: '/rose.jpg',
  description: 'Rose box'
} satisfies Product;

const baseOrder = {
  id: 'o1',
  orderNumber: '1001',
  status: 'paid',
  checkoutMode: 'gateway',
  fulfillmentStatus: 'pending',
  currency: 'CAD',
  totalCents: 12000,
  itemCount: 1,
  latestPaymentStatus: 'succeeded'
} satisfies CheckoutOrderSummary;

export async function runAdminTodayCardsTests() {
  const cards = buildAdminTodayCards({
    products: [
      baseProduct,
      { ...baseProduct, id: 'p2', slug: 'draft', code: 'DRF', image: '', isActive: false },
      { ...baseProduct, id: 'p3', slug: 'quote', code: 'QTE', requiresQuote: true },
      {
        ...baseProduct,
        id: 'p4',
        slug: 'low-stock',
        code: 'LOW',
        variants: [{ id: 'v1', productId: 'p4', sku: 'LOW-STD', name: 'Standard', price: 120, currency: 'CAD', stockQuantity: 1, trackInventory: true, lowStockThreshold: 2, isActive: true, sortOrder: 1 }]
      }
    ],
    orders: [baseOrder, { ...baseOrder, id: 'o2', orderNumber: '1002', fulfillmentStatus: 'delivered' }, { ...baseOrder, id: 'o3', orderNumber: '1003', latestPaymentStatus: 'failed', latestPaymentRequiresManualReview: true }],
    orderTotalCount: 3,
    inquiryStatusCounts: [{ status: 'new', count: 4 }, { status: 'contacted', count: 1 }],
    runtimeReadiness: { databaseUrlPresent: false, productionSafe: false },
    checkoutReadiness: { ready: false, blockers: [{ code: 'missing', severity: 'blocker', summary: 'Missing key', detail: 'Set key' }], warnings: [{ code: 'warn', severity: 'warning', summary: 'Warning', detail: 'Review' }] }
  });

  assert.equal(cards[0].id, 'readiness-blockers');
  assert.equal(cards.find((card) => card.id === 'readiness-blockers')?.count, 3);
  assert.equal(cards.find((card) => card.id === 'payment-alerts')?.count, 1);
  assert.equal(cards.find((card) => card.id === 'orders-needing-fulfillment')?.count, 2);
  assert.equal(cards.find((card) => card.id === 'new-inquiries')?.href, '/admin/inquiries?inquiryStatus=new');
  assert.equal(cards.find((card) => card.id === 'missing-product-images')?.count, 1);
  assert.equal(cards.find((card) => card.id === 'inactive-products')?.count, 1);
  assert.equal(cards.find((card) => card.id === 'quote-only-products')?.count, 1);
  assert.equal(cards.find((card) => card.id === 'inventory-pressure')?.count, 1);

  const allClear = buildAdminTodayCards({
    products: [baseProduct],
    orders: [{ ...baseOrder, fulfillmentStatus: 'delivered' }],
    inquiryStatusCounts: [],
    runtimeReadiness: { databaseUrlPresent: true, productionSafe: true },
    checkoutReadiness: { ready: true, blockers: [], warnings: [] }
  });
  assert.deepEqual(allClear.map((card) => card.id), ['all-clear']);

  const page = source('app/admin/page.tsx');
  const panel = source('components/admin/AdminTodayCommandCenter.tsx');
  const roadmap = source('docs/ADMIN_UX_ROADMAP.md');

  assert.match(page, /buildAdminTodayCards/);
  assert.match(page, /AdminTodayCommandCenter/);
  assert.match(panel, /Today/);
  assert.match(panel, /Command center/);
  assert.match(roadmap, /Phase 11: Today command center/);

  console.log('admin-today-cards.test.ts passed');
}
