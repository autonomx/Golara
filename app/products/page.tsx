import { ProductCard } from '@/components/ProductCard';
import { SiteHeader } from '@/components/SiteHeader';
import { listProducts } from '@/lib/cms/catalog-repository';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import { getStorefrontCopy, getStorefrontCopyDirection } from '@/lib/localization/storefront-copy';

export default async function ProductsPage() {
  const locale = await resolveStorefrontLocale();
  const products = await listProducts({ locale });

  return (
    <main dir={getStorefrontCopyDirection(locale)}>
      <SiteHeader returnTo="/products" />
      <section className="mx-auto max-w-7xl px-5 py-14">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">{getStorefrontCopy('catalog.eyebrow', locale)}</p>
        <h1 className="mt-3 font-display text-6xl text-rosewood">{getStorefrontCopy('catalog.title', locale)}</h1>
        <p className="mt-4 max-w-2xl text-stone-700">{getStorefrontCopy('catalog.body', locale)}</p>
        <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => <ProductCard key={product.slug} product={product} />)}
        </div>
      </section>
    </main>
  );
}
