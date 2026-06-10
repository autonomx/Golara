import type { SupportedLocale } from '@/lib/i18n/locales';
import { adminLocaleKey, createAdminTranslator } from '@/lib/localization/admin-copy';

export const adminCatalogBulkActionKeys = [
  'Activate',
  'Deactivate',
  'Mark best seller',
  'Remove best seller',
  'Mark available today',
  'Remove available today',
  'Move to category'
] as const;

export type AdminCatalogBulkActionKey = (typeof adminCatalogBulkActionKeys)[number];

const faFallbackLabels: Record<string, string> = {
  'Activate': 'فعال کردن',
  'Deactivate': 'غیرفعال کردن',
  'Mark best seller': 'نشانه گذاری به عنوان پرفروش',
  'Remove best seller': 'حذف نشان پرفروش',
  'Mark available today': 'نشانه گذاری به عنوان موجود امروز',
  'Remove available today': 'حذف نشان موجود امروز',
  'Move to category': 'انتقال به دسته',
  'Bulk action': 'عملیات گروهی',
  'Choose action...': 'انتخاب عملیات...',
  'Target category': 'دسته هدف',
  'Only needed for move to category.': 'فقط برای انتقال به دسته لازم است.',
  'Apply': 'اعمال',
  'Quick edit visible products': 'ویرایش سریع محصولات قابل مشاهده',
  'Save quick edits': 'ذخیره ویرایش های سریع'
};

function catalogControlLabel(key: string, locale?: SupportedLocale | string | null) {
  const translated = createAdminTranslator(locale)(key);
  if (translated !== key) return translated;
  if (adminLocaleKey(locale) === 'fa') return faFallbackLabels[key] ?? key;
  return key;
}

export function adminCatalogBulkActionLabel(value: string, locale?: SupportedLocale | string | null) {
  return catalogControlLabel(value, locale);
}

export function adminCatalogControlLabel(key: string, locale?: SupportedLocale | string | null) {
  return catalogControlLabel(key, locale);
}
