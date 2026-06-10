import type { SupportedLocale } from '@/lib/i18n/locales';
import { adminLocaleKey } from '@/lib/localization/admin-copy';

const en = {
  'Admin module error': 'Admin module error',
  'Admin overview could not load': 'Admin overview could not load',
  'Back to overview': 'Back to overview',
  'Module error': 'Module error',
  'Orders could not load': 'Orders could not load',
  'Retry': 'Retry',
  'This admin section could not load. Try again, or check the server logs if the problem repeats.':
    'This admin section could not load. Try again, or check the server logs if the problem repeats.',
  'Unknown error': 'Unknown error'
} as const;

const fa: Record<keyof typeof en, string> = {
  'Admin module error': 'خطای بخش مدیریت',
  'Admin overview could not load': 'نمای کلی مدیریت بارگیری نشد',
  'Back to overview': 'بازگشت به نمای کلی',
  'Module error': 'خطای بخش',
  'Orders could not load': 'سفارش ها بارگیری نشدند',
  'Retry': 'تلاش دوباره',
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
