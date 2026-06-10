import type { SupportedLocale } from '@/lib/i18n/locales';
import { adminLocaleKey } from '@/lib/localization/admin-copy';

const en = {
  'Admin module error': 'Admin module error',
  'Admin overview could not load': 'Admin overview could not load',
  'Back to overview': 'Back to overview',
  'Categories could not load': 'Categories could not load',
  'Customers could not load': 'Customers could not load',
  'Discounts could not load': 'Discounts could not load',
  'Inquiries could not load': 'Inquiries could not load',
  'Media library could not load': 'Media library could not load',
  'Module error': 'Module error',
  'Orders could not load': 'Orders could not load',
  'Products could not load': 'Products could not load',
  'Retry': 'Retry',
  'Settings could not load': 'Settings could not load',
  'This admin section could not load. Try again, or check the server logs if the problem repeats.':
    'This admin section could not load. Try again, or check the server logs if the problem repeats.',
  'Unknown error': 'Unknown error'
} as const;

const fa: Record<keyof typeof en, string> = {
  'Admin module error': 'خطای بخش مدیریت',
  'Admin overview could not load': 'نمای کلی مدیریت بارگیری نشد',
  'Back to overview': 'بازگشت به نمای کلی',
  'Categories could not load': 'دسته ها بارگیری نشدند',
  'Customers could not load': 'مشتریان بارگیری نشدند',
  'Discounts could not load': 'تخفیف ها بارگیری نشدند',
  'Inquiries could not load': 'درخواست ها بارگیری نشدند',
  'Media library could not load': 'کتابخانه رسانه بارگیری نشد',
  'Module error': 'خطای بخش',
  'Orders could not load': 'سفارش ها بارگیری نشدند',
  'Products could not load': 'محصولات بارگیری نشدند',
  'Retry': 'تلاش دوباره',
  'Settings could not load': 'تنظیمات بارگیری نشد',
  'This admin section could not load. Try again, or check the server logs if the problem repeats.':
    'این بخش مدیریت بارگیری نشد. دوباره تلاش کنید یا اگر مشکل تکرار شد، گزارش های سرور را بررسی کنید.',
  'Unknown error': 'خطای نامشخص'
};

export type AdminRouteErrorCopyKey = keyof typeof en;

export function getAdminRouteErrorCopy(key: string, locale?: SupportedLocale | string | null) {
  if (adminLocaleKey(locale) === 'fa' && key in fa) return fa[key as AdminRouteErrorCopyKey];
  if (key in en) return en[key as AdminRouteErrorCopyKey];
  return key;
}

export function createAdminRouteErrorTranslator(locale?: SupportedLocale | string | null) {
  return (key: string) => getAdminRouteErrorCopy(key, locale);
}
