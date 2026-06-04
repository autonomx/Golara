import Link from 'next/link';
import { Search } from 'lucide-react';
import { ProductCard } from '@/components/ProductCard';
import { SiteHeader } from '@/components/SiteHeader';
import { listProducts } from '@/lib/cms/catalog-repository';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import { getStorefrontCopy, getStorefrontCopyDirection } from '@/lib/localization/storefront-copy';

type ProductsSearchParams = { q?: string };

function normalizeSearch(value?: string) {
  return value?.trim().replace(/\s+/g, ' ') ?? '';
}

function productMatchesSearch(product: Awaited<ReturnType<typeof listProducts>>[number], search: string) {
  if (!search) return true;
  const query = search.toLowerCase();
  return [product.title, product.slug, product.code, product.description, product.category, product.categoryTitle]
    .filter(Boolean)
    .some((value) => value?.toLowerCase().includes(query));
}

export default async function ProductsPage({ searchParams }: { searchParams?: Promise<ProductsSearchParams> }) {
  const emptySearchParams: ProductsSearchParams = {};
  const [resolvedSearchParams, locale] = await Promise.all([searchParams ?? Promise.resolve(emptySearchParams), resolveStorefrontLocale()]);
  const search = normalizeSearch(resolvedSearchParams.q);
  const products = await listProducts({ locale });
  const filteredProducts = products.filter((product) => productMatchesSearch(product, search));

  return (
    <main dir={getStorefrontCopyDirection(locale)}>
      <SiteHeader returnTo={search ? `/products?q=${encodeURIComponent(search)}` : '/products'} />
      <section className="mx-auto max-w-7xl px-5 py-14">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">{getStorefrontCopy('catalog.eyebrow', locale)}</p>
        <h1 className="mt-3 font-display text-6xl text-rosewood">{getStorefrontCopy('catalog.title', locale)}</h1>
        <p className="mt-4 max-w-2xl text-stone-700">{getStorefrontCopy('catalog.body', locale)}</p>

        <form action="/products" className="mt-8 grid gap-3 rounded-2xl border border-rosewood/10 bg-white p-3 shadow-[0_16px_40px_rgba(111,36,56,0.06)] md:grid-cols-[1fr_auto]">
          <label className="relative block">
            <span className="sr-only">Search products</span>
            <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-rosewood/60" />
            <input
              name="q"
              type="search"
              defaultValue={search}
              placeholder="Search by flower, color, product code, or occasion..."
              className="w-full rounded-full border border-rosewood/10 bg-[#fffaf7] py-3 pl-12 pr-4 text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20"
            />
          </label>
          <div className="flex gap-2">
            <button type="submit" className="rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/15 transition hover:-translate-y-0.5 hover:bg-stone-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-olive/30">
              Search
            </button>
            {search ? (
              <Link href="/products" className="rounded-full border border-rosewood/15 px-6 py-3 text-sm font-semibold text-rosewood transition hover:border-rosewood focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-olive/20">
                Clear
              </Link>
            ) : null}
          </div>
        </form>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm font-semibold text-stone-600">
          <p>{search ? `Showing ${filteredProducts.length} result${filteredProducts.length === 1 ? '' : 's'} for “${search}”` : `Showing ${products.length} product${products.length === 1 ? '' : 's'}`}</p>
        </div>

        {filteredProducts.length ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredProducts.map((product) => <ProductCard key={product.slug} product={product} locale={locale} />)}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-rosewood/20 bg-white p-10 text-center">
            <h2 className="font-display text-4xl text-rosewood">No products found</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-stone-600">Try searching for a color, bouquet, box, occasion, or product code.</p>
            <Link href="/products" className="mt-6 inline-flex rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white">
              View all products
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
