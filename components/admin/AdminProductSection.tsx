import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';
import type { Category, MediaItem, Product, ProductType } from '@/lib/catalog';
import {
  bulkUpdateProductsAction,
  createProductAction,
  importProductsCsvAction,
  quickEditProductsAction
} from '@/app/admin/actions';
import { MediaSelectWithPreview } from '@/components/admin/MediaSelectWithPreview';

type ProductColumn = 'pick' | 'product' | 'category' | 'price' | 'flags' | 'actions';

type PaginationState = {
  currentPage: number;
  pageCount: number;
  total: number;
  start: number;
  end: number;
};

type AdminProductSectionProps = {
  products: Product[];
  categories: Category[];
  productTypes: ProductType[];
  media: MediaItem[];
  disabled: boolean;
  columns: ProductColumn[];
  path: string;
  pagination: PaginationState;
  paginationParams: Record<string, string | undefined>;
  columnHiddenInputs: Record<string, string | undefined>;
  showCategoryBackLink?: boolean;
  t?: (key: string) => string;
};

const inputClass = 'rounded-lg border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';
const textAreaClass = 'min-h-28 rounded-lg border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';
const toggleClass = 'flex items-center gap-3 rounded-lg border border-rosewood/10 bg-white px-4 py-3 text-sm font-semibold text-rosewood outline-none transition focus-within:ring-4 focus-within:ring-olive/20';
const primaryButtonClass = 'w-fit rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none';
const secondaryButtonClass = 'rounded-full border border-rosewood/20 px-5 py-2 text-sm font-semibold text-rosewood outline-none transition hover:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20';
const panelClass = 'scroll-mt-24 rounded-lg border border-rosewood/10 bg-white p-6 shadow-sm';
const catalogPageSize = 12;

const productColumnOptions = [
  { key: 'pick', label: 'Bulk pick' },
  { key: 'product', label: 'Product' },
  { key: 'category', label: 'Category' },
  { key: 'price', label: 'Price' },
  { key: 'flags', label: 'Flags' },
  { key: 'actions', label: 'Actions' }
] as const;

function Field({ label, name, defaultValue, placeholder, type = 'text', disabled = false, required = true }: { label: string; name: string; defaultValue?: string | number; placeholder?: string; type?: string; disabled?: boolean; required?: boolean }) {
  return <label className="grid gap-2 text-sm font-semibold text-rosewood">{label}<input className={inputClass} name={name} type={type} defaultValue={defaultValue} placeholder={placeholder} disabled={disabled} required={required} /></label>;
}

function TextArea({ label, name, defaultValue, disabled = false }: { label: string; name: string; defaultValue?: string; disabled?: boolean }) {
  return <label className="grid gap-2 text-sm font-semibold text-rosewood">{label}<textarea className={textAreaClass} name={name} defaultValue={defaultValue} disabled={disabled} required /></label>;
}

function Toggle({ label, name, defaultChecked = true, disabled = false }: { label: string; name: string; defaultChecked?: boolean; disabled?: boolean }) {
  return <label className={toggleClass}><input name={name} type="checkbox" defaultChecked={defaultChecked} disabled={disabled} />{label}</label>;
}

function SubmitButton({ children, disabled }: { children: ReactNode; disabled: boolean }) {
  return <button className={primaryButtonClass} type="submit" disabled={disabled}>{children}</button>;
}

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-4 rounded-lg border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
      <h3 className="text-lg font-bold text-stone-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-stone-600">{body}</p>
    </div>
  );
}

function paginationHref(path: string, pageParam: string, page: number, params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  if (page > 1) query.set(pageParam, String(page));
  const serialized = query.toString();
  return serialized ? `${path}?${serialized}` : path;
}

function PaginationControls({ path, pageParam, currentPage, pageCount, total, start, end, params, t = (key: string) => key }: PaginationState & { path: string; pageParam: string; params: Record<string, string | undefined>; t?: (key: string) => string }) {
  if (total <= catalogPageSize) {
    return <p className="text-sm font-semibold text-stone-600">{t('Showing')} {total} {total === 1 ? t('item') : t('items')}.</p>;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="font-semibold text-stone-600">{t('Showing')} {start}-{end} {t('of')} {total}.</p>
      <div className="flex items-center gap-2">
        <Link aria-disabled={currentPage <= 1} href={paginationHref(path, pageParam, Math.max(1, currentPage - 1), params)} className={`rounded-md border px-3 py-2 font-semibold ${currentPage <= 1 ? 'pointer-events-none border-stone-200 text-stone-300' : 'border-rosewood/20 text-rosewood hover:border-rosewood'}`}>
          {t('Previous')}
        </Link>
        <span className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2 font-semibold text-stone-700">{t('Page')} {currentPage} {t('of')} {pageCount}</span>
        <Link aria-disabled={currentPage >= pageCount} href={paginationHref(path, pageParam, Math.min(pageCount, currentPage + 1), params)} className={`rounded-md border px-3 py-2 font-semibold ${currentPage >= pageCount ? 'pointer-events-none border-stone-200 text-stone-300' : 'border-rosewood/20 text-rosewood hover:border-rosewood'}`}>
          {t('Next')}
        </Link>
      </div>
    </div>
  );
}

function ColumnVisibilityControls({ path, selected, hiddenInputs, t = (key: string) => key }: { path: string; selected: ProductColumn[]; hiddenInputs: Record<string, string | undefined>; t?: (key: string) => string }) {
  const selectedSet = new Set(selected);
  return (
    <details className="rounded-lg border border-stone-200 bg-white p-4">
      <summary className="cursor-pointer text-sm font-bold text-stone-950">{t('Product columns')}</summary>
      <form action={path} className="mt-4 grid gap-3">
        {Object.entries(hiddenInputs).map(([name, value]) => value ? <input key={name} type="hidden" name={name} value={value} /> : null)}
        <div className="flex flex-wrap gap-2">
          {productColumnOptions.map((option) => (
            <label key={option.key} className="inline-flex items-center gap-2 rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-semibold text-stone-700">
              <input type="checkbox" name="productColumns" value={option.key} defaultChecked={selectedSet.has(option.key)} />
              {t(option.label)}
            </label>
          ))}
        </div>
        <button type="submit" className="w-fit rounded-md bg-rosewood px-4 py-2 text-sm font-semibold text-white">{t('Apply columns')}</button>
      </form>
    </details>
  );
}

function categoryDefaultValue(product: Product | undefined, categories: Category[]) {
  return product?.categoryId ?? categories.find((category) => category.slug === product?.category)?.id ?? '';
}

function mediaForCategory(media: MediaItem[], mediaCategory: string, defaultValue?: string) {
  return media.filter((item) => item.mediaCategory === mediaCategory || item.url === defaultValue);
}

function MediaSelect({ label, name, media, mediaCategory, defaultValue, disabled }: { label: string; name: string; media: MediaItem[]; mediaCategory: string; defaultValue?: string; disabled: boolean }) {
  return <MediaSelectWithPreview label={label} name={name} media={mediaForCategory(media, mediaCategory, defaultValue)} defaultValue={defaultValue} disabled={disabled} className={inputClass} />;
}

function ProductFields({ product, categories, productTypes, media, disabled }: { product?: Product; categories: Category[]; productTypes: ProductType[]; media: MediaItem[]; disabled: boolean }) {
  return <><div className="grid gap-4 md:grid-cols-2"><Field label="Title" name="title" defaultValue={product?.title} disabled={disabled} /><Field label="Slug" name="slug" defaultValue={product?.slug} disabled={disabled} /></div><div className="grid gap-4 md:grid-cols-3"><Field label="Code" name="code" defaultValue={product?.code} disabled={disabled} /><label className="grid gap-2 text-sm font-semibold text-rosewood">Category or subcategory<select className={inputClass} name="categoryId" defaultValue={categoryDefaultValue(product, categories)} disabled={disabled} required><option value="">Choose category</option>{categories.map((category) => <option key={category.id ?? category.slug} value={category.id ?? ''}>{category.parentTitle ? `${category.parentTitle} / ${category.title}` : category.title}</option>)}</select></label><label className="grid gap-2 text-sm font-semibold text-rosewood">Product type<select className={inputClass} name="productTypeId" defaultValue={product?.productTypeId ?? ''} disabled={disabled}><option value="">No product type</option>{productTypes.map((productType) => <option key={productType.id} value={productType.id}>{productType.name}</option>)}</select></label></div><TextArea label="Description" name="description" defaultValue={product?.description} disabled={disabled} /><div className="grid gap-4 md:grid-cols-2"><Field label="Price" name="price" type="number" defaultValue={product?.price ?? 0} disabled={disabled} /><Field label="Currency" name="currency" defaultValue={product?.currency ?? 'CAD'} disabled={disabled} /></div><MediaSelect label="Product image from media library" name="selectedMediaUrl" media={media} mediaCategory="product" defaultValue={product?.image} disabled={disabled} /><Field label="Manual product image URL" name="imageUrl" defaultValue={product?.image} required={false} disabled={disabled} /><div className="grid gap-3 md:grid-cols-4"><Toggle label="Available today" name="availableToday" defaultChecked={product?.availableToday ?? true} disabled={disabled} /><Toggle label="Best seller" name="bestSeller" defaultChecked={product?.bestSeller ?? false} disabled={disabled} /><Toggle label="Requires quote" name="requiresQuote" defaultChecked={product?.requiresQuote ?? false} disabled={disabled} /><Toggle label="Active" name="isActive" defaultChecked={product?.isActive ?? true} disabled={disabled} /></div><Field label="Sort order" name="sortOrder" type="number" defaultValue={0} disabled={disabled} /></>;
}

function ProductBulkBar({ categories, disabled }: { categories: Category[]; disabled: boolean }) {
  return (
    <form id="bulk-products-form" action={bulkUpdateProductsAction} className="mt-8 grid gap-3 rounded-lg border border-rosewood/10 bg-white p-4 md:grid-cols-[1fr_1fr_auto]">
      <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-rosewood/70">Bulk action<select name="bulkAction" className={inputClass} disabled={disabled} defaultValue=""><option value="">Choose action...</option><option value="activate">Activate</option><option value="deactivate">Deactivate</option><option value="mark-best-seller">Mark best seller</option><option value="unmark-best-seller">Remove best seller</option><option value="mark-available-today">Mark available today</option><option value="unmark-available-today">Remove available today</option><option value="move-category">Move to category</option></select></label>
      <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-rosewood/70">Target category<select name="targetCategoryId" className={inputClass} disabled={disabled} defaultValue=""><option value="">Only needed for move...</option>{categories.map((category) => <option key={category.id ?? category.slug} value={category.id ?? ''}>{category.parentTitle ? `${category.parentTitle} / ${category.title}` : category.title}</option>)}</select></label>
      <button type="submit" className={primaryButtonClass} disabled={disabled}>Apply</button>
    </form>
  );
}

function ProductQuickEditPanel({ products, categories, disabled }: { products: Product[]; categories: Category[]; disabled: boolean }) {
  return (
    <details className="mt-4 rounded-lg border border-rosewood/10 bg-cream p-5">
      <summary className="cursor-pointer font-display text-3xl text-rosewood">Quick edit visible products</summary>
      <form action={quickEditProductsAction} className="mt-5 grid gap-4">
        {products.map((product) => (
          <div key={product.id ?? product.slug} className="grid gap-3 rounded-lg border border-rosewood/10 bg-white p-4 lg:grid-cols-[1.2fr_1fr_0.8fr_auto] lg:items-end">
            <input type="hidden" name="productId" value={product.id ?? ''} />
            <Field label="Title" name={`title:${product.id}`} defaultValue={product.title} disabled={disabled || !product.id} />
            <label className="grid gap-2 text-sm font-semibold text-rosewood">Category<select name={`categoryId:${product.id}`} className={inputClass} defaultValue={categoryDefaultValue(product, categories)} disabled={disabled || !product.id} required><option value="">Choose category</option>{categories.map((category) => <option key={category.id ?? category.slug} value={category.id ?? ''}>{category.parentTitle ? `${category.parentTitle} / ${category.title}` : category.title}</option>)}</select></label>
            <Field label="Price" name={`price:${product.id}`} type="number" defaultValue={product.price} disabled={disabled || !product.id} />
            <div className="grid gap-2"><Toggle label="Best" name={`bestSeller:${product.id}`} defaultChecked={product.bestSeller} disabled={disabled || !product.id} /><Toggle label="Today" name={`availableToday:${product.id}`} defaultChecked={product.availableToday} disabled={disabled || !product.id} /></div>
          </div>
        ))}
        <SubmitButton disabled={disabled}>Save quick edits</SubmitButton>
      </form>
    </details>
  );
}

function ProductTable({ products, disabled, columns }: { products: Product[]; disabled: boolean; columns: ProductColumn[] }) {
  const show = (column: ProductColumn) => columns.includes(column);

  if (products.length === 0) {
    return <EmptyState title="No products found" body="Create a product above, or adjust the current search, category, and product flag filters." />;
  }

  return (
    <div className="mt-4 max-h-[760px] overflow-auto rounded-lg border border-rosewood/10 bg-white [scrollbar-width:thin] [scrollbar-color:#6f2438_#fff8f1]">
      <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
        <thead className="sticky top-0 z-[1] bg-cream text-xs font-semibold uppercase tracking-[0.16em] text-rosewood/70">
          <tr>
            {show('pick') ? <th className="w-12 px-4 py-3">Pick</th> : null}
            {show('product') ? <th className="px-4 py-3">Product</th> : null}
            {show('category') ? <th className="px-4 py-3">Category</th> : null}
            {show('price') ? <th className="px-4 py-3">Price</th> : null}
            {show('flags') ? <th className="px-4 py-3">Flags</th> : null}
            {show('actions') ? <th className="px-4 py-3">Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.slug} className="border-t border-rosewood/10 align-top">
              {show('pick') ? <td className="px-4 py-4"><input form="bulk-products-form" type="checkbox" name="productId" value={product.id ?? ''} disabled={disabled || !product.id} /></td> : null}
              {show('product') ? <td className="px-4 py-4"><div className="flex gap-3"><div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-blush">{product.image ? <Image src={product.image} alt={product.title} fill className="object-cover" sizes="56px" /> : null}</div><div><div className="font-semibold text-rosewood">{product.title}</div><div className="mt-1 text-xs text-stone-500">{product.code} - {product.slug}</div></div></div></td> : null}
              {show('category') ? <td className="px-4 py-4 text-stone-700">{product.categoryTitle || product.category}</td> : null}
              {show('price') ? <td className="px-4 py-4 text-stone-700">{product.price} {product.currency}</td> : null}
              {show('flags') ? <td className="px-4 py-4"><div className="flex flex-wrap gap-2">{product.bestSeller ? <span className="rounded-full bg-rosewood px-2 py-1 text-xs font-semibold text-white">Best</span> : null}{product.availableToday ? <span className="rounded-full bg-olive px-2 py-1 text-xs font-semibold text-white">Today</span> : null}{product.requiresQuote || product.price <= 0 ? <span className="rounded-full bg-stone-800 px-2 py-1 text-xs font-semibold text-white">Quote</span> : null}{product.isActive === false ? <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">Inactive</span> : null}</div></td> : null}
              {show('actions') ? <td className="px-4 py-4"><div className="grid min-w-[32rem] gap-3"><a href={`/products/${product.slug}`} className="text-xs font-semibold text-rosewood underline-offset-4 hover:underline" target="_blank">View</a><Link href={`/admin/products/${product.id ?? product.slug}`} className="text-xs font-semibold text-rosewood underline-offset-4 hover:underline" aria-disabled={disabled || !product.id}>Edit</Link></div></td> : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdminProductSection({ products, categories, productTypes, media, disabled, columns, path, pagination, paginationParams, columnHiddenInputs, showCategoryBackLink = false, t = (key: string) => key }: AdminProductSectionProps) {
  return (
    <section id="products" className={panelClass}>
      <div className="mb-6"><p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">{t('Products')}</p><h2 className="mt-2 font-display text-4xl text-rosewood">{t('Product management')}</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">{t('Create products, assign them to categories or subcategories, control homepage flags, and update catalog imagery.')}</p></div>
      <details className="rounded-lg border border-rosewood/10 bg-cream p-5"><summary className="cursor-pointer font-display text-3xl text-rosewood">{t('Create product')}</summary><form action={createProductAction} className="mt-5 grid gap-4"><ProductFields categories={categories} productTypes={productTypes} media={media} disabled={disabled} /><SubmitButton disabled={disabled}>{t('Create product')}</SubmitButton></form></details>
      <div className="mt-4 grid gap-4 rounded-lg border border-rosewood/10 bg-white p-5 md:grid-cols-[1fr_auto] md:items-start"><details><summary className="cursor-pointer font-display text-3xl text-rosewood">{t('Import products')}</summary><form action={importProductsCsvAction} className="mt-5 grid gap-4"><label className="grid gap-2 text-sm font-semibold text-rosewood">{t('CSV file')}<input className={inputClass} name="file" type="file" accept=".csv,text/csv" required disabled={disabled} /></label><p className="text-sm leading-6 text-stone-600">{t('Use the export file as the template. Imports update existing products by code or slug and create new rows when no match exists.')}</p><SubmitButton disabled={disabled}>{t('Import CSV')}</SubmitButton></form></details><a href="/admin/products/export" className={secondaryButtonClass}>{t('Export CSV')}</a></div>
      <div className="mt-8 flex items-center justify-between gap-4"><PaginationControls path={path} pageParam="productPage" currentPage={pagination.currentPage} pageCount={pagination.pageCount} total={pagination.total} start={pagination.start} end={pagination.end} params={paginationParams} t={t} />{showCategoryBackLink ? <a href="#categories" className="text-sm font-semibold text-rosewood underline-offset-4 hover:underline">{t('Back to categories')}</a> : null}</div>
      <ProductBulkBar categories={categories} disabled={disabled} />
      <ProductQuickEditPanel products={products} categories={categories} disabled={disabled} />
      <div className="mt-4"><ColumnVisibilityControls path={path} selected={columns} hiddenInputs={columnHiddenInputs} t={t} /></div>
      <ProductTable products={products} disabled={disabled} columns={columns} />
    </section>
  );
}
