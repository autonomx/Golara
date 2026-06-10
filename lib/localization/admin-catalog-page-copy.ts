const en = { previous: 'Previous', next: 'Next' } as const;
const fa = { previous: 'قبلی', next: 'بعدی' } as const;

export type AdminCatalogPageCopyKey = keyof typeof en;

export function getAdminCatalogPageCopy(key: AdminCatalogPageCopyKey, locale?: string | null) {
  if (locale?.toLowerCase().startsWith('fa')) return fa[key];
  return en[key];
}
