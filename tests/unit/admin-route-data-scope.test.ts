import { strict as assert } from 'node:assert';
import { readFileSync } from 'node:fs';
import {
  adminRouteNeedsData,
  describeAdminRouteDataScope,
  getAdminRouteDataScope,
  uniqueAdminRouteDataKeys,
  type AdminRouteDataKey,
  type AdminRouteScope
} from '@/lib/admin/admin-route-data-scope';

const source = readFileSync('lib/admin/admin-route-data-scope.ts', 'utf8');

const allScopes: AdminRouteScope[] = [
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
];

for (const scope of allScopes) {
  const keys = getAdminRouteDataScope(scope);
  assert.deepEqual(uniqueAdminRouteDataKeys(scope), [...new Set(keys)], `${scope} should return stable unique keys`);
}

const productScope = describeAdminRouteDataScope('products');
assert.equal(productScope.skipsSettingsReads, true, 'products should not load store settings/navigation');
assert.equal(productScope.skipsSalesReads, true, 'products should not load order or inquiry data');
assert.equal(adminRouteNeedsData('products', 'products'), true);
assert.equal(adminRouteNeedsData('products', 'storeSettings'), false);
assert.equal(adminRouteNeedsData('products', 'orderPage'), false);
assert.equal(adminRouteNeedsData('products', 'inquiryPage'), false);

const settingsScope = getAdminRouteDataScope('settings');
assert.deepEqual(settingsScope, ['storeSettings', 'storefrontNavigationMenu', 'fulfillmentMethods'] satisfies AdminRouteDataKey[]);
assert.equal(adminRouteNeedsData('settings', 'products'), false, 'settings should not load product catalog rows');
assert.equal(adminRouteNeedsData('settings', 'orderPage'), false, 'settings should not load orders');
assert.equal(adminRouteNeedsData('settings', 'inquiryPage'), false, 'settings should not load inquiries');

const ordersScope = getAdminRouteDataScope('orders');
assert.ok(ordersScope.includes('orderPage'), 'orders should load order page data');
assert.ok(!ordersScope.includes('adminCustomers'), 'orders should not load the full customer list');
assert.ok(!ordersScope.includes('storeSettings'), 'orders should not load store settings');
assert.ok(!ordersScope.includes('storefrontNavigationMenu'), 'orders should not load storefront navigation settings');

const customersScope = describeAdminRouteDataScope('customers');
assert.equal(customersScope.skipsCatalogReads, true, 'customers should not load catalog rows');
assert.equal(customersScope.skipsSalesReads, true, 'customers should not load order/inquiry rows');
assert.equal(adminRouteNeedsData('customers', 'adminCustomers'), true);
assert.equal(adminRouteNeedsData('customers', 'authEventSummary'), true);

for (const forbidden of ['prisma.', 'process.env', 'fetch(', 'listAdminProducts(', 'listAdminCheckoutOrderPage(']) {
  assert.ok(!source.includes(forbidden), `route data scope planner should stay pure and not include ${forbidden}`);
}

console.log('admin route data scope guard passed');
