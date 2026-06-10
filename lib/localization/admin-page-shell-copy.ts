import type { SupportedLocale } from '@/lib/i18n/locales';
import { adminLocaleKey } from '@/lib/localization/admin-copy';

const en = {
  'Admin workspaces': 'Admin workspaces',
  'Audit log': 'Audit log',
  Catalog: 'Catalog',
  Categories: 'Categories',
  'Configure auth': 'Configure auth',
  Content: 'Content',
  Customers: 'Customers',
  Discounts: 'Discounts',
  Homepage: 'Homepage',
  Inquiries: 'Inquiries',
  'Media library': 'Media library',
  'Operations console': 'Operations console',
  Orders: 'Orders',
  Overview: 'Overview',
  Products: 'Products',
  Readiness: 'Readiness',
  Sales: 'Sales',
  Settings: 'Settings',
  'Sign in': 'Sign in',
  'Signed in': 'Signed in',
  'Staff access': 'Staff access',
  Translations: 'Translations',
  'Payment alerts': 'Payment alerts',
  'Payment settlement': 'Payment settlement',
  'Store configuration, staff access, and providers.': 'Store configuration, staff access, and providers.',
  'Products, categories, subcategories, and media.': 'Products, categories, subcategories, and media.',
  'Orders and customer inquiries.': 'Orders and customer inquiries.',
  'Profiles, addresses, accounts, and activity.': 'Profiles, addresses, accounts, and activity.',
  'Vouchers, campaigns, and gift-card planning.': 'Vouchers, campaigns, and gift-card planning.',
  'Readiness, access, audit, and security.': 'Readiness, access, audit, and security.',
  'Homepage copy and translations.': 'Homepage copy and translations.',
  product: 'product',
  products: 'products',
  category: 'category',
  categories: 'categories',
  media: 'media'
} as const;

const fa: Record<keyof typeof en, string> = {
  'Admin workspaces': 'بخش‌های مدیریت',
  'Audit log': 'گزارش ممیزی',
  Catalog: 'کاتالوگ',
  Categories: 'دسته‌بندی‌ها',
  'Configure auth': 'تنظیم احراز هویت',
  Content: 'محتوا',
  Customers: 'مشتریان',
  Discounts: 'تخفیف‌ها',
  Homepage: 'صفحه اصلی',
  Inquiries: 'درخواست‌ها',
  'Media library': 'کتابخانه رسانه',
  'Operations console': 'کنسول عملیات',
  Orders: 'سفارش‌ها',
  Overview: 'نمای کلی',
  Products: 'محصولات',
  Readiness: 'آمادگی',
  Sales: 'فروش',
  Settings: 'تنظیمات',
  'Sign in': 'ورود',
  'Signed in': 'وارد شده',
  'Staff access': 'دسترسی تیم',
  Translations: 'ترجمه‌ها',
  'Payment alerts': 'هشدارهای پرداخت',
  'Payment settlement': 'تسویه پرداخت',
  'Store configuration, staff access, and providers.': 'پیکربندی فروشگاه، دسترسی تیم و ارائه‌دهندگان.',
  'Products, categories, subcategories, and media.': 'محصولات، دسته‌بندی‌ها، زیرمجموعه‌ها و رسانه‌ها.',
  'Orders and customer inquiries.': 'سفارش‌ها و درخواست‌های مشتریان.',
  'Profiles, addresses, accounts, and activity.': 'پروفایل‌ها، نشانی‌ها، حساب‌ها و فعالیت‌ها.',
  'Vouchers, campaigns, and gift-card planning.': 'کوپن‌ها، کمپین‌ها و برنامه‌ریزی کارت هدیه.',
  'Readiness, access, audit, and security.': 'آمادگی، دسترسی، ممیزی و امنیت.',
  'Homepage copy and translations.': 'متن صفحه اصلی و ترجمه‌ها.',
  product: 'محصول',
  products: 'محصول',
  category: 'دسته‌بندی',
  categories: 'دسته‌بندی',
  media: 'رسانه'
};

export type AdminPageShellCopyKey = keyof typeof en;

export function getAdminPageShellCopy(key: string, locale?: SupportedLocale | string | null) {
  if (adminLocaleKey(locale) === 'fa' && key in fa) return fa[key as AdminPageShellCopyKey];
  if (key in en) return en[key as AdminPageShellCopyKey];
  return key;
}

export function createAdminPageShellTranslator(locale?: SupportedLocale | string | null) {
  return (key: string) => getAdminPageShellCopy(key, locale);
}
