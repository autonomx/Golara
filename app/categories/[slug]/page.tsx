import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { HomepageCategoryTileCard } from '@/components/HomepageCategoryTileCard';
import { PathTrail } from '@/components/PathTrail';
import { ProductCard } from '@/components/ProductCard';
import { SiteHeader } from '@/components/SiteHeader';
import type { Category } from '@/lib/catalog';
import { childCategoriesFor, descendantCategoriesFor, productsForCategoryTree, withCategoryProductCounts } from '@/lib/category-tree';
import { getCategoryBySlug, listCategories, listProducts } from '@/lib/cms/catalog-repository';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import { getStorefrontCopy, getStorefrontCopyDirection } from '@/lib/localization/storefront-copy';
import { buildPageMetadata } from '@/lib/site-metadata';
import { buildCategoryBreadcrumbJsonLd, JsonLdScript } from '@/lib/structured-data';

function categoryTrail(category: Category, categories: Category[], locale?: string) {
  const parent = category.parentSlug ? categories.find((candidate) => candidate.slug === category.parentSlug) : undefined;
  return [
    { label: getStorefrontCopy('common.home', locale), href: '/' },
    ...(parent ? [{ label: parent.title, href: `/categories/${parent.slug}` }] : []),
    { label: category.title }
  ];
}

export async function generateStaticParams() {
  const categories = await listCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const [{ slug }, locale] = await Promise.all([params, resolveStorefrontLocale()]);
  const category = await getCategoryBySlug(slug, { locale });
  if (!category) {
    return buildPageMetadata({
      title: `${getStorefrontCopy('categories.title', locale)} | Golara`,
      description: getStorefrontCopy('categories.body', locale),
      path: `/categories/${slug}`
    });
  }

  return buildPageMetadata({
    title: `${category.title} | Golara`,
    description: category.description,
    path: `/categories/${category.slug}`
  });
}

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const locale = await resolveStorefrontLocale();
  const { slug } = await params;
  const [category, categories, products] = await Promise.all([
    getCategoryBySlug(slug, { locale }),
    listCategories({ locale }),
    listProducts({ locale })
  ]);

  if (!category) notFound();

  const categoriesWithCounts = withCategoryProductCounts(categories, products);
  const categoryWithCount = categoriesWithCounts.find((candidate) => candidate.slug === category.slug) ?? category;
  const childCategories = childCategoriesFor(categoryWithCount, categoriesWithCounts);
  const descendants = descendantCategoriesFor(categoryWithCount, categoriesWithCounts);
  const categoryProducts = productsForCategoryTree(categoryWithCount, categoriesWithCounts, products);

  return (
    <main id="main-content" tabIndex={-1} dir={getStorefrontCopyDirection(locale)}>
      <JsonLdScript data={buildCategoryBreadcrumbJsonLd(categoryWithCount)} />
      <SiteHeader returnTo={`/categories/${slug}`} locale={locale} />
      <section className="mx-auto max-w-7xl px-5 py-14">
        <PathTrail items={categoryTrail(categoryWithCount, categoriesWithCounts, locale)} />
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">{categoryWithCount.eyebrow}</p>
        <h1 className="mt-3 font-display text-6xl text-rosewood">{categoryWithCount.title}</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-stone-700">{categoryWithCount.description}</p>

        {childCategories.length > 0 ? (
          <section className="mt-10">
            <div className="mb-5">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">{getStorefrontCopy('category.exploreEyebrow', locale)}</p>
              <h2 className="mt-2 font-display text-4xl text-rosewood">{getStorefrontCopy('category.subcategoriesTitle', locale)}</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {childCategories.map((child, index) => <HomepageCategoryTileCard key={child.slug} category={child} priority={index < 4} locale={locale} />)}
            </div>
          </section>
        ) : null}

        <section className="mt-10">
          <div className="mb-5">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">{getStorefrontCopy('category.productsEyebrow', locale)}</p>
            <h2 className="mt-2 font-display text-4xl text-rosewood">{descendants.length > 0 ? getStorefrontCopy('category.allInCollection', locale) : categoryWithCount.title}</h2>
          </div>
          {categoryProducts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {categoryProducts.map((product) => <ProductCard key={product.slug} product={product} locale={locale} />)}
            </div>
          ) : (
            <div className="rounded-[2rem] border border-rosewood/10 bg-white p-8 text-stone-700 shadow-sm">
              {getStorefrontCopy('category.empty', locale)}
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
