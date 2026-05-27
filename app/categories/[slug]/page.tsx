import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { HomepageCategoryTileCard } from '@/components/HomepageCategoryTileCard';
import { PathTrail } from '@/components/PathTrail';
import { ProductCard } from '@/components/ProductCard';
import { SiteHeader } from '@/components/SiteHeader';
import type { Category, Product } from '@/lib/catalog';
import { getCategoryBySlug, listCategories, listProducts } from '@/lib/cms/catalog-repository';
import { getStorefrontCopy } from '@/lib/localization/storefront-copy';
import { buildPageMetadata } from '@/lib/site-metadata';
import { buildCategoryBreadcrumbJsonLd, JsonLdScript } from '@/lib/structured-data';

function childCategoriesFor(category: Category, categories: Category[]) {
  return categories.filter((candidate) => candidate.parentSlug === category.slug && candidate.isActive !== false);
}

function productsForCategoryTree(category: Category, childCategories: Category[], products: Product[]) {
  const categorySlugs = new Set([category.slug, ...childCategories.map((child) => child.slug)]);
  return products.filter((product) => categorySlugs.has(product.category));
}

function categoryTrail(category: Category, categories: Category[]) {
  const parent = category.parentSlug ? categories.find((candidate) => candidate.slug === category.parentSlug) : undefined;
  return [
    { label: getStorefrontCopy('common.home'), href: '/' },
    ...(parent ? [{ label: parent.title, href: `/categories/${parent.slug}` }] : []),
    { label: category.title }
  ];
}

export async function generateStaticParams() {
  const categories = await listCategories();
  return categories.map((category) => ({ slug: category.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) {
    return buildPageMetadata({
      title: 'Collection not found | Golara',
      description: 'This Golara collection is no longer available.',
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
  const { slug } = await params;
  const [category, categories, products] = await Promise.all([
    getCategoryBySlug(slug),
    listCategories(),
    listProducts()
  ]);

  if (!category) notFound();

  const childCategories = childCategoriesFor(category, categories);
  const categoryProducts = productsForCategoryTree(category, childCategories, products);

  return (
    <main id="main-content" tabIndex={-1}>
      <JsonLdScript data={buildCategoryBreadcrumbJsonLd(category)} />
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-5 py-14">
        <PathTrail items={categoryTrail(category, categories)} />
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">{category.eyebrow}</p>
        <h1 className="mt-3 font-display text-6xl text-rosewood">{category.title}</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-stone-700">{category.description}</p>

        {childCategories.length > 0 ? (
          <section className="mt-10">
            <div className="mb-5">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">Explore</p>
              <h2 className="mt-2 font-display text-4xl text-rosewood">Subcategories</h2>
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {childCategories.map((child, index) => <HomepageCategoryTileCard key={child.slug} category={child} priority={index < 4} />)}
            </div>
          </section>
        ) : null}

        <section className="mt-10">
          <div className="mb-5">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">Products</p>
            <h2 className="mt-2 font-display text-4xl text-rosewood">{childCategories.length > 0 ? 'All in this collection' : category.title}</h2>
          </div>
          {categoryProducts.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {categoryProducts.map((product) => <ProductCard key={product.slug} product={product} />)}
            </div>
          ) : (
            <div className="rounded-[2rem] border border-rosewood/10 bg-white p-8 text-stone-700 shadow-sm">
              No products are assigned to this category yet. Add products in the admin CMS or choose a subcategory above.
            </div>
          )}
        </section>
      </section>
    </main>
  );
}
