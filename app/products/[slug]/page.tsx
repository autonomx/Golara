import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PathTrail } from '@/components/PathTrail';
import { ProductCheckoutForm } from '@/components/ProductCheckoutForm';
import { ProductInquiryForm } from '@/components/ProductInquiryForm';
import { ProductDetail } from '@/components/product/ProductDetail';
import { SiteHeader } from '@/components/SiteHeader';
import { getCategoryBySlug, getProductBySlug, listProducts } from '@/lib/cms/catalog-repository';
import { hasDatabase } from '@/lib/prisma';
import { buildPageMetadata } from '@/lib/site-metadata';
import { buildProductBreadcrumbJsonLd, buildProductJsonLd, JsonLdScript } from '@/lib/structured-data';

export async function generateStaticParams() {
  const products = await listProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) {
    return buildPageMetadata({
      title: 'Product not found | Golara',
      description: 'This Golara product is no longer available.',
      path: `/products/${slug}`
    });
  }

  return buildPageMetadata({
    title: `${product.title} | Golara`,
    description: product.description,
    path: `/products/${product.slug}`,
    image: product.image
  });
}

export default async function ProductPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ inquiry?: string; checkout?: string }>;
}) {
  const [{ slug }, { inquiry, checkout }] = await Promise.all([params, searchParams]);
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const category = await getCategoryBySlug(product.category);
  const dbReady = hasDatabase();

  return (
    <main id="main-content" tabIndex={-1}>
      <JsonLdScript data={buildProductJsonLd(product)} />
      <JsonLdScript data={buildProductBreadcrumbJsonLd(product, category)} />
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-5 pt-10">
        <PathTrail items={[{ label: 'Home', href: '/' }, { label: category?.title || product.categoryTitle || product.category, href: `/categories/${product.category}` }, { label: product.title }]} />
      </section>
      <ProductDetail product={product} category={category} dbReady={dbReady} />
      <ProductCheckoutForm product={product} dbReady={dbReady} checkout={checkout} />
      <ProductInquiryForm product={product} dbReady={dbReady} inquiry={inquiry} />
    </main>
  );
}