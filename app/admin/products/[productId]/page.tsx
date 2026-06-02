import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createCollectionAction, createProductAttributeAction, createProductTypeAction, createProductVariantAction, updateCollectionAction, updateProductAction, updateProductAttributeAction, updateProductAttributeValuesAction, updateProductCollectionsAction, updateProductTypeAction, updateProductVariantAction } from '@/app/admin/actions';
import { MediaSelectWithPreview } from '@/components/admin/MediaSelectWithPreview';
import { SiteHeader } from '@/components/SiteHeader';
import { assertAdminRole } from '@/lib/admin-auth';
import type { Category, Collection, MediaItem, Product, ProductAttribute, ProductAttributeValue, ProductType, ProductVariant } from '@/lib/catalog';
import { listAdminCategories, listAdminCollections, listAdminProductAttributes, listAdminProducts, listAdminProductTypes, listMedia } from '@/lib/cms/catalog-repository';
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

function TextArea({ label, name, defaultValue, required = true, disabled = false }: { label: string; name: string; defaultValue?: string; required?: boolean; disabled?: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-rosewood">
      {label}
      <textarea className={textAreaClass} name={name} defaultValue={defaultValue} required={required} disabled={disabled} />
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
        <Field label="Stock quantity" name="stockQuantity" type="number" defaultValue={variant?.stockQuantity ?? 0} disabled={disabled} />
      </div>
      <Field label="Sort order" name="sortOrder" type="number" defaultValue={variant?.sortOrder ?? 0} disabled={disabled} />
      <MediaSelectWithPreview label="Variant image from media library" name="variantSelectedMediaUrl" media={mediaForProduct(media, image)} defaultValue={image} disabled={disabled} className={inputClass} />
      <Field label="Manual variant image URL" name="variantImageUrl" defaultValue={image} required={false} disabled={disabled} />
      <Toggle label="Active" name="isActive" defaultChecked={variant?.isActive ?? true} disabled={disabled} />
    </>
  );
}

function ProductTypeSelect({ product, productTypes, disabled }: { product: Product; productTypes: ProductType[]; disabled: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-rosewood">
      Product type
      <select className={inputClass} name="productTypeId" defaultValue={product.productTypeId ?? ''} disabled={disabled}>
        <option value="">No product type</option>
        {productTypes.map((productType) => (
          <option key={productType.id} value={productType.id}>
            {productType.name}
          </option>
        ))}
      </select>
    </label>
  );
}

function ProductTypeFields({ productType, disabled }: { productType?: ProductType; disabled: boolean }) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name" name="name" defaultValue={productType?.name} disabled={disabled} />
        <Field label="Slug" name="slug" defaultValue={productType?.slug} disabled={disabled} />
      </div>
      <TextArea label="Description" name="description" defaultValue={productType?.description ?? ''} required={false} disabled={disabled} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Sort order" name="sortOrder" type="number" defaultValue={productType?.sortOrder ?? 0} disabled={disabled} />
        <Toggle label="Active" name="isActive" defaultChecked={productType?.isActive ?? true} disabled={disabled} />
      </div>
    </>
  );
}

function ProductAttributeFields({ attribute, disabled }: { attribute?: ProductAttribute; disabled: boolean }) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name" name="name" defaultValue={attribute?.name} disabled={disabled} />
        <Field label="Slug" name="slug" defaultValue={attribute?.slug} disabled={disabled} />
      </div>
      <TextArea label="Description" name="description" defaultValue={attribute?.description ?? ''} required={false} disabled={disabled} />
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-rosewood">
          Input type
          <select className={inputClass} name="inputType" defaultValue={attribute?.inputType ?? 'text'} disabled={disabled}>
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="select">Select</option>
            <option value="boolean">Boolean</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-rosewood">
          Applies to
          <select className={inputClass} name="appliesTo" defaultValue={attribute?.appliesTo ?? 'product'} disabled={disabled}>
            <option value="product">Product</option>
            <option value="variant">Variant</option>
            <option value="both">Product and variant</option>
          </select>
        </label>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Unit" name="unit" defaultValue={attribute?.unit ?? ''} required={false} disabled={disabled} />
        <Field label="Sort order" name="sortOrder" type="number" defaultValue={attribute?.sortOrder ?? 0} disabled={disabled} />
      </div>
      <TextArea label="Options" name="options" defaultValue={attribute?.options?.join('\n') ?? ''} required={false} disabled={disabled} />
      <div className="grid gap-3 md:grid-cols-3">
        <Toggle label="Filterable" name="isFilterable" defaultChecked={attribute?.isFilterable ?? false} disabled={disabled} />
        <Toggle label="Required" name="isRequired" defaultChecked={attribute?.isRequired ?? false} disabled={disabled} />
        <Toggle label="Active" name="isActive" defaultChecked={attribute?.isActive ?? true} disabled={disabled} />
      </div>
    </>
  );
}

function CollectionFields({ collection, disabled }: { collection?: Collection; disabled: boolean }) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Title" name="title" defaultValue={collection?.title} disabled={disabled} />
        <Field label="Slug" name="slug" defaultValue={collection?.slug} disabled={disabled} />
      </div>
      <TextArea label="Description" name="description" defaultValue={collection?.description ?? ''} required={false} disabled={disabled} />
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Sort order" name="sortOrder" type="number" defaultValue={collection?.sortOrder ?? 0} disabled={disabled} />
        <Toggle label="Active" name="isActive" defaultChecked={collection?.isActive ?? true} disabled={disabled} />
      </div>
    </>
  );
}

function attributesForTarget(attributes: ProductAttribute[], target: 'product' | 'variant') {
  return attributes.filter((attribute) => attribute.isActive && (attribute.appliesTo === target || attribute.appliesTo === 'both'));
}

function valueForAttribute(values: ProductAttributeValue[] | undefined, attributeId: string) {
  return values?.find((value) => value.attributeId === attributeId)?.value ?? '';
}

function AttributeValueInput({ attribute, defaultValue, disabled }: { attribute: ProductAttribute; defaultValue: string; disabled: boolean }) {
  const name = `attributeValue:${attribute.id}`;
  if (attribute.inputType === 'boolean') {
    return (
      <select className={inputClass} name={name} defaultValue={defaultValue} disabled={disabled}>
        <option value="">Unset</option>
        <option value="true">Yes</option>
        <option value="false">No</option>
      </select>
    );
  }
  if (attribute.inputType === 'select') {
    return (
      <select className={inputClass} name={name} defaultValue={defaultValue} disabled={disabled}>
        <option value="">Unset</option>
        {(attribute.options ?? []).map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    );
  }
  return <input className={inputClass} name={name} type={attribute.inputType === 'number' ? 'number' : 'text'} defaultValue={defaultValue} disabled={disabled} />;
}

function AttributeValueFields({ attributes, values, disabled }: { attributes: ProductAttribute[]; values?: ProductAttributeValue[]; disabled: boolean }) {
  if (!attributes.length) {
    return <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-6 text-sm text-stone-600">No active attributes apply here yet.</div>;
  }

  return (
    <div className="grid gap-4">
      {attributes.map((attribute) => (
        <label key={attribute.id} className="grid gap-2 text-sm font-semibold text-rosewood">
          <input type="hidden" name="attributeId" value={attribute.id} />
          <span>{attribute.name}{attribute.unit ? ` (${attribute.unit})` : ''}</span>
          <AttributeValueInput attribute={attribute} defaultValue={valueForAttribute(values, attribute.id)} disabled={disabled} />
        </label>
      ))}
    </div>
  );
}

function findProduct(products: Product[], productId: string) {
  return products.find((product) => product.id === productId || product.slug === productId);
}

function StatusBanner({ status }: { status?: string }) {
  const messages: Record<string, string> = {
    'product-updated': 'Product saved.',
    'product-variant-created': 'Variant created.',
    'product-variant-updated': 'Variant saved.',
    'product-type-created': 'Product type created.',
    'product-type-updated': 'Product type saved.',
    'product-attribute-created': 'Product attribute created.',
    'product-attribute-updated': 'Product attribute saved.',
    'product-attribute-values-updated': 'Attribute values saved.',
    'product-collection-created': 'Collection created.',
    'product-collection-updated': 'Collection saved.',
    'product-collections-updated': 'Product collections saved.'
  };
  if (!status || !messages[status]) return null;
  return <div className="mb-6 rounded-3xl border border-olive/20 bg-cream p-4 text-sm font-semibold text-olive">{messages[status]}</div>;
}

export default async function AdminProductDetailPage({ params, searchParams }: { params: Promise<{ productId: string }>; searchParams: Promise<{ status?: string }> }) {
  await assertAdminRole('staff');
  const [{ productId }, { status }] = await Promise.all([params, searchParams]);
  const [products, categories, productTypes, productAttributes, collections, media] = await Promise.all([listAdminProducts(), listAdminCategories(), listAdminProductTypes(), listAdminProductAttributes(), listAdminCollections(), listMedia()]);
  const product = findProduct(products, productId);
  if (!product) notFound();

  const runtimeReadiness = getRuntimeReadiness();
  const disabled = !runtimeReadiness.databaseUrlPresent || !product.id;
  const updateAction = updateProductAction.bind(null, product.id ?? '');
  const createVariantAction = createProductVariantAction.bind(null, product.id ?? '');
  const currentProductType = productTypes.find((productType) => productType.id === product.productTypeId);
  const productValueAttributes = attributesForTarget(productAttributes, 'product');
  const variantValueAttributes = attributesForTarget(productAttributes, 'variant');
  const productCollectionIds = new Set(product.collections?.map((collection) => collection.id) ?? []);

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
            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Code" name="code" defaultValue={product.code} disabled={disabled} />
              <label className="grid gap-2 text-sm font-semibold text-rosewood">
                Category or subcategory
                <select className={inputClass} name="categoryId" defaultValue={categoryDefaultValue(product, categories)} disabled={disabled} required>
                  <option value="">Choose category</option>
                  {categories.map((category) => <option key={category.id ?? category.slug} value={category.id ?? ''}>{category.parentTitle ? `${category.parentTitle} / ${category.title}` : category.title}</option>)}
                </select>
              </label>
              <ProductTypeSelect product={product} productTypes={productTypes} disabled={disabled} />
            </div>
            <TextArea label="Description" name="description" defaultValue={product.description} disabled={disabled} />
            <div className="rounded-3xl border border-rosewood/10 bg-cream p-5">
              <h3 className="font-display text-2xl text-rosewood">SEO</h3>
              <div className="mt-4 grid gap-4">
                <Field label="SEO title" name="seoTitle" defaultValue={product.seoTitle ?? ''} required={false} disabled={disabled} />
                <TextArea label="SEO description" name="seoDescription" defaultValue={product.seoDescription ?? ''} required={false} disabled={disabled} />
                <Field label="Canonical path" name="canonicalPath" defaultValue={product.canonicalPath ?? ''} required={false} disabled={disabled} />
                <Toggle label="Search index" name="seoIndex" defaultChecked={product.seoIndex ?? true} disabled={disabled} />
              </div>
            </div>
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
              <h2 className="font-display text-3xl text-rosewood">Product attribute values</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">Set structured catalog details that apply to this product.</p>
            </div>
            <form action={updateProductAttributeValuesAction.bind(null, product.id ?? '', 'product', product.id ?? '')} className="grid gap-4">
              <AttributeValueFields attributes={productValueAttributes} values={product.attributeValues} disabled={disabled} />
              <button className="w-fit rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none" type="submit" disabled={disabled || !productValueAttributes.length}>
                Save product values
              </button>
            </form>
          </section>

          <section className={`${cardClass} grid gap-5`}>
            <div>
              <h2 className="font-display text-3xl text-rosewood">Collections</h2>
              <p className="mt-2 text-sm leading-6 text-stone-600">Assign this product to merchandising collections separate from category navigation.</p>
            </div>
            <form action={updateProductCollectionsAction.bind(null, product.id ?? '')} className="grid gap-4">
              {!collections.length ? (
                <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-6 text-sm text-stone-600">No collections yet.</div>
              ) : (
                <div className="grid gap-3 md:grid-cols-2">
                  {collections.map((collection) => (
                    <label key={collection.id} className="flex items-start gap-3 rounded-2xl border border-rosewood/10 bg-cream p-4 text-sm font-semibold text-rosewood">
                      <input name="collectionId" type="checkbox" value={collection.id} defaultChecked={productCollectionIds.has(collection.id)} disabled={disabled} />
                      <span>
                        <span className="block">{collection.title}</span>
                        <span className="mt-1 block text-xs font-medium text-stone-500">{collection.slug} / {collection.productCount ?? 0} products</span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
              <button className="w-fit rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none" type="submit" disabled={disabled}>
                Save collections
              </button>
            </form>
          </section>

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
                          <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">{variant.sku} / {variant.price} {variant.currency} / Stock {variant.stockQuantity} / {variant.isActive ? 'Active' : 'Inactive'}</p>
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
                    <form action={updateProductAttributeValuesAction.bind(null, product.id ?? '', 'variant', variant.id)} className="mt-5 grid gap-4 rounded-3xl border border-rosewood/10 bg-white p-5">
                      <h4 className="font-display text-2xl text-rosewood">Variant attribute values</h4>
                      <AttributeValueFields attributes={variantValueAttributes} values={variant.attributeValues} disabled={disabled} />
                      <button className="w-fit rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none" type="submit" disabled={disabled || !variantValueAttributes.length}>
                        Save variant values
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
                <p>Attribute values and SEO metadata will attach to this detail page in the next Phase 2 slices.</p>
              </div>
            </section>

            <section className={`${cardClass} grid gap-5`}>
              <div>
                <h2 className="font-display text-3xl text-rosewood">Product types</h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">Group products by shared catalog structure before adding reusable attributes.</p>
                <p className="mt-2 text-sm font-semibold text-stone-700">Current: {currentProductType?.name ?? 'No product type'}</p>
              </div>
              <details className="rounded-3xl border border-rosewood/10 bg-cream p-5">
                <summary className="cursor-pointer font-display text-2xl text-rosewood">Create product type</summary>
                <form action={createProductTypeAction} className="mt-5 grid gap-4">
                  <input type="hidden" name="returnProductId" value={product.id ?? product.slug} />
                  <ProductTypeFields disabled={disabled} />
                  <button className="w-fit rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none" type="submit" disabled={disabled}>
                    Create type
                  </button>
                </form>
              </details>
              {!productTypes.length ? (
                <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-6 text-sm text-stone-600">No product types yet.</div>
              ) : (
                <div className="grid gap-3">
                  {productTypes.map((productType) => (
                    <details key={productType.id} className="rounded-3xl border border-rosewood/10 bg-cream p-5">
                      <summary className="cursor-pointer list-none">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h3 className="font-display text-2xl text-rosewood">{productType.name}</h3>
                            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">{productType.slug} / {productType.productCount ?? 0} products / {productType.isActive ? 'Active' : 'Inactive'}</p>
                          </div>
                          <span className="rounded-full border border-rosewood/15 bg-white px-3 py-1 text-xs font-semibold text-rosewood">Edit</span>
                        </div>
                      </summary>
                      <form action={updateProductTypeAction.bind(null, productType.id)} className="mt-5 grid gap-4">
                        <input type="hidden" name="returnProductId" value={product.id ?? product.slug} />
                        <ProductTypeFields productType={productType} disabled={disabled} />
                        <button className="w-fit rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none" type="submit" disabled={disabled}>
                          Save type
                        </button>
                      </form>
                    </details>
                  ))}
                </div>
              )}
            </section>

            <section className={`${cardClass} grid gap-5`}>
              <div>
                <h2 className="font-display text-3xl text-rosewood">Collection library</h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">Create and edit merchandising collections that can group products across categories.</p>
              </div>
              <details className="rounded-3xl border border-rosewood/10 bg-cream p-5">
                <summary className="cursor-pointer font-display text-2xl text-rosewood">Create collection</summary>
                <form action={createCollectionAction} className="mt-5 grid gap-4">
                  <input type="hidden" name="returnProductId" value={product.id ?? product.slug} />
                  <CollectionFields disabled={disabled} />
                  <button className="w-fit rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none" type="submit" disabled={disabled}>
                    Create collection
                  </button>
                </form>
              </details>
              {!collections.length ? (
                <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-6 text-sm text-stone-600">No collections yet.</div>
              ) : (
                <div className="grid gap-3">
                  {collections.map((collection) => (
                    <details key={collection.id} className="rounded-3xl border border-rosewood/10 bg-cream p-5">
                      <summary className="cursor-pointer list-none">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h3 className="font-display text-2xl text-rosewood">{collection.title}</h3>
                            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">{collection.slug} / {collection.productCount ?? 0} products / {collection.isActive ? 'Active' : 'Inactive'}</p>
                          </div>
                          <span className="rounded-full border border-rosewood/15 bg-white px-3 py-1 text-xs font-semibold text-rosewood">Edit</span>
                        </div>
                      </summary>
                      <form action={updateCollectionAction.bind(null, collection.id)} className="mt-5 grid gap-4">
                        <input type="hidden" name="returnProductId" value={product.id ?? product.slug} />
                        <CollectionFields collection={collection} disabled={disabled} />
                        <button className="w-fit rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none" type="submit" disabled={disabled}>
                          Save collection
                        </button>
                      </form>
                    </details>
                  ))}
                </div>
              )}
            </section>

            <section className={`${cardClass} grid gap-5`}>
              <div>
                <h2 className="font-display text-3xl text-rosewood">Attributes</h2>
                <p className="mt-2 text-sm leading-6 text-stone-600">Reusable product and variant fields for catalog details, filters, and future structured values.</p>
              </div>
              <details className="rounded-3xl border border-rosewood/10 bg-cream p-5">
                <summary className="cursor-pointer font-display text-2xl text-rosewood">Create attribute</summary>
                <form action={createProductAttributeAction} className="mt-5 grid gap-4">
                  <input type="hidden" name="returnProductId" value={product.id ?? product.slug} />
                  <ProductAttributeFields disabled={disabled} />
                  <button className="w-fit rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none" type="submit" disabled={disabled}>
                    Create attribute
                  </button>
                </form>
              </details>
              {!productAttributes.length ? (
                <div className="rounded-3xl border border-dashed border-stone-300 bg-stone-50 p-6 text-sm text-stone-600">No reusable attributes yet.</div>
              ) : (
                <div className="grid gap-3">
                  {productAttributes.map((attribute) => (
                    <details key={attribute.id} className="rounded-3xl border border-rosewood/10 bg-cream p-5">
                      <summary className="cursor-pointer list-none">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <h3 className="font-display text-2xl text-rosewood">{attribute.name}</h3>
                            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">{attribute.slug} / {attribute.inputType} / {attribute.appliesTo} / {attribute.isActive ? 'Active' : 'Inactive'}</p>
                          </div>
                          <span className="rounded-full border border-rosewood/15 bg-white px-3 py-1 text-xs font-semibold text-rosewood">Edit</span>
                        </div>
                      </summary>
                      <form action={updateProductAttributeAction.bind(null, attribute.id)} className="mt-5 grid gap-4">
                        <input type="hidden" name="returnProductId" value={product.id ?? product.slug} />
                        <ProductAttributeFields attribute={attribute} disabled={disabled} />
                        <button className="w-fit rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none" type="submit" disabled={disabled}>
                          Save attribute
                        </button>
                      </form>
                    </details>
                  ))}
                </div>
              )}
            </section>
          </aside>
        </div>
      </section>
    </main>
  );
}
