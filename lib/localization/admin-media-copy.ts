import type { SupportedLocale } from '@/lib/i18n/locales';
import { adminLocaleKey, createAdminTranslator } from '@/lib/localization/admin-copy';

const mediaCategoryLabelByValue: Record<string, string> = {
  product: 'Product',
  category: 'Category',
  'homepage-banner': 'Homepage hero',
  'homepage-best-seller': 'Homepage best seller',
  'homepage-category': 'Homepage category',
  general: 'General / other'
};

const mediaUsageLabelByType: Record<string, string> = {
  Category: 'Category',
  Product: 'Product',
  'Homepage hero': 'Homepage hero',
  'Homepage best seller': 'Homepage best seller',
  'Homepage category': 'Homepage category',
  Unassigned: 'Unassigned'
};

const faFallbackLabels: Record<string, string> = {
  'local asset': 'دارایی محلی'
};

function adminMediaLabel(key: string, locale?: SupportedLocale | string | null) {
  const translated = createAdminTranslator(locale)(key);
  if (translated !== key) return translated;
  if (adminLocaleKey(locale) === 'fa') return faFallbackLabels[key] ?? key;
  return key;
}

export function adminMediaCategoryLabel(value?: string | null, locale?: SupportedLocale | string | null) {
  return adminMediaLabel(mediaCategoryLabelByValue[value ?? ''] ?? 'General / other', locale);
}

export function adminMediaUsageLabel(type?: string | null, locale?: SupportedLocale | string | null) {
  return adminMediaLabel(mediaUsageLabelByType[type ?? ''] ?? 'Unassigned', locale);
}

export function adminMediaLocalAssetLabel(locale?: SupportedLocale | string | null) {
  return adminMediaLabel('local asset', locale);
}

export function adminMediaStaticLabel(locale?: SupportedLocale | string | null) {
  return adminMediaLabel('Static', locale);
}

export function adminMediaSeedOrStaticAssetLabel(locale?: SupportedLocale | string | null) {
  return adminMediaLabel('Seed or static asset', locale);
}
