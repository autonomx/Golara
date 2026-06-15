import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import { adminRouteLoadPlanKeys, buildAdminRouteLoadPlan, loadedAdminRouteDataKeys, skippedAdminRouteDataKeys, summarizeAdminRouteLoadPlan } from '@/lib/admin/admin-route-load-plan';
import { uniqueAdminRouteDataKeys, type AdminRouteScope } from '@/lib/admin/admin-route-data-scope';

const allScopes = [
  'overview',
  'products',
  'categories',
  'media',
  'homepage',
  'translations',
  'orders',
  'inquiries',
  'customers',
  'discounts',
  'settings',
  'audit',
  'staff'
] as const satisfies readonly AdminRouteScope[];

for (const scope of allScopes) {
  const plan = buildAdminRouteLoadPlan(scope);
  assert.equal(plan.length, adminRouteLoadPlanKeys.length, `${scope} should have one plan entry for every admin data key`);
  assert.deepEqual(loadedAdminRouteDataKeys(scope), uniqueAdminRouteDataKeys(scope), `${scope} loaded keys should match route data scope`);
  for (const entry of plan) {
    assert.ok(entry.fallback.length > 16, `${scope}.${entry.key} should document the fallback used when skipped`);
  }
}

assert.deepEqual(skippedAdminRouteDataKeys('products').filter((key) => ['orderPage', 'inquiryPage', 'inquiryList', 'storeSettings', 'storefrontNavigationMenu'].includes(key)), [
  'inquiryPage',
  'inquiryList',
  'orderPage',
  'storefrontNavigationMenu',
  'storeSettings'
]);

const productSummary = summarizeAdminRouteLoadPlan('products');
assert.equal(productSummary.avoidsSettingsReads, true, 'products should skip settings reads');
assert.equal(productSummary.avoidsSalesReads, true, 'products should skip sales reads');
assert.equal(productSummary.avoidsCatalogReads, false, 'products still needs catalog reads');

const settingsSummary = summarizeAdminRouteLoadPlan('settings');
assert.equal(settingsSummary.avoidsCatalogReads, true, 'settings should skip catalog reads');
assert.equal(settingsSummary.avoidsSalesReads, true, 'settings should skip sales reads');
assert.equal(settingsSummary.avoidsSettingsReads, false, 'settings should load settings reads');

const ordersSummary = summarizeAdminRouteLoadPlan('orders');
assert.ok(ordersSummary.loaded.includes('orderPage'), 'orders should load order page data');
assert.ok(!ordersSummary.loaded.includes('inquiryPage'), 'orders should not load inquiry page data');
assert.ok(!ordersSummary.loaded.includes('storeSettings'), 'orders should not load store settings');

const source = readFileSync('lib/admin/admin-route-load-plan.ts', 'utf8');
for (const forbidden of ['prisma.', 'process.env', 'fetch(', 'listAdminProducts(', 'listAdminCheckoutOrderPage(', 'storeSettingsService.get(']) {
  assert.ok(!source.includes(forbidden), `load-plan helper must stay pure and avoid runtime data calls: ${forbidden}`);
}

console.log('admin-route-load-plan.test.ts passed');
