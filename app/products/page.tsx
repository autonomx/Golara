import Link from 'next/link';
import { Search } from 'lucide-react';
import type { Metadata } from 'next';
import { ProductCard } from '@/components/ProductCard';
import { SiteHeader } from '@/components/SiteHeader';
import type { Product } from '@/lib/catalog';
import { listCachedPublicProducts } from '@/lib/cms/public-catalog-cache';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import { formatStorefrontCopy, getStorefrontCopy, getStorefrontCopyDirection } from '@/lib/localization/storefront-copy';
import { buildPageMetadata } from '@/lib/site-metadata';

type CatalogAvailabilityFilter = 'all' | 'available' | 'best';
type CatalogSort = 'featured' | 'price-asc' | 'price-desc' | 'name';
type ProductsSearchParams = { q?: string; availability?: string; sort?: string };

const CATALOG_SEARCH_MAX_LENGTH = 80;
const ABOVE_THE_FOLD_PRODUCT_CARD_COUNT = 3;

function normalizeSearch(value?: string) {
  const normalized = value?.trim().replace(/\s+/g, ' ') ?? '';
  return normalized.length > CATALOG_SEARCH_MAX_LENGTH ? normalized.slice(0, CATALOG_SEARCH_MAX_LENGTH).trimEnd() : normalized;
}

function normalizeAvailability(value?: string): CatalogAvailabilityFilter {
  return value === 'available' || value === 'best' ? value : 'all';
}

function normalizeSort(value?: string): CatalogSort {
  return value === 'price-asc' || value === 'price-desc' || value === 'name' ? value : 'featured';
}

function catalogPath({ search, availability, sort }: { search?: string; availability?: CatalogAvailabilityFilter; sort?: CatalogSort }) {
  const params = new URLSearchParams();
  if (search) params.set('q', search);
  if (availability && availability !== 'all') params.set('availability', availability);
  if (sort && sort !== 'featured') params.set('sort', sort);
  const query = params.toString();
  return `/products${query ? `?${query}` : ''}`;
}

function filterProducts(products: Product[], availability: CatalogAvailabilityFilter) {
  if (availability === 'available') return products.filter((product) => product.availableToday);
  if (availability === 'best') return products.filter((product) => product.bestSeller);
  return products;
}

function sortProducts(products: Product[], sort: CatalogSort, locale?: string) {
  const nextProducts = [...products];
  if (sort === 'price-asc') return nextProducts.sort((a, b) => a.price - b.price);
  if (sort === 'price-desc') return nextProducts.sort((a, b) => b.price - a.price);
  if (sort === 'name') return nextProducts.sort((a, b) => a.title.localeCompare(b.title, locale ?? 'en'));
  return nextProducts.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

function catalogControls(locale?: string | null) {
  const fa = locale?.toLowerCase().startsWith('fa');
  return {
    filterLabel: fa ? 'فیلتر محصولات' : 'Filter products',
    all: fa ? 'همه' : 'All',
    available: getStorefrontCopy('product.availableToday', locale),
    best: getStorefrontCopy('product.bestSeller', locale),
    sortLabel: fa ? 'مرتب‌سازی' : 'Sort',
    featured: fa ? 'پیشنهادی' : 'Featured',
    priceAsc: fa ? 'قیمت کم به زیاد' : 'Price: low to high',
    priceDesc: fa ? 'قیمت زیاد به کم' : 'Price: high to low',
    name: fa ? 'نام محصول' : 'Name',
    apply: fa ? 'اعمال' : 'Apply',
    clear: getStorefrontCopy('catalog.searchClear', locale)
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await resolveStorefrontLocale();

  return buildPageMetadata({
    title: `${getStorefrontCopy('catalog.title', locale)} | Golara`,
    description: getStorefrontCopy('catalog.body', locale),
    path: '/products'
  });
}

export default async function ProductsPage({ searchParams }: { searchParams?: Promise<ProductsSearchParams> }) {
  const emptySearchParams: ProductsSearchParams = {};
  const [resolvedSearchParams, locale] = await Promise.all([searchParams ?? Promise.resolve(emptySearchParams), resolveStorefrontLocale()]);
  const copy = (key: Parameters<typeof getStorefrontCopy>[0]) => getStorefrontCopy(key, locale);
  const search = normalizeSearch(resolvedSearchParams.q);
  const availability = normalizeAvailability(resolvedSearchParams.availability);
  const sort = normalizeSort(resolvedSearchParams.sort);
  const controls = catalogControls(locale);
  const allProducts = await listCachedPublicProducts({ locale, search: search || undefined, take: 80 });
  const products = sortProducts(filterProducts(allProducts, availability), sort, locale);
  const currentCatalogPath = catalogPath({ search, availability, sort });
  const hasActiveControls = Boolean(search || availability !== 'all' || sort !== 'featured');
  const availabilityOptions: Array<{ value: CatalogAvailabilityFilter; label: string }> = [
    { value: 'all', label: controls.all },
    { value: 'available', label: controls.available },
    { value: 'best', label: controls.best }
  ];
  const sortOptions: Array<{ value: CatalogSort; label: string }> = [
    { value: 'featured', label: controls.featured },
    { value: 'price-asc', label: controls.priceAsc },
    { value: 'price-desc', label: controls.priceDesc },
    { value: 'name', label: controls.name }
  ];

  return (
    <main dir={getStorefrontCopyDirection(locale)}>
      <SiteHeader returnTo={currentCatalogPath} locale={locale} />
      <section className="mx-auto max-w-7xl px-5 py-14">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">{copy('catalog.eyebrow')}</p>
        <h1 className="mt-3 font-display text-6xl text-rosewood">{copy('catalog.title')}</h1>
        <p className="mt-4 max-w-2xl text-stone-700">{copy('catalog.body')}</p>

        <form action="/products" className="mt-8 grid gap-3 rounded-2xl border border-rosewood/10 bg-white p-3 shadow-[0_16px_40px_rgba(111,36,56,0.06)] lg:grid-cols-[1fr_auto_auto_auto]">
          <label className="relative block">
            <span className="sr-only">{copy('catalog.searchLabel')}</span>
            <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-rosewood/60" />
            <input
              name="q"
              type="search"
              defaultValue={search}
              maxLength={CATALOG_SEARCH_MAX_LENGTH}
              placeholder={copy('catalog.searchPlaceholder')}
              className="w-full rounded-full border border-rosewood/10 bg-[#fffaf7] py-3 pl-12 pr-4 text-stone-800 outline-none transition placeholder:text-stone-400 focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20"
            />
          </label>
          <label className="block">
            <span className="sr-only">{controls.filterLabel}</span>
            <select name="availability" defaultValue={availability} className="w-full rounded-full border border-rosewood/10 bg-[#fffaf7] px-4 py-3 text-sm font-semibold text-rosewood outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20">
              {availabilityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="sr-only">{controls.sortLabel}</span>
            <select name="sort" defaultValue={sort} className="w-full rounded-full border border-rosewood/10 bg-[#fffaf7] px-4 py-3 text-sm font-semibold text-rosewood outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20">
              {sortOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <div className="flex gap-2">
            <button type="submit" className="rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/15 transition hover:-translate-y-0.5 hover:bg-stone-900 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-olive/30">
              {search ? copy('catalog.searchSubmit') : controls.apply}
            </button>
            {hasActiveControls ? (
              <Link href="/products" className="rounded-full border border-rosewood/15 px-6 py-3 text-sm font-semibold text-rosewood transition hover:border-rosewood focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-olive/20">
                {controls.clear}
              </Link>
            ) : null}
          </div>
        </form>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm font-semibold text-stone-600">
          <p>{search ? formatStorefrontCopy('catalog.showingSearchResults', locale, { count: products.length, search }) : formatStorefrontCopy('catalog.showingProducts', locale, { count: products.length })}</p>
          <nav className="flex flex-wrap gap-2" aria-label={controls.filterLabel}>
            {availabilityOptions.map((option) => (
              <Link
                key={option.value}
                href={catalogPath({ search, availability: option.value, sort })}
                className={`rounded-full px-4 py-2 transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-olive/20 ${availability === option.value ? 'bg-rosewood text-white' : 'border border-rosewood/15 bg-white text-rosewood hover:border-rosewood'}`}
              >
                {option.label}
              </Link>
            ))}
          </nav>
        </div>

        {products.length ? (
          <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product, index) => (
              <ProductCard
                key={product.slug}
                product={product}
                priority={index < ABOVE_THE_FOLD_PRODUCT_CARD_COUNT}
                locale={locale}
                returnTo={currentCatalogPath}
              />
            ))}
          </div>
        ) : (
          <div className="mt-8 rounded-2xl border border-dashed border-rosewood/20 bg-white p-10 text-center">
            <h2 className="font-display text-4xl text-rosewood">{copy('catalog.emptyTitle')}</h2>
            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-stone-600">{copy('catalog.emptyBody')}</p>
            <Link href="/products" className="mt-6 inline-flex rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white">
              {copy('catalog.emptyCta')}
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
