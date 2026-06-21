import Link from 'next/link';
import { AdminConsolePage } from '@/app/admin/AdminConsolePage';
import { listAdminProductFilterIndex, type AdminProductFilterIndexItem } from '@/lib/admin/admin-product-filter-index';
import { requireAdminRouteSession } from '@/lib/admin-page-auth-boundary';
import { resolveStorefrontLocale } from '@/lib/i18n/resolve-locale';
import { createAdminCatalogPageTranslator } from '@/lib/localization/admin-catalog-page-copy';
import type { SupportedLocale } from '@/lib/i18n/locales';

export const dynamic = 'force-dynamic';

const productPageSize = 12;

type AdminProductsSearchParams = { [key: string]: string | undefined };

const workflowFilters = [
  { key: 'missing-image', labelKey: 'Missing image' },
  { key: 'inactive', labelKey: 'Inactive' },
  { key: 'quote-only', labelKey: 'Quote only' },
  { key: 'available-today', labelKey: 'Available today' },
  { key: 'best-seller', labelKey: 'Best sellers' }
] as const;

const productWorkflowCopy = {
  'en-CA': {
    eyebrow: 'Catalog workflow',
    title: 'Product fix-it queue',
    body: 'Use these shortcuts to review incomplete products, merchandising flags, and everyday catalog cleanup before opening full product details.',
    create: 'Create product',
    empty: 'No routine product cleanup is waiting.',
    open: 'Open details'
  },
  'fa-IR': {
    eyebrow: 'گردش کار کاتالوگ',
    title: 'صف بررسی محصول',
    body: 'از این میانبرها برای بررسی محصولات ناقص، پرچم‌های نمایش و پاکسازی روزانه کاتالوگ پیش از باز کردن جزئیات کامل استفاده کنید.',
    create: 'ایجاد محصول',
    empty: 'موردی برای پاکسازی معمول محصول در انتظار نیست.',
    open: 'باز کردن جزئیات'
  }
} as const;

function parsePage(value?: string) {
  const parsed = Number.parseInt(value ?? '1', 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 1;
}

function includesText(value: string | undefined, search: string) {
  return value?.toLowerCase().includes(search.toLowerCase()) ?? false;
}

function productMatchesFlag(product: AdminProductFilterIndexItem, flag?: string) {
  if (flag === 'best-seller') return Boolean(product.bestSeller);
  if (flag === 'available-today') return product.availableToday;
  if (flag === 'quote-only') return Boolean(product.requiresQuote || product.price <= 0);
  if (flag === 'inactive') return product.isActive === false;
  if (flag === 'missing-image') return !product.image;
  return true;
}

function filterProducts(products: AdminProductFilterIndexItem[], params: AdminProductsSearchParams) {
  const search = params.catalogSearch?.trim();
  return products.filter((product) => {
    const matchesSearch = !search || includesText(product.title, search) || includesText(product.code, search) || includesText(product.slug, search) || includesText(product.description, search);
    const matchesCategory = !params.catalogCategory || product.category === params.catalogCategory;
    return matchesSearch && matchesCategory && productMatchesFlag(product, params.catalogFlag);
  });
}

function paginationHref(params: AdminProductsSearchParams, page: number) {
  const query = new URLSearchParams();
  ['catalogSearch', 'catalogCategory', 'catalogFlag', 'productColumns', 'mediaColumns'].forEach((key) => {
    const value = params[key];
    if (value) query.set(key, value);
  });
  if (page > 1) query.set('productPage', String(page));
  const serialized = query.toString();
  return serialized ? `/admin/products?${serialized}` : '/admin/products';
}

function workflowHref(flag?: string) {
  const query = new URLSearchParams();
  if (flag) query.set('catalogFlag', flag);
  const serialized = query.toString();
  return serialized ? `/admin/products?${serialized}` : '/admin/products';
}

function ProductWorkflowPanel({ products, locale }: { products: AdminProductFilterIndexItem[]; locale: SupportedLocale }) {
  const copy = productWorkflowCopy[locale];
  const t = createAdminCatalogPageTranslator(locale);
  const counts = workflowFilters.map((filter) => ({ ...filter, count: products.filter((product) => productMatchesFlag(product, filter.key)).length }));
  const needsReview = products.filter((product) => !product.image || product.isActive === false || product.requiresQuote || product.price <= 0).slice(0, 5);

  return (
    <section className="admin-shell-prelude bg-cream px-4 pt-4 sm:px-6 lg:px-8" aria-labelledby="product-workflow-title">
      <div className="mx-auto grid max-w-7xl gap-4 rounded-xl border border-rosewood/10 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-rosewood/60">{copy.eyebrow}</p>
            <h2 id="product-workflow-title" className="mt-1 text-xl font-semibold text-stone-900">{copy.title}</h2>
            <p className="mt-1 max-w-3xl text-sm text-stone-600">{copy.body}</p>
          </div>
          <Link href="/admin/products#products" className="rounded-full bg-rosewood px-4 py-2 text-sm font-semibold text-white">{copy.create}</Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {counts.map((item) => (
            <Link key={item.key} href={workflowHref(item.key)} className="rounded-full border border-rosewood/15 px-3 py-2 text-sm font-semibold text-rosewood hover:border-rosewood">
              {t(item.labelKey)}: {item.count}
            </Link>
          ))}
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
          {needsReview.length === 0 ? (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm font-semibold text-emerald-800 sm:col-span-2 lg:col-span-5">{copy.empty}</p>
          ) : needsReview.map((product) => (
            <Link key={product.slug} href={`/admin/products/${product.slug}`} className="rounded-lg border border-stone-200 p-3 text-sm hover:border-rosewood/40">
              <span className="block font-semibold text-stone-900">{product.title}</span>
              <span className="mt-1 block text-xs text-stone-500">{product.code || product.slug}</span>
              <span className="mt-2 block text-xs font-semibold text-rosewood">{copy.open}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductPaginationBar({ params, total, locale }: { params: AdminProductsSearchParams; total: number; locale: SupportedLocale }) {
  const t = createAdminCatalogPageTranslator(locale);
  const pageCount = Math.max(1, Math.ceil(total / productPageSize));
  const currentPage = Math.min(parsePage(params.productPage), pageCount);
  const start = total === 0 ? 0 : (currentPage - 1) * productPageSize + 1;
  const end = Math.min(currentPage * productPageSize, total);
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < pageCount;

  return (
    <nav aria-label={t('catalogPagination')} className="fixed bottom-4 left-4 right-4 z-50 rounded-lg border border-rosewood/15 bg-white/95 p-3 shadow-[0_18px_50px_rgba(43,29,32,0.16)] backdrop-blur lg:left-[19rem]">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="font-semibold text-stone-700">{t('showing')} {start}-{end} {t('of')} {total} {t('itemLabel')} · {t('page')} {currentPage} {t('of')} {pageCount}</p>
        <div className="flex items-center gap-2">
          <Link aria-disabled={!hasPrevious} href={paginationHref(params, Math.max(1, currentPage - 1))} className={`rounded-md border px-3 py-2 font-semibold ${hasPrevious ? 'border-rosewood/20 text-rosewood hover:border-rosewood' : 'pointer-events-none border-stone-200 text-stone-300'}`}>{t('previous')}</Link>
          <Link aria-disabled={!hasNext} href={paginationHref(params, Math.min(pageCount, currentPage + 1))} className={`rounded-md border px-3 py-2 font-semibold ${hasNext ? 'border-rosewood/20 text-rosewood hover:border-rosewood' : 'pointer-events-none border-stone-200 text-stone-300'}`}>{t('next')}</Link>
        </div>
      </div>
    </nav>
  );
}

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<AdminProductsSearchParams> }) {
  await requireAdminRouteSession();

  const searchParamsPromise = searchParams;
  const localePromise = resolveStorefrontLocale();
  const productFilterIndexPromise = listAdminProductFilterIndex();

  const [resolvedSearchParams, locale, productFilterIndex] = await Promise.all([
    searchParamsPromise,
    localePromise,
    productFilterIndexPromise
  ]);
  const filteredProducts = filterProducts(productFilterIndex, resolvedSearchParams);

  return (
    <>
      <ProductWorkflowPanel products={productFilterIndex} locale={locale} />
      <AdminConsolePage searchParams={Promise.resolve(resolvedSearchParams)} forcedTab="catalog" catalogSection="products" activeNavKey="products" />
      <ProductPaginationBar params={resolvedSearchParams} total={filteredProducts.length} locale={locale} />
    </>
  );
}
