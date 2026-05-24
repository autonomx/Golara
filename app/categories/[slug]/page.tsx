import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { ProductCard } from '@/components/ProductCard';
import { SiteHeader } from '@/components/SiteHeader';
import { getCategoryBySlug, listCategories, listProductsByCategorySlug } from '@/lib/cms/catalog-repository';
import { buildPageMetadata } from '@/lib/site-metadata';
import { buildCategoryBreadcrumbJsonLd, JsonLdScript } from '@/lib/structured-data';

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
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();
  const categoryProducts = await listProductsByCategorySlug(category.slug);

  return (
    <main>
      <JsonLdScript data={buildCategoryBreadcrumbJsonLd(category)} />
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-5 py-14">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">{category.eyebrow}</p>
        <h1 className="mt-3 font-display text-6xl text-rosewood">{category.title}</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-stone-700">{category.description}</p>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {categoryProducts.map((product) => <ProductCard key={product.slug} product={product} />)}
        </div>
      </section>
    </main>
  );
}
