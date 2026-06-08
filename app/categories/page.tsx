import type { Metadata } from 'next';
import { HomepageCategoryTileCard } from '@/components/HomepageCategoryTileCard';
import { SiteHeader } from '@/components/SiteHeader';
import { withCategoryProductCounts } from '@/lib/category-tree';
import { listCategories, listProducts } from '@/lib/cms/catalog-repository';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import { getStorefrontCopy, getStorefrontCopyDirection } from '@/lib/localization/storefront-copy';
import { buildPageMetadata } from '@/lib/site-metadata';

export const metadata: Metadata = buildPageMetadata({
  title: 'Collections | Golara',
  description: 'Browse Golara floral collections, bouquets, flower boxes, and premium gift categories.',
  path: '/categories'
});

export default async function CategoriesPage() {
  const locale = await resolveStorefrontLocale();
  const [categories, products] = await Promise.all([
    listCategories({ locale }),
    listProducts({ locale })
  ]);
  const categoriesWithCounts = withCategoryProductCounts(categories, products);
  const topLevelCategories = categoriesWithCounts.filter((category) => !category.parentSlug);

  return (
    <main id="main-content" tabIndex={-1} dir={getStorefrontCopyDirection(locale)}>
      <SiteHeader returnTo="/categories" locale={locale} />
      <section className="mx-auto max-w-7xl px-5 py-14">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">{getStorefrontCopy('categories.eyebrow', locale)}</p>
        <h1 className="mt-3 font-display text-6xl text-rosewood">{getStorefrontCopy('categories.title', locale)}</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-stone-700">{getStorefrontCopy('categories.body', locale)}</p>
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {topLevelCategories.map((category, index) => <HomepageCategoryTileCard key={category.slug} category={category} priority={index < 4} />)}
        </div>
      </section>
    </main>
  );
}
