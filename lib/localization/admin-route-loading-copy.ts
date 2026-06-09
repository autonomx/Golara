import type { SupportedLocale } from '@/lib/i18n/locales';
import { adminLocaleKey } from '@/lib/localization/admin-copy';

const en = {
  Admin: 'Admin',
  Categories: 'Categories',
  Customers: 'Customers',
  Discounts: 'Discounts',
  Inquiries: 'Inquiries',
  'Loading admin': 'Loading admin',
  'Loading catalog': 'Loading catalog',
  'Loading configuration': 'Loading configuration',
  'Loading customer ops': 'Loading customer ops',
  'Loading module': 'Loading module',
  'Loading promotions': 'Loading promotions',
  'Loading sales': 'Loading sales',
  'Media library': 'Media library',
  'Operations console': 'Operations console',
  Orders: 'Orders',
  Overview: 'Overview',
  Products: 'Products',
  Settings: 'Settings'
} as const;

const fa: Record<keyof typeof en, string> = {
  Admin: 'مدیریت',
  Categories: 'دسته ها',
  Customers: 'مشتریان',
  Discounts: 'تخفیف ها',
  Inquiries: 'درخواست ها',
  'Loading admin': 'در حال بارگیری مدیریت',
  'Loading catalog': 'در حال بارگیری کاتالوگ',
  'Loading configuration': 'در حال بارگیری تنظیمات',
  'Loading customer ops': 'در حال بارگیری عملیات مشتری',
  'Loading module': 'در حال بارگیری بخش',
  'Loading promotions': 'در حال بارگیری پروموشن ها',
  'Loading sales': 'در حال بارگیری فروش',
  'Media library': 'کتابخانه رسانه',
  'Operations console': 'کنسول عملیات',
  Orders: 'سفارش ها',
  Overview: 'نمای کلی',
  Products: 'محصولات',
  Settings: 'تنظیمات'
};

export type AdminRouteLoadingCopyKey = keyof typeof en;

export function getAdminRouteLoadingCopy(key: string, locale?: SupportedLocale | string | null) {
  if (adminLocaleKey(locale) === 'fa' && key in fa) return fa[key as AdminRouteLoadingCopyKey];
  if (key in en) return en[key as AdminRouteLoadingCopyKey];
  return key;
}

export function createAdminRouteLoadingTranslator(locale?: SupportedLocale | string | null) {
  return (key: string) => getAdminRouteLoadingCopy(key, locale);
}
