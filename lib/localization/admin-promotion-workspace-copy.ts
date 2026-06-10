import type { SupportedLocale } from '@/lib/i18n/locales';
import { adminLocaleKey } from '@/lib/localization/admin-copy';

const en = {
  active: 'Active',
  scheduled: 'Scheduled',
  expired: 'Expired',
  draft: 'Draft',
  inactive: 'Inactive',
  Open: 'Open',
  None: 'None',
  Min: 'Min',
  to: 'to',
  rule: 'rule',
  rules: 'rules',
  'All products': 'All products',
  'No promotion discounts found. Run seed.': 'No promotion discounts found. Run seed.',
  Expires: 'Expires',
  Initial: 'Initial',
  Balance: 'Balance',
  'No store credits found.': 'No store credits found.'
} as const;

const fa: Record<keyof typeof en, string> = {
  active: 'فعال',
  scheduled: 'زمان بندی شده',
  expired: 'منقضی شده',
  draft: 'پیش نویس',
  inactive: 'غیرفعال',
  Open: 'باز',
  None: 'هیچ کدام',
  Min: 'حداقل',
  to: 'تا',
  rule: 'قانون',
  rules: 'قانون',
  'All products': 'همه محصولات',
  'No promotion discounts found. Run seed.': 'هیچ تخفیف پروموشنی پیدا نشد. seed را اجرا کنید.',
  Expires: 'انقضا',
  Initial: 'اولیه',
  Balance: 'مانده',
  'No store credits found.': 'هیچ اعتبار فروشگاهی پیدا نشد.'
};

export type AdminPromotionWorkspaceCopyKey = keyof typeof en;

export function getAdminPromotionWorkspaceCopy(key: string, locale?: SupportedLocale | string | null) {
  if (adminLocaleKey(locale) === 'fa' && key in fa) return fa[key as AdminPromotionWorkspaceCopyKey];
  if (key in en) return en[key as AdminPromotionWorkspaceCopyKey];
  return key;
}

export function createAdminPromotionWorkspaceTranslator(locale?: SupportedLocale | string | null) {
  return (key: string) => getAdminPromotionWorkspaceCopy(key, locale);
}
