import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createProductVariantAction, updateProductAction, updateProductVariantAction } from '@/app/admin/actions';
import { MediaSelectWithPreview } from '@/components/admin/MediaSelectWithPreview';
import { SiteHeader } from '@/components/SiteHeader';
import { assertAdminRole } from '@/lib/admin-auth';
import type { Category, MediaItem, Product, ProductVariant } from '@/lib/catalog';
import { listAdminCategories, listAdminProducts, listMedia } from '@/lib/cms/catalog-repository';
import { getRuntimeReadiness } from '@/lib/runtime-readiness';

export const dynamic = 'force-dynamic';

const inputClass = 'rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';
const textAreaClass = 'min-h-28 rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';
const cardClass = 'rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm';

function Field({ label, name, defaultValue, type = 'text', required = true, disabled = false }: { label: string; name: string; defaultValue?: string | number; type?: string; required?: boolean; disabled?: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-rosewood">
      {label}
      <input className={inputClass} name={name} type={type} defaultValue={defaultValue} required={required} disabled={disabled} />
    </label>
  );
}

function TextArea({ label, name, defaultValue, disabled = false }: { label: string; name: string; defaultValue?: string; disabled?: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-rosewood">
      {label}
      <textarea className={textAreaClass} name={name} defaultValue={defaultValue} required disabled={disabled} />
    </label>
  );
}

function Toggle({ label, name, defaultChecked, disabled }: { label: string; name: string; defaultChecked: boolean; disabled: boolean }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-rosewood/10 bg-cream px-4 py-3 text-sm font-semibold text-rosewood">
      <input name={name} type="checkbox" defaultChecked={defaultChecked} disabled={disabled} />
      {label}
    </label>
  );
}

function categoryDefaultValue(product: Product, categories: Category[]) {
  return product.categoryId ?? categories.find((category) => category.slug === product.category)?.id ?? '';
}

function mediaForProduct(media: MediaItem[], defaultValue?: string) {
  return media.filter((item) => item.mediaCategory === 'product' || item.url === defaultValue);
}

function VariantFields({ media, productImage, variant, disabled }: { media: MediaItem[]; productImage: string; variant?: ProductVariant; disabled: boolean }) {
  const image = variant?.image ?? productImage;
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Variant name" name="name" defaultValue={variant?.name} disabled={disabled} />
        <Field label="SKU" name="sku" defaultValue={variant?.sku} disabled={disabled} />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Field label="Price" name="price" type="number" defaultValue={variant?.price ?? 0} disabled={disabled} />
        <Field label="Currency" name="currency" defaultValue={variant?.currency ?? 'CAD'} disabled={disabled} />
        <Field label="Sort order" name="sortOrder" type="number" defaultValue={variant?.sortOrder ?? 0} disabled={disabled} />
      </div>
      <MediaSelectWithPreview label="Variant image from media library" name="variantSelectedMediaUrl" media={mediaForProduct(media, image)} defaultValue={image} disabled={disabled} className={inputClass} />
      <Field label="Manual variant image URL" name="variantImageUrl" defaultValue={image} required={false} disabled={disabled} />
      <Toggle label="Active" name="isActive" defaultChecked={variant?.isActive ?? true} disabled={disabled} />
    </>
  );
}

function findProduct(products: Product[], productId: string) {
  return products.find((product) => product.id === productId || product.slug === productId);
}

function StatusBanner({ status }: { status?: string }) {
  const messages: Record<string, string> = {
    'product-updated': 'Product saved.',
    'product-variant-created': 'Variant created.',
    'product-variant-updated': 'Variant saved.'
  };
  if (!status || !messages[status]) return null;
  return <div className="mb-6 rounded-3xl border border-olive/20 bg-cream p-4 text-sm font-semibold text-olive">{messages[status]}</div>;
}

export default async function AdminProductDetailPage({ params, searchParams }: { params: Promise<{ productId: string }>; searchParams: Promise<{ status?: string }> }) {
  await assertAdminRole('staff');
  const [{ productId }, { status }] = await Promise.all([params, searchParams]);
  const [products, categories, media] = await Promise.all([listAdminProducts(), listAdminCategories(), listMedia()]);
  const product = findProduct(products, productId);
  if (!product) notFound();

  const runtimeReadiness = getRuntimeReadiness();
  const disabled = !runtimeReadiness.databaseUrlPresent || !product.id;
  const updateAction = updateProductAction.bind(null, product.id ?? '');
  const createVariantAction = createProductVariantAction.bind(null, product.id ?? '');

  return (
    <main id="main-content" tabIndex={-1}>
      <SiteHeader />
      <section className="mx-auto max-w-7xl px-5 py-14">
        <StatusBanner status={status} />
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-olive">Admin / Products</p>
            <h1 className="mt-3 font-display text-5xl text-rosewood">{product.title}</h1>
            <p className="mt-4 text-stone-600">{product.code} / {product.slug} / {product.categoryTitle || product.category}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href={`/products/${product.slug}`} className="rounded-full border border-rosewood/15 bg-white px-5 py-3 text-sm font-semibold text-rosewood" target="_blank">
              View storefront
            </Link>
            <Link href="/admin/products" className="rounded-full bg-rosewood px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20">
              Back to products
            </Link>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="grid gap-6">
          <form action={updateAction} className={`${cardClass} grid gap-5`}>
            <div>
              <h2 className="font-display text-3xl text-rosewood">Product details</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">Edit the core catalog fields for this product.</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Title" name="title" defaultValue={product.title} disabled={disabled} />
              <Field label="Slug" name="slug" defaultValue={product.slug} disabled={disabled} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Code" name="code" defaultValue={product.code} disabled={disabled} />
              <label className="grid gap-2 text-sm font-semibold text-rosewood">
                Category or subcategory
                <select className={inputClass} name="categoryId" defaultValue={categoryDefaultValue(product, categories)} disabled={disabled} required>
                  <option value="">Choose category</option>
                  {categories.map((category) => <option key={category.id ?? category.slug} value={category.id ?? ''}>{category.parentTitle ? `${category.parentTitle} / ${category.title}` : category.title}</option>)}
                </select>
              </label>
            </div>
            <TextArea label="Description" name="description" defaultValue={product.description} disabled={disabled} />
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Price" name="price" type="number" defaultValue={product.price} disabled={disabled} />
              <Field label="Currency" name="currency" defaultValue={product.currency} disabled={disabled} />
            </div>
            <MediaSelectWithPreview label="Product image from media library" name="selectedMediaUrl" media={mediaForProduct(media, product.image)} defaultValue={product.image} disabled={disabled} className={inputClass} />
            <Field label="Manual product image URL" name="imageUrl" defaultValue={product.image} required={false} disabled={disabled} />
            <div className="grid gap-3 md:grid-cols-4">
              <Toggle label="Available today" name="availableToday" defaultChecked={product.availableToday} disabled={disabled} />
              <Toggle label="Best seller" name="bestSeller" defaultChecked={Boolean(product.bestSeller)} disabled={disabled} />
              <Toggle label="Requires quote" name="requiresQuote" defaultChecked={Boolean(product.requiresQuote)} disabled={disabled} />
              <Toggle label="Active" name="isActive" defaultChecked={product.isActive ?? true} disabled={disabled} />
            </div>
            <Field label="Sort order" name="sortOrder" type="number" defaultValue={0} disabled={disabled} />
            <button className="w-fit rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none" type="submit" disabled={disabled}>
              Save product
            </button>
          </form>

          <section className={`${cardClass} grid gap-5`}>
            <div>
              <h2 className="font-display text-3xl text-rosewood">Variants and SKUs</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">Add purchasable variants with their own SKU, price, image, and active state.</p>
            </div>
            <details className="rounded-3xl border border-rosewood/10 bg-cream p-5">
              <summary className="cursor-pointer font-display text-2xl text-rosewood">Create variant</summary>
              <form action={createVariantAction} className="mt-5 grid gap-4">
                <VariantFields media={media} productImage={product.image} disabled={disabled} />
                <button className="w-fit rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none" type="submit" disabled={disabled}>
                  Create variant
                </button>
              </form>
            </details>
            {!product.variants?.length ? (
              <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-6 text-sm text-stone-600">No variants yet.</div>
            ) : (
              <div className="grid gap-4">
                {product.variants.map((variant) => (
                  <details key={variant.id} className="rounded-3xl border border-rosewood/10 bg-cream p-5">
                    <summary className="cursor-pointer list-none">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="font-display text-2xl text-rosewood">{variant.name}</h3>
                          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">{variant.sku} / {variant.price} {variant.currency} / {variant.isActive ? 'Active' : 'Inactive'}</p>
                        </div>
                        <span className="rounded-full border border-rosewood/15 bg-white px-3 py-1 text-xs font-semibold text-rosewood">Edit</span>
                      </div>
                    </summary>
                    <form action={updateProductVariantAction.bind(null, product.id ?? '', variant.id)} className="mt-5 grid gap-4">
                      <VariantFields media={media} productImage={product.image} variant={variant} disabled={disabled} />
                      <button className="w-fit rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none" type="submit" disabled={disabled}>
                        Save variant
                      </button>
                    </form>
                  </details>
                ))}
              </div>
            )}
          </section>

          </div>

          <aside className="grid content-start gap-6">
            <section className={cardClass}>
              <h2 className="font-display text-3xl text-rosewood">Preview</h2>
              <div className="relative mt-5 aspect-square overflow-hidden rounded-3xl bg-blush">
                <Image src={product.image} alt={product.title} fill className="object-cover" sizes="(min-width: 1024px) 420px, 100vw" />
              </div>
              <div className="mt-4 grid gap-2 text-sm text-stone-700">
                <p><strong>Status:</strong> {product.isActive === false ? 'Inactive' : 'Active'}</p>
                <p><strong>Category:</strong> {product.categoryTitle || product.category}</p>
                <p><strong>Price:</strong> {product.price} {product.currency}</p>
              </div>
            </section>

            <section className={cardClass}>
              <h2 className="font-display text-3xl text-rosewood">Next PIM work</h2>
              <div className="mt-4 grid gap-3 text-sm text-stone-700">
                <p>Product types, attributes, and SEO metadata will attach to this detail page in the next Phase 2 slices.</p>
              </div>
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
