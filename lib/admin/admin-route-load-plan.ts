import { adminRouteNeedsData, uniqueAdminRouteDataKeys, type AdminRouteDataKey, type AdminRouteScope } from '@/lib/admin/admin-route-data-scope';

export type AdminRouteLoadPlanEntry = {
  key: AdminRouteDataKey;
  load: boolean;
  fallback: string;
};

const fallbackDescriptions: Record<AdminRouteDataKey, string> = {
  categories: 'empty category list for routes that do not render catalog category UI',
  products: 'empty product list for routes that do not render catalog/product UI',
  productTypes: 'empty product-type list for routes that do not render product type controls',
  homepage: 'seed homepage content for routes that do not render homepage editing UI',
  homepageTranslations: 'empty homepage translation list for routes that do not render translation UI',
  media: 'empty media list for routes that do not render image/media UI',
  inquiryPage: 'empty inquiry page object for routes that do not render inquiry tables',
  inquiryList: 'empty inquiry source list for routes that do not compute assignment queues',
  inquiryCounts: 'empty inquiry status counts for routes that do not show inquiry badges',
  auditLogs: 'empty audit list for routes that do not render audit logs',
  orderRevenueSummary: 'empty order revenue summary for routes that do not render overview revenue',
  orderPage: 'empty order page object for routes that do not render order tables',
  authEventSummary: 'empty auth event summary for routes that do not render customer auth diagnostics',
  adminAccounts: 'empty admin account list for routes that do not render staff readiness',
  adminCustomers: 'empty customer list for routes that do not render customer tables',
  fulfillmentMethods: 'empty fulfillment method list for routes that do not render fulfillment settings',
  storefrontNavigationMenu: 'default storefront navigation menu for routes that do not render navigation settings',
  storeSettings: 'default store settings for routes that do not render store settings'
};

export const adminRouteLoadPlanKeys: readonly AdminRouteDataKey[] = [
  'categories',
  'products',
  'productTypes',
  'homepage',
  'homepageTranslations',
  'media',
  'inquiryPage',
  'inquiryList',
  'inquiryCounts',
  'auditLogs',
  'orderRevenueSummary',
  'orderPage',
  'authEventSummary',
  'adminAccounts',
  'adminCustomers',
  'fulfillmentMethods',
  'storefrontNavigationMenu',
  'storeSettings'
] as const;

export function buildAdminRouteLoadPlan(scope: AdminRouteScope): AdminRouteLoadPlanEntry[] {
  return adminRouteLoadPlanKeys.map((key) => ({
    key,
    load: adminRouteNeedsData(scope, key),
    fallback: fallbackDescriptions[key]
  }));
}

export function loadedAdminRouteDataKeys(scope: AdminRouteScope): AdminRouteDataKey[] {
  return buildAdminRouteLoadPlan(scope)
    .filter((entry) => entry.load)
    .map((entry) => entry.key);
}

export function skippedAdminRouteDataKeys(scope: AdminRouteScope): AdminRouteDataKey[] {
  return buildAdminRouteLoadPlan(scope)
    .filter((entry) => !entry.load)
    .map((entry) => entry.key);
}

export function summarizeAdminRouteLoadPlan(scope: AdminRouteScope) {
  const loaded = loadedAdminRouteDataKeys(scope);
  const skipped = skippedAdminRouteDataKeys(scope);
  return {
    scope,
    loaded,
    skipped,
    loadedCount: loaded.length,
    skippedCount: skipped.length,
    expectedLoaded: uniqueAdminRouteDataKeys(scope),
    avoidsSettingsReads: skipped.includes('storeSettings') && skipped.includes('storefrontNavigationMenu'),
    avoidsSalesReads: skipped.includes('orderPage') && skipped.includes('inquiryPage') && skipped.includes('inquiryList') && skipped.includes('inquiryCounts'),
    avoidsCatalogReads: skipped.includes('categories') && skipped.includes('products') && skipped.includes('media')
  };
}
