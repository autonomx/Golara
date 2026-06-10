import type { Category, HomepageContent, HomepageTranslation, Product } from '@/lib/catalog';
import type { SupportedLocale } from '@/lib/i18n/locales';
import { AdminHomepageSection } from '@/components/admin/AdminHomepageSection';

type AdminContentWorkspaceProps = {
  homepage: HomepageContent;
  homepageTranslations: HomepageTranslation[];
  categories: Category[];
  products: Product[];
  disabled: boolean;
  authenticated: boolean;
  locale?: SupportedLocale | string | null;
  t?: (key: string) => string;
};

export function AdminContentWorkspace({
  homepage,
  homepageTranslations,
  categories,
  products,
  disabled,
  authenticated,
  locale,
  t = (key: string) => key
}: AdminContentWorkspaceProps) {
  return (
    <AdminHomepageSection
      homepage={homepage}
      homepageTranslations={homepageTranslations}
      categories={categories}
      products={products}
      disabled={disabled}
      authenticated={authenticated}
      locale={locale}
      t={t}
    />
  );
}
