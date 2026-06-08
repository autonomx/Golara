import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

function includes(content: string, expected: string, message: string) {
  assert.ok(content.includes(expected), message);
}

{
  const files = [
    'components/admin/AdminBestSellingProductsPanel.tsx',
    'components/admin/AdminLowStockAlertsPanel.tsx',
    'components/admin/AdminFulfillmentQueueSummaryPanel.tsx',
    'components/admin/AdminFailedPaymentNotificationAlertsPanel.tsx',
    'components/admin/AdminLaunchReadinessHealthPanel.tsx'
  ];

  for (const file of files) {
    const content = source(file);
    includes(content, 'fa:', `${file} should expose Farsi copy`);
    includes(content, 'locale?: SupportedLocale', `${file} should accept a locale prop`);
    includes(content, 'localeKey(locale)', `${file} should resolve copy through localeKey`);
  }
}

{
  const content = source('components/admin/AdminOrderPanel.tsx');
  includes(content, 'fa:', 'AdminOrderPanel should expose Farsi copy');
  includes(content, 'resolveStorefrontLocale', 'AdminOrderPanel should resolve the active locale');
  includes(content, 'export async function AdminOrderPanel', 'AdminOrderPanel should stay async for locale resolution');
  includes(content, 'activeLocale', 'AdminOrderPanel should use the resolved active locale');
  includes(content, 'عملیات سفارش', 'AdminOrderPanel should include Farsi order copy');
}

{
  const content = source('components/admin/AdminCustomerPanel.tsx');
  includes(content, 'fa:', 'AdminCustomerPanel should expose Farsi copy');
  includes(content, 'resolveStorefrontLocale', 'AdminCustomerPanel should resolve the active locale');
  includes(content, 'export async function AdminCustomerPanel', 'AdminCustomerPanel should stay async for locale resolution');
  includes(content, 'پروفایل‌های مشتری', 'AdminCustomerPanel should include Farsi customer copy');
}

{
  const content = source('components/admin/AdminStoreSettingsPanel.tsx');
  includes(content, 'fa:', 'AdminStoreSettingsPanel should expose Farsi copy');
  includes(content, 'locale?: SupportedLocale', 'AdminStoreSettingsPanel should accept a locale prop');
  includes(content, 'export function AdminStoreSettingsPanel', 'AdminStoreSettingsPanel should keep a sync export');
  includes(content, 'تنظیمات فروشگاه', 'AdminStoreSettingsPanel should include Farsi settings copy');
}

{
  const files = [
    'components/admin/InquiryContactActions.tsx',
    'components/admin/InquiryDeliveryBadge.tsx',
    'components/admin/InquiryEmptyState.tsx',
    'components/admin/InquiryFollowUpSummary.tsx'
  ];

  for (const file of files) {
    const content = source(file);
    includes(content, 'fa:', `${file} should expose Farsi copy`);
    includes(content, 'resolveStorefrontLocale', `${file} should resolve the active locale`);
    includes(content, 'locale?: SupportedLocale', `${file} should accept a locale prop`);
  }
}

{
  const content = source('lib/localization/catalog-seed-fallback.ts');
  includes(content, 'localizeSeedCategories', 'seed fallback helper should expose category localization');
  includes(content, 'localizeSeedProducts', 'seed fallback helper should expose product localization');
  includes(content, 'باکس گل', 'seed fallback helper should include Farsi category copy');
  includes(content, 'دسته‌گل', 'seed fallback helper should include Farsi bouquet copy');
  includes(content, 'چیدمان', 'seed fallback helper should include Farsi product copy');
}
