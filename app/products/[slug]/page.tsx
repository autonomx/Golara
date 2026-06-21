import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PathTrail } from '@/components/PathTrail';
import { ProductCheckoutForm } from '@/components/ProductCheckoutForm';
import { ProductInquiryForm } from '@/components/ProductInquiryForm';
import { ProductDetail } from '@/components/product/ProductDetail';
import { SiteHeader } from '@/components/SiteHeader';
import { getPaymentGatewayConfig, getPaymentGatewayReadiness } from '@/lib/checkout/payment-gateway-config';
import { getProductCheckoutPolicy } from '@/lib/checkout/product-checkout-policy';
import {
  getCachedCategoryBySlug,
  getCachedProductBySlug as getProductBySlug,
  listCachedPublicProductSlugs
} from '@/lib/cms/public-catalog-cache';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import { getStorefrontCopy, getStorefrontCopyDirection } from '@/lib/localization/storefront-copy';
import { hasDatabase } from '@/lib/prisma';
import { buildPageMetadata } from '@/lib/site-metadata';
import { buildProductBreadcrumbJsonLd, buildProductJsonLd, JsonLdScript } from '@/lib/structured-data';

export async function generateStaticParams() {
  const products = await listCachedPublicProductSlugs();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const [{ slug }, locale] = await Promise.all([params, resolveStorefrontLocale()]);
  const product = await getProductBySlug(slug, { locale });
  if (!product) {
    return buildPageMetadata({
      title: `${getStorefrontCopy('catalog.title', locale)} | Golara`,
      description: getStorefrontCopy('catalog.body', locale),
      path: `/products/${slug}`
    });
  }

  return buildPageMetadata({
    title: product.seoTitle || `${product.title} | Golara`,
    description: product.seoDescription || product.description,
    path: product.canonicalPath || `/products/${product.slug}`,
    index: product.seoIndex !== false,
    image: product.image
  });
}

export default async function ProductPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ inquiry?: string; checkout?: string; cart?: string }>;
}) {
  const [{ slug }, { inquiry, checkout, cart }, locale] = await Promise.all([
    params,
    searchParams,
    resolveStorefrontLocale()
  ]);
  const product = await getProductBySlug(slug, { locale });
  if (!product) notFound();
  const category = await getCachedCategoryBySlug(product.category, { locale });
  const dbReady = hasDatabase();
  const checkoutReadiness = getPaymentGatewayReadiness(getPaymentGatewayConfig(process.env), process.env);
  const checkoutPolicy = getProductCheckoutPolicy({ product, dbReady, checkoutReadiness, locale });

  return (
    <main id="main-content" tabIndex={-1} dir={getStorefrontCopyDirection(locale)}>
      <JsonLdScript data={buildProductJsonLd(product)} />
      <JsonLdScript data={buildProductBreadcrumbJsonLd(product, category)} />
      <SiteHeader returnTo={`/products/${slug}`} locale={locale} />
      <section className="mx-auto max-w-7xl px-5 pt-10">
        <PathTrail items={[{ label: getStorefrontCopy('common.home', locale), href: '/' }, { label: category?.title || product.categoryTitle || product.category, href: `/categories/${product.category}` }, { label: product.title }]} />
      </section>
      <ProductDetail product={product} category={category} checkoutPolicy={checkoutPolicy} locale={locale} cartStatus={cart} />
      <ProductCheckoutForm product={product} dbReady={dbReady} checkout={checkout} checkoutPolicy={checkoutPolicy} locale={locale} />
      {checkoutPolicy.showInquiryForm ? <ProductInquiryForm product={product} dbReady={dbReady} inquiry={inquiry} locale={locale} /> : null}
    </main>
  );
}
