import type { SupportedLocale } from '@/lib/i18n/locales';
import { createAdminTranslator } from '@/lib/localization/admin-copy';

const bannerFa: Record<string, string> = {
  'Fulfillment method saved successfully.': 'روش انجام سفارش با موفقیت ذخیره شد.'
};

export function getAdminActionBannerCopy(key: string, locale?: SupportedLocale | string | null) {
  if (locale?.toLowerCase().startsWith('fa') && bannerFa[key]) return bannerFa[key];
  return createAdminTranslator(locale)(key);
}

export function createAdminActionBannerTranslator(locale?: SupportedLocale | string | null) {
  return (key: string) => getAdminActionBannerCopy(key, locale);
}
