import { adminLocaleKey } from '@/lib/localization/admin-copy';

const en = {
  catalogPagination: 'Catalog pagination',
  showing: 'Showing',
  of: 'of',
  itemLabel: 'products',
  page: 'Page',
  previous: 'Previous',
  next: 'Next'
} as const;

const fa: Record<keyof typeof en, string> = {
  catalogPagination: 'صفحه‌بندی کاتالوگ',
  showing: 'نمایش',
  of: 'از',
  itemLabel: 'محصول',
  page: 'صفحه',
  previous: 'قبلی',
  next: 'بعدی'
};

export type AdminCatalogPageCopyKey = keyof typeof en;

export function getAdminCatalogPageCopy(key: AdminCatalogPageCopyKey, locale?: string | null) {
  if (adminLocaleKey(locale) === 'fa') return fa[key];
  return en[key];
}

export function createAdminCatalogPageTranslator(locale?: string | null) {
  return (key: AdminCatalogPageCopyKey) => getAdminCatalogPageCopy(key, locale);
}
