import Link from 'next/link';
import { AdminConsolePage } from '@/app/admin/AdminConsolePage';
import { listAdminProducts } from '@/lib/cms/catalog-repository';
import type { Product } from '@/lib/catalog';

export const dynamic = 'force-dynamic';

const productPageSize = 12;

type AdminProductsSearchParams = { [key: string]: string | undefined };

function parsePage(value?: string) {
  const parsed = Number.parseInt(value ?? '1', 10);
  return Number.isFinite(parsed) ? Math.max(1, parsed) : 1;
}

function includesText(value: string | undefined, search: string) {
  return value?.toLowerCase().includes(search.toLowerCase()) ?? false;
}

function productMatchesFlag(product: Product, flag?: string) {
  if (flag === 'best-seller') return Boolean(product.bestSeller);
  if (flag === 'available-today') return product.availableToday;
  if (flag === 'quote-only') return Boolean(product.requiresQuote || product.price <= 0);
  if (flag === 'inactive') return product.isActive === false;
  if (flag === 'missing-image') return !product.image;
  return true;
}

function filterProducts(products: Product[], params: AdminProductsSearchParams) {
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

function ProductPaginationBar({ params, total }: { params: AdminProductsSearchParams; total: number }) {
  const pageCount = Math.max(1, Math.ceil(total / productPageSize));
  const currentPage = Math.min(parsePage(params.productPage), pageCount);
  const start = total === 0 ? 0 : (currentPage - 1) * productPageSize + 1;
  const end = Math.min(currentPage * productPageSize, total);
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < pageCount;

  return (
    <nav aria-label="Product pagination" className="fixed bottom-4 left-4 right-4 z-50 rounded-lg border border-rosewood/15 bg-white/95 p-3 shadow-[0_18px_50px_rgba(43,29,32,0.16)] backdrop-blur lg:left-[19rem]">
      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="font-semibold text-stone-700">Showing {start}-{end} of {total} products · Page {currentPage} of {pageCount}</p>
        <div className="flex items-center gap-2">
          <Link aria-disabled={!hasPrevious} href={paginationHref(params, Math.max(1, currentPage - 1))} className={`rounded-md border px-3 py-2 font-semibold ${hasPrevious ? 'border-rosewood/20 text-rosewood hover:border-rosewood' : 'pointer-events-none border-stone-200 text-stone-300'}`}>Previous</Link>
          <Link aria-disabled={!hasNext} href={paginationHref(params, Math.min(pageCount, currentPage + 1))} className={`rounded-md border px-3 py-2 font-semibold ${hasNext ? 'border-rosewood/20 text-rosewood hover:border-rosewood' : 'pointer-events-none border-stone-200 text-stone-300'}`}>Next</Link>
        </div>
      </div>
    </nav>
  );
}

export default async function AdminProductsPage({ searchParams }: { searchParams: Promise<AdminProductsSearchParams> }) {
  const resolvedSearchParams = await searchParams;
  const products = await listAdminProducts();
  const filteredProducts = filterProducts(products, resolvedSearchParams);

  return (
    <>
      <AdminConsolePage searchParams={Promise.resolve(resolvedSearchParams)} forcedTab="catalog" catalogSection="products" activeNavKey="products" />
      <ProductPaginationBar params={resolvedSearchParams} total={filteredProducts.length} />
    </>
  );
}
