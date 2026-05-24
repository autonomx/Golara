import { notFound } from 'next/navigation';
import { ProductInquiryForm } from '@/components/ProductInquiryForm';
import { ProductDetail } from '@/components/product/ProductDetail';
import { SiteHeader } from '@/components/SiteHeader';
import { getCategoryBySlug, getProductBySlug, listProducts } from '@/lib/cms/catalog-repository';
import { hasDatabase } from '@/lib/prisma';

export async function generateStaticParams() {
  const products = await listProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export default async function ProductPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ inquiry?: string }>;
}) {
  const [{ slug }, { inquiry }] = await Promise.all([params, searchParams]);
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const category = await getCategoryBySlug(product.category);

  return (
    <main>
      <SiteHeader />
      <ProductDetail product={product} category={category} />
      <ProductInquiryForm product={product} dbReady={hasDatabase()} inquiry={inquiry} />
    </main>
  );
}
