import assert from 'node:assert/strict';
import {
  adminCatalogColumnParam,
  adminCatalogPath,
  adminMediaColumnOptions,
  adminPageSlice,
  adminPaginationHref,
  adminProductColumnOptions,
  adminProductMatchesFlag,
  includesAdminCatalogText,
  parseAdminCatalogColumns
} from '@/lib/admin/admin-catalog-dashboard-helpers';
import type { Product } from '@/lib/catalog';

function makeProduct(overrides: Partial<Product>): Product {
  return {
    slug: 'rose-bouquet',
    title: 'Rose Bouquet',
    description: 'Classic roses',
    code: 'RB-1',
    category: 'roses',
    price: 25,
    currency: 'CAD',
    image: '/rose.jpg',
    availableToday: true,
    bestSeller: false,
    ...overrides
  } as Product;
}

export function runAdminCatalogDashboardHelpersTests() {
  assert.equal(adminCatalogPath('all'), '/admin');
  assert.equal(adminCatalogPath('media'), '/admin/media');
  assert.equal(adminCatalogPath('categories'), '/admin/categories');
  assert.equal(adminCatalogPath('products'), '/admin/products');

  assert.deepEqual(adminPageSlice([1, 2, 3, 4, 5], 2, 2), {
    currentPage: 2,
    pageCount: 3,
    items: [3, 4],
    start: 3,
    end: 4
  });
  assert.deepEqual(adminPageSlice([], 99, 12), {
    currentPage: 1,
    pageCount: 1,
    items: [],
    start: 0,
    end: 0
  });

  assert.equal(adminPaginationHref('/admin/products', 'productPage', 1, { catalogSearch: 'rose' }), '/admin/products?catalogSearch=rose');
  assert.equal(adminPaginationHref('/admin/products', 'productPage', 3, { catalogFlag: 'best-seller' }), '/admin/products?catalogFlag=best-seller&productPage=3');

  assert.deepEqual(parseAdminCatalogColumns('price,unknown', adminProductColumnOptions, ['product', 'actions']), ['product', 'price', 'actions']);
  assert.deepEqual(parseAdminCatalogColumns(undefined, adminMediaColumnOptions, ['image', 'actions']), ['image', 'category', 'belongsTo', 'linkedItem', 'source', 'url', 'actions']);
  assert.equal(adminCatalogColumnParam(['product', 'price', 'actions'], adminProductColumnOptions), 'product,price,actions');
  assert.equal(adminCatalogColumnParam(adminProductColumnOptions.map((option) => option.key), adminProductColumnOptions), undefined);

  assert.equal(includesAdminCatalogText('Classic Rose Bouquet', 'rose'), true);
  assert.equal(includesAdminCatalogText(undefined, 'rose'), false);

  assert.equal(adminProductMatchesFlag(makeProduct({ bestSeller: true }), 'best-seller'), true);
  assert.equal(adminProductMatchesFlag(makeProduct({ availableToday: false }), 'available-today'), false);
  assert.equal(adminProductMatchesFlag(makeProduct({ price: 0 }), 'quote-only'), true);
  assert.equal(adminProductMatchesFlag(makeProduct({ isActive: false }), 'inactive'), true);
  assert.equal(adminProductMatchesFlag(makeProduct({ image: '' }), 'missing-image'), true);
  assert.equal(adminProductMatchesFlag(makeProduct({}), undefined), true);

  console.log('admin-catalog-dashboard-helpers.test.ts passed');
}
