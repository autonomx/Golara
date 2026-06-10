import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getAdminRouteLoadingCopy } from '../../lib/localization/admin-route-loading-copy';

const shells = [
  ['app/admin/loading.tsx', 'Overview', 'Loading admin'],
  ['app/admin/categories/loading.tsx', 'Categories', 'Loading catalog'],
  ['app/admin/customers/loading.tsx', 'Customers', 'Loading customer ops'],
  ['app/admin/discounts/loading.tsx', 'Discounts', 'Loading promotions'],
  ['app/admin/inquiries/loading.tsx', 'Inquiries', 'Loading sales'],
  ['app/admin/media/loading.tsx', 'Media library', 'Loading catalog'],
  ['app/admin/orders/loading.tsx', 'Orders', 'Loading sales'],
  ['app/admin/products/loading.tsx', 'Products', 'Loading catalog'],
  ['app/admin/settings/loading.tsx', 'Settings', 'Loading configuration']
] as const;

export async function runAdminLoadShellTests() {
  for (const [filePath, titleKey, eyebrowKey] of shells) {
    const source = readFileSync(filePath, 'utf8');

    assert.match(source, /AdminRouteLoading/);
    assert.match(source, new RegExp(`title="${titleKey}"`));
    assert.match(source, new RegExp(`eyebrow="${eyebrowKey}"`));
    assert.notEqual(getAdminRouteLoadingCopy(titleKey, 'fa-IR'), titleKey);
    assert.notEqual(getAdminRouteLoadingCopy(eyebrowKey, 'fa-IR'), eyebrowKey);
  }

  console.log('admin-load-shells.test.ts passed');
}
