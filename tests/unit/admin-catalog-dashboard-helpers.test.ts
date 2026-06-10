import assert from 'node:assert/strict';
import {
  adminCatalogColumnParam,
  adminCatalogPath,
  adminMediaColumnOptions,
  adminPageSlice,
  adminPaginationHref,
  adminProductColumnOptions,
  includesAdminCatalogText,
  parseAdminCatalogColumns
} from '@/lib/admin/admin-catalog-dashboard-helpers';

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

  assert.equal(adminPaginationHref('/admin/products', 'productPage', 1, { catalogSearch: 'rose' }), '/admin/products?catalogSearch=rose');
  assert.equal(adminPaginationHref('/admin/products', 'productPage', 3, { catalogFlag: 'best-seller' }), '/admin/products?catalogFlag=best-seller&productPage=3');

  assert.deepEqual(parseAdminCatalogColumns('price,unknown', adminProductColumnOptions, ['product', 'actions']), ['product', 'price', 'actions']);
  assert.deepEqual(parseAdminCatalogColumns(undefined, adminMediaColumnOptions, ['image', 'actions']), ['image', 'category', 'belongsTo', 'linkedItem', 'source', 'url', 'actions']);
  assert.equal(adminCatalogColumnParam(['product', 'price', 'actions'], adminProductColumnOptions), 'product,price,actions');
  assert.equal(adminCatalogColumnParam(adminProductColumnOptions.map((option) => option.key), adminProductColumnOptions), undefined);

  assert.equal(includesAdminCatalogText('Classic Rose Bouquet', 'rose'), true);
  assert.equal(includesAdminCatalogText(undefined, 'rose'), false);

  console.log('admin-catalog-dashboard-helpers.test.ts passed');
}
