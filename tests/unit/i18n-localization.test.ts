import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DEFAULT_LOCALE, FALLBACK_LOCALE, SUPPORTED_LOCALES, fallbackLocaleOrder, isSupportedLocale, localeDirection, normalizeLocale } from '../../lib/i18n/locales';
import { localizedField, selectPublishedTranslation, selectTranslatedContent } from '../../lib/i18n/translated-content';
import { storefrontCopy } from '../../lib/localization/storefront-copy';
import { customerCopy, getCustomerCopy } from '../../lib/localization/customer-copy';
import { adminCatalogBulkActionLabel, adminCatalogBulkActionKeys, adminCatalogControlLabel } from '../../lib/localization/admin-catalog-control-copy';
import { adminMediaCategoryLabel, adminMediaLocalAssetLabel, adminMediaSeedOrStaticAssetLabel, adminMediaStaticLabel, adminMediaUsageLabel } from '../../lib/localization/admin-media-copy';
import { createAdminRouteErrorTranslator } from '../../lib/localization/admin-route-error-copy';
import { createAdminRouteLoadingTranslator } from '../../lib/localization/admin-route-loading-copy';
import { orderConfirmationPageCopy, orderConfirmationResultCopy } from '../../lib/checkout/order-confirmation-copy';

export async function runI18nLocalizationTests() {
  assert.equal(DEFAULT_LOCALE, 'fa-IR');
  assert.equal(FALLBACK_LOCALE, 'en-CA');
  assert.deepEqual([...SUPPORTED_LOCALES], ['fa-IR', 'en-CA']);
  assert.equal(isSupportedLocale('fa-IR'), true);
  assert.equal(isSupportedLocale('en-CA'), true);
  assert.equal(isSupportedLocale('fa'), false);
  assert.equal(isSupportedLocale('english'), false);

  assert.equal(normalizeLocale(undefined), 'fa-IR');
  assert.equal(normalizeLocale(null), 'fa-IR');
  assert.equal(normalizeLocale('  '), 'fa-IR');
  assert.equal(normalizeLocale('fa'), 'fa-IR');
  assert.equal(normalizeLocale('FA-ir'), 'fa-IR');
  assert.equal(normalizeLocale('persian'), 'fa-IR');
  assert.equal(normalizeLocale('farsi'), 'fa-IR');
  assert.equal(normalizeLocale('en'), 'en-CA');
  assert.equal(normalizeLocale('EN-ca'), 'en-CA');
  assert.equal(normalizeLocale('english'), 'en-CA');
  assert.equal(normalizeLocale('unknown'), 'fa-IR');

  assert.equal(localeDirection('fa-IR'), 'rtl');
  assert.equal(localeDirection('en-CA'), 'ltr');

  assert.deepEqual(fallbackLocaleOrder('fa-IR'), ['fa-IR', 'en-CA']);
  assert.deepEqual(fallbackLocaleOrder('en-CA'), ['en-CA', 'fa-IR']);
  assert.deepEqual(fallbackLocaleOrder('english'), ['en-CA', 'fa-IR']);
  assert.deepEqual(fallbackLocaleOrder(undefined), ['fa-IR', 'en-CA']);
  assert.deepEqual(fallbackLocaleOrder('bad'), ['fa-IR', 'en-CA']);

  assert.deepEqual(Object.keys(storefrontCopy.fa).sort(), Object.keys(storefrontCopy.en).sort());
  for (const [locale, copy] of Object.entries(storefrontCopy)) {
    for (const [key, value] of Object.entries(copy)) {
      assert.equal(typeof value, 'string', `${locale}.${key} should be a string`);
      assert.notEqual(value.trim(), '', `${locale}.${key} should not be blank`);
    }
  }

  assert.deepEqual(Object.keys(customerCopy.fa).sort(), Object.keys(customerCopy.en).sort());
  assert.equal(getCustomerCopy('account.status.signedOut', 'en-CA'), 'You have been signed out.');
  assert.equal(getCustomerCopy('account.status.signedOut', 'fa-IR'), 'از حساب خارج شدید.');
  assert.equal(getCustomerCopy('account.status.sessionRequired', 'fa-IR'), 'برای مشاهده حساب خود وارد شوید.');
  assert.equal(getCustomerCopy('profile.status.updated', 'fa-IR'), 'پروفایل به‌روزرسانی شد.');
  assert.equal(getCustomerCopy('profile.status.failed', 'en-CA'), 'We could not update your profile. Please check the fields and try again.');
  assert.equal(getCustomerCopy('common.cityNotSet', 'fa-IR'), 'شهر تنظیم نشده');

  assert.deepEqual([...adminCatalogBulkActionKeys], [
    'Activate',
    'Deactivate',
    'Mark best seller',
    'Remove best seller',
    'Mark available today',
    'Remove available today',
    'Move to category'
  ]);
  assert.equal(adminCatalogBulkActionLabel('Activate', 'fa-IR'), 'فعال کردن');
  assert.equal(adminCatalogBulkActionLabel('Mark best seller', 'fa-IR'), 'نشانه گذاری به عنوان پرفروش');
  assert.equal(adminCatalogBulkActionLabel('Remove available today', 'fa-IR'), 'حذف نشان موجود امروز');
  assert.equal(adminCatalogBulkActionLabel('Move to category', 'fa-IR'), 'انتقال به دسته');
  assert.equal(adminCatalogControlLabel('Bulk action', 'fa-IR'), 'عملیات گروهی');
  assert.equal(adminCatalogControlLabel('Choose action...', 'fa-IR'), 'انتخاب عملیات...');
  assert.equal(adminCatalogControlLabel('Target category', 'fa-IR'), 'دسته هدف');
  assert.equal(adminCatalogControlLabel('Only needed for move to category.', 'fa-IR'), 'فقط برای انتقال به دسته لازم است.');
  assert.equal(adminCatalogControlLabel('Quick edit visible products', 'fa-IR'), 'ویرایش سریع محصولات قابل مشاهده');
  assert.equal(adminCatalogControlLabel('Save quick edits', 'fa-IR'), 'ذخیره ویرایش های سریع');
  assert.equal(adminCatalogBulkActionLabel('Activate', 'en-CA'), 'Activate');
  assert.equal(adminCatalogControlLabel('Unknown control', 'fa-IR'), 'Unknown control');

  assert.equal(adminMediaCategoryLabel('homepage-banner', 'fa-IR'), 'هیرو صفحه اصلی');
  assert.equal(adminMediaCategoryLabel('unknown', 'fa-IR'), 'عمومی / سایر');
  assert.equal(adminMediaUsageLabel('Homepage best seller', 'fa-IR'), 'پرفروش صفحه اصلی');
  assert.equal(adminMediaUsageLabel('unknown', 'fa-IR'), 'تخصیص نیافته');
  assert.equal(adminMediaLocalAssetLabel('fa-IR'), 'دارایی محلی');
  assert.equal(adminMediaSeedOrStaticAssetLabel('fa-IR'), 'داده نمونه یا دارایی ثابت');
  assert.equal(adminMediaStaticLabel('fa-IR'), 'ثابت');
  assert.equal(adminMediaCategoryLabel('homepage-banner', 'en-CA'), 'Homepage hero');

  const adminErrorFa = createAdminRouteErrorTranslator('fa-IR');
  assert.equal(adminErrorFa('Module error'), 'خطای بخش');
  assert.equal(adminErrorFa('Orders could not load'), 'سفارش ها بارگیری نشدند');
  assert.equal(adminErrorFa('Retry'), 'تلاش دوباره');
  assert.equal(adminErrorFa('Back to overview'), 'بازگشت به نمای کلی');
  assert.equal(adminErrorFa('Unknown error'), 'خطای نامشخص');
  assert.equal(createAdminRouteErrorTranslator('en-CA')('Retry'), 'Retry');
  assert.equal(createAdminRouteErrorTranslator('fa-IR')('Unmapped status'), 'Unmapped status');

  const adminLoadingFa = createAdminRouteLoadingTranslator('fa-IR');
  assert.equal(adminLoadingFa('Operations console'), 'کنسول عملیات');
  assert.equal(adminLoadingFa('Orders'), 'سفارش ها');
  assert.equal(adminLoadingFa('Loading sales'), 'در حال بارگیری فروش');
  assert.equal(adminLoadingFa('Media library'), 'کتابخانه رسانه');
  assert.equal(adminLoadingFa('Loading catalog'), 'در حال بارگیری کاتالوگ');
  assert.equal(createAdminRouteLoadingTranslator('en-CA')('Orders'), 'Orders');
  assert.equal(createAdminRouteLoadingTranslator('fa-IR')('Unmapped loading key'), 'Unmapped loading key');

  const adminRouteErrorSource = readFileSync('components/admin/AdminRouteError.tsx', 'utf8');
  assert.match(adminRouteErrorSource, /STOREFRONT_LOCALE_COOKIE/);
  assert.match(adminRouteErrorSource, /createAdminRouteErrorTranslator\(locale\)/);
  assert.match(adminRouteErrorSource, /t\('Module error'\)/);
  assert.match(adminRouteErrorSource, /t\('Retry'\)/);
  assert.match(adminRouteErrorSource, /t\('Back to overview'\)/);

  const adminRouteLoadingSource = readFileSync('components/admin/AdminRouteLoading.tsx', 'utf8');
  assert.match(adminRouteLoadingSource, /STOREFRONT_LOCALE_COOKIE/);
  assert.match(adminRouteLoadingSource, /createAdminRouteLoadingTranslator\(locale\)/);
  assert.match(adminRouteLoadingSource, /t\('Operations console'\)/);
  assert.match(adminRouteLoadingSource, /t\(eyebrow\)/);
  assert.match(adminRouteLoadingSource, /t\(title\)/);
  assert.doesNotMatch(adminRouteLoadingSource, /'Customer Ops'/);

  const adminMediaCopySource = readFileSync('lib/localization/admin-media-copy.ts', 'utf8');
  assert.match(adminMediaCopySource, /adminMediaCategoryLabel/);
  assert.match(adminMediaCopySource, /adminMediaUsageLabel/);
  assert.match(adminMediaCopySource, /adminMediaLocalAssetLabel/);

  const adminCatalogControlCopySource = readFileSync('lib/localization/admin-catalog-control-copy.ts', 'utf8');
  assert.match(adminCatalogControlCopySource, /adminCatalogBulkActionLabel/);
  assert.match(adminCatalogControlCopySource, /adminCatalogControlLabel/);
  assert.match(adminCatalogControlCopySource, /Mark available today/);

  const paidEnglish = orderConfirmationResultCopy('paid', 'en-CA');
  assert.equal(paidEnglish.title, 'Payment received');
  assert.equal(paidEnglish.tone, 'success');

  const paidPersian = orderConfirmationResultCopy('paid', 'fa-IR');
  assert.equal(paidPersian.title, 'پرداخت دریافت شد');
  assert.equal(paidPersian.tone, 'success');

  const unknownPersian = orderConfirmationResultCopy('unknown-result', 'fa-IR');
  assert.equal(unknownPersian.title, 'سپاسگزاریم');
  assert.equal(unknownPersian.tone, 'info');

  const confirmationPagePersian = orderConfirmationPageCopy('fa-IR');
  assert.equal(confirmationPagePersian.referenceLabel, 'شماره پیگیری');
  assert.equal(confirmationPagePersian.continueShopping, 'ادامه خرید');

  const confirmationPageEnglish = orderConfirmationPageCopy('en-CA');
  assert.equal(confirmationPageEnglish.referenceLabel, 'Reference');
  assert.equal(confirmationPageEnglish.backHome, 'Back home');

  const translations = [
    { locale: 'fa-IR', title: 'رز', description: 'فارسی', isPublished: true },
    { locale: 'en-CA', title: 'Rose', description: 'English', isPublished: true },
    { locale: 'fr-CA', title: 'Rose FR', description: 'French', isPublished: true }
  ];

  assert.deepEqual(selectPublishedTranslation(translations, 'en-CA'), { locale: 'en-CA', translation: translations[1] });
  assert.deepEqual(selectPublishedTranslation(translations, 'fa-IR'), { locale: 'fa-IR', translation: translations[0] });

  const unpublishedEnglish = [
    { locale: 'en-CA', title: 'Draft English', isPublished: false },
    { locale: 'fa-IR', title: 'منتشر شده', isPublished: true }
  ];
  assert.deepEqual(selectPublishedTranslation(unpublishedEnglish, 'en-CA'), { locale: 'fa-IR', translation: unpublishedEnglish[1] });

  const base = { title: 'Legacy title', description: 'Legacy description' };
  const selected = selectTranslatedContent({ translations, base, requestedLocale: 'en' });
  assert.equal(selected.source, 'translation');
  assert.equal(selected.locale, 'en-CA');
  assert.equal(localizedField({ selection: selected, field: 'title' }), 'Rose');

  const missing = selectTranslatedContent({ translations: [], base, requestedLocale: 'en-CA' });
  assert.equal(missing.source, 'legacy-base');
  assert.equal(missing.locale, 'en-CA');
  assert.equal(localizedField({ selection: missing, field: 'title' }), 'Legacy title');

  const blankTranslation = selectTranslatedContent({
    translations: [{ locale: 'en-CA', title: ' ', description: 'Translated description', isPublished: true }],
    base,
    requestedLocale: 'en-CA'
  });
  assert.equal(localizedField({ selection: blankTranslation, field: 'title' }), 'Legacy title');
  assert.equal(localizedField({ selection: blankTranslation, field: 'description' }), 'Translated description');

  console.log('i18n-localization.test.ts passed');
}
