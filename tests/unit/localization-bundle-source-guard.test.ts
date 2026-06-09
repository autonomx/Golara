import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

function includes(content: string, expected: string, message: string) {
  assert.ok(content.includes(expected), message);
}

export function runLocalizationBundleSourceGuardTests() {
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

{
  const content = source('lib/cms/catalog-repository.ts');
  includes(content, "import { localizeSeedCategories, localizeSeedProducts } from '@/lib/localization/catalog-seed-fallback';", 'catalog repository should import seed fallback localization helpers');
  includes(content, 'localizeSeedCategories([...seedCategories].filter((category) => category.isActive !== false).sort(bySortThenTitle), options.locale)', 'public category fallback should localize seed categories');
  includes(content, 'localizeSeedCategories([...seedCategories].filter((category) => category.isActive !== false && category.showOnHomepage !== false).sort(bySortThenTitle), options.locale)', 'public homepage category fallback should localize seed categories');
  includes(content, 'localizeSeedProducts(seedProducts.filter((product) => product.isActive !== false), options.locale, seedCategories)', 'public product fallback should localize seed products');
  includes(content, 'localizeSeedProducts(seedProducts.filter((product) => product.slug === slug && product.isActive !== false), options.locale, seedCategories)[0]', 'public product detail fallback should localize seed products');
  includes(content, 'localizeSeedProducts(seedProducts.filter((product) => product.category === slug && product.isActive !== false), options.locale, seedCategories)', 'public category product fallback should localize seed products');
  includes(content, '}, () => [...seedCategories].sort(bySortThenTitle));', 'admin category fallback should remain raw seed categories');
  includes(content, '}, () => seedProducts);', 'admin product fallback should remain raw seed products');
}

{
  const pages = [
    ['app/page.tsx', "title: `${firstNonEmpty(homepage.title, 'Golara')} | Golara`", "description: firstNonEmpty(homepage.body, getStorefrontCopy('home.footerBody', locale))"],
    ['app/products/page.tsx', "title: `${getStorefrontCopy('catalog.title', locale)} | Golara`", "description: getStorefrontCopy('catalog.body', locale)"],
    ['app/categories/page.tsx', "title: `${getStorefrontCopy('categories.title', locale)} | Golara`", "description: getStorefrontCopy('categories.body', locale)"],
    ['app/products/[slug]/page.tsx', 'const product = await getProductBySlug(slug, { locale });', 'product.seoTitle || `${product.title} | Golara`'],
    ['app/categories/[slug]/page.tsx', 'const category = await getCategoryBySlug(slug, { locale });', 'title: `${category.title} | Golara`']
  ] as const;

  for (const [file, titleGuard, descriptionGuard] of pages) {
    const content = source(file);
    includes(content, 'export async function generateMetadata', `${file} should generate metadata dynamically`);
    includes(content, 'resolveStorefrontLocale', `${file} should resolve locale for metadata`);
    includes(content, titleGuard, `${file} should use localized metadata titles`);
    includes(content, descriptionGuard, `${file} should use localized metadata descriptions`);
  }
}

{
  const content = source('app/layout.tsx');
  includes(content, 'export default async function RootLayout', 'root layout should resolve locale for html lang');
  includes(content, 'const locale = await resolveStorefrontLocale();', 'root layout should resolve storefront locale');
  includes(content, '<html lang={locale}>', 'root layout should expose the active locale in html lang');
}

{
  const content = source('app/admin/AdminConsolePage.tsx');
  includes(content, "import { LanguageSwitcher } from '@/components/LanguageSwitcher';", 'admin console should reuse the storefront language switcher');
  includes(content, 'function adminReturnPath', 'admin console should build a return path for locale switching');
  includes(content, '<LanguageSwitcher locale={locale} returnTo={returnTo} />', 'admin top bar should render the locale switcher');
  includes(content, 'returnTo={languageReturnTo}', 'admin console should keep locale switching on the active admin page');
  includes(content, 'locale={locale}', 'admin console should pass active locale into child admin modules');
}

{
  const content = source('lib/localization/admin-copy.ts');
  includes(content, 'export function createAdminTranslator', 'admin copy helper should expose a reusable translator');
  includes(content, 'export function adminLocaleKey', 'admin copy helper should centralize locale key selection');
  includes(content, "'Payment settlement':", 'admin copy helper should include standalone payment page copy');
}

{
  const content = source('lib/checkout/order-confirmation-copy.ts');
  includes(content, "type OrderConfirmationLocaleKey = 'en' | 'fa';", 'order confirmation copy should support explicit locale keys');
  includes(content, 'پرداخت دریافت شد', 'order confirmation copy should include Persian paid-result copy');
  includes(content, 'شماره پیگیری', 'order confirmation page copy should include Persian reference copy');
  includes(content, 'export function orderConfirmationPageCopy', 'order confirmation page copy should be exported for localized page chrome');
}

{
  const content = source('app/orders/confirmation/page.tsx');
  includes(content, 'resolveStorefrontLocale', 'order confirmation page should resolve storefront locale');
  includes(content, 'orderConfirmationResultCopy(result, locale)', 'order confirmation page should request localized result copy');
  includes(content, 'orderConfirmationPageCopy(locale)', 'order confirmation page should request localized page copy');
  includes(content, 'dir={localeDirection(locale)}', 'order confirmation page should set direction from locale');
}

{
  const files = [
    'components/admin/AdminDashboard.tsx',
    'components/admin/AdminReadinessPanel.tsx',
    'components/admin/AdminSecurityPanel.tsx',
    'components/admin/AdminActionBanner.tsx',
    'components/admin/AdminTranslationPanel.tsx',
    'components/admin/InquiryBoard.tsx',
    'components/admin/AdminFulfillmentSettingsPanel.tsx',
    'components/admin/AdminModulePlaceholder.tsx',
    'app/admin/payments/settlement/page.tsx',
    'app/admin/payments/alerts/page.tsx'
  ];

  for (const file of files) {
    const content = source(file);
    includes(content, 'createAdminTranslator', `${file} should use the shared admin translator`);
  }
}

  console.log('localization-bundle-source-guard.test.ts passed');
}
