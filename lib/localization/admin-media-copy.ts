import type { SupportedLocale } from '@/lib/i18n/locales';
import { createAdminTranslator } from '@/lib/localization/admin-copy';

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

export function adminMediaCategoryLabel(value?: string | null, locale?: SupportedLocale | string | null) {
  const t = createAdminTranslator(locale);
  return t(mediaCategoryLabelByValue[value ?? ''] ?? 'General / other');
}

export function adminMediaUsageLabel(type?: string | null, locale?: SupportedLocale | string | null) {
  const t = createAdminTranslator(locale);
  return t(mediaUsageLabelByType[type ?? ''] ?? 'Unassigned');
}

export function adminMediaLocalAssetLabel(locale?: SupportedLocale | string | null) {
  return createAdminTranslator(locale)('local asset');
}

export function adminMediaStaticLabel(locale?: SupportedLocale | string | null) {
  return createAdminTranslator(locale)('Static');
}

export function adminMediaSeedOrStaticAssetLabel(locale?: SupportedLocale | string | null) {
  return createAdminTranslator(locale)('Seed or static asset');
}
