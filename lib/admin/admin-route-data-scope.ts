export type AdminRouteDataKey =
  | 'categories'
  | 'products'
  | 'productTypes'
  | 'homepage'
  | 'homepageTranslations'
  | 'media'
  | 'inquiryPage'
  | 'inquiryList'
  | 'inquiryCounts'
  | 'auditLogs'
  | 'orderRevenueSummary'
  | 'orderPage'
  | 'authEventSummary'
  | 'adminAccounts'
  | 'adminCustomers'
  | 'fulfillmentMethods'
  | 'storefrontNavigationMenu'
  | 'storeSettings';

export type AdminRouteScope =
  | 'overview'
  | 'products'
  | 'categories'
  | 'media'
  | 'homepage'
  | 'translations'
  | 'orders'
  | 'inquiries'
  | 'customers'
  | 'discounts'
  | 'settings'
  | 'audit'
  | 'staff';

const baseCatalogKeys = ['categories', 'products', 'productTypes', 'media', 'homepage'] as const satisfies readonly AdminRouteDataKey[];

const routeDataScopes: Record<AdminRouteScope, readonly AdminRouteDataKey[]> = {
  overview: [
    'categories',
    'products',
    'media',
    'homepage',
    'inquiryPage',
    'inquiryList',
    'inquiryCounts',
    'auditLogs',
    'orderRevenueSummary',
    'orderPage',
    'authEventSummary',
    'adminAccounts'
  ],
  products: [...baseCatalogKeys],
  categories: [...baseCatalogKeys],
  media: [...baseCatalogKeys],
  homepage: ['homepage', 'categories', 'products', 'media'],
  translations: ['homepage', 'homepageTranslations', 'categories', 'products'],
  orders: ['categories', 'products', 'media', 'orderPage'],
  inquiries: ['categories', 'products', 'media', 'inquiryPage', 'inquiryList', 'inquiryCounts'],
  customers: ['adminCustomers', 'authEventSummary'],
  discounts: [],
  settings: ['storeSettings', 'storefrontNavigationMenu', 'fulfillmentMethods'],
  audit: ['auditLogs'],
  staff: ['adminAccounts']
};

export function getAdminRouteDataScope(scope: AdminRouteScope): readonly AdminRouteDataKey[] {
  return routeDataScopes[scope];
}

export function adminRouteNeedsData(scope: AdminRouteScope, key: AdminRouteDataKey) {
  return routeDataScopes[scope].includes(key);
}

export function uniqueAdminRouteDataKeys(scope: AdminRouteScope): AdminRouteDataKey[] {
  return [...new Set(routeDataScopes[scope])];
}

export function describeAdminRouteDataScope(scope: AdminRouteScope) {
  const keys = uniqueAdminRouteDataKeys(scope);
  return {
    scope,
    keys,
    keyCount: keys.length,
    skipsSettingsReads: !keys.includes('storeSettings') && !keys.includes('storefrontNavigationMenu'),
    skipsSalesReads: !keys.includes('orderPage') && !keys.includes('inquiryPage') && !keys.includes('inquiryList') && !keys.includes('inquiryCounts'),
    skipsCatalogReads: !keys.includes('categories') && !keys.includes('products') && !keys.includes('media')
  };
}
