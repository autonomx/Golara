import Image from 'next/image';
import type { Category, HomepageContent, MediaItem, Product } from '@/lib/catalog';
import { logoutAction } from '@/app/admin/logout/actions';
import { AdminQuickNav } from '@/components/admin/AdminQuickNav';
import { AdminReadinessPanel } from '@/components/admin/AdminReadinessPanel';
import {
  createCategoryAction,
  createMediaFromUrlAction,
  createProductAction,
  updateCategoryAction,
  updateHomepageAction,
  updateProductAction,
  uploadMediaAction
} from '@/app/admin/actions';
import type { RuntimeReadiness } from '@/lib/runtime-readiness';

type AdminDashboardProps = {
  categories: Category[];
  products: Product[];
  homepage: HomepageContent;
  media: MediaItem[];
  runtimeReadiness: RuntimeReadiness;
  authConfigured: boolean;
  authenticated: boolean;
  notificationMode: string;
  hasProductionStorage: boolean;
  status?: string;
  message?: string;
};

const statusLabels: Record<string, string> = {
  'homepage-updated': 'Homepage saved.',
  'category-created': 'Category created.',
  'category-updated': 'Category updated.',
  'product-created': 'Product created.',
  'product-updated': 'Product updated.',
  'media-created': 'Media URL added.',
  'media-uploaded': 'Image uploaded.'
};

const inputClass = 'rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';
const textAreaClass = 'min-h-28 rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';
const toggleClass = 'flex items-center gap-3 rounded-2xl border border-rosewood/10 bg-white px-4 py-3 text-sm font-semibold text-rosewood outline-none transition focus-within:ring-4 focus-within:ring-olive/20';
const primaryButtonClass = 'rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none';
const secondaryButtonClass = 'rounded-full border border-rosewood/20 px-5 py-2 text-sm font-semibold text-rosewood outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20';

function Field({ label, name, defaultValue, placeholder, type = 'text', required = true, disabled = false }: { label: string; name: string; defaultValue?: string | number; placeholder?: string; type?: string; required?: boolean; disabled?: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-rosewood">
      {label}
      <input className={inputClass} name={name} type={type} defaultValue={defaultValue} placeholder={placeholder} required={required} disabled={disabled} />
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

function Toggle({ label, name, defaultChecked = true, disabled = false }: { label: string; name: string; defaultChecked?: boolean; disabled?: boolean }) {
  return (
    <label className={toggleClass}>
      <input name={name} type="checkbox" defaultChecked={defaultChecked} disabled={disabled} />
      {label}
    </label>
  );
}

function SubmitButton({ children, disabled }: { children: React.ReactNode; disabled: boolean }) {
  return <button className={primaryButtonClass} type="submit" disabled={disabled}>{children}</button>;
}

function categoryDefaultValue(product: Product, categories: Category[]) {
  return product.categoryId ?? categories.find((category) => category.slug === product.category)?.id ?? '';
}

function StatusBanner({ status, message }: { status?: string; message?: string }) {
  if (!status && !message) return null;
  const isError = status === 'error';
  return <section className={`rounded-[2rem] border p-5 text-sm font-semibold ${isError ? 'border-red-200 bg-red-50 text-red-800' : 'border-olive/20 bg-white text-olive'}`}>{message || statusLabels[status ?? ''] || status}</section>;
}

export function AdminDashboard({ categories, products, homepage, media, runtimeReadiness, authConfigured, authenticated, notificationMode, hasProductionStorage, status, message }: AdminDashboardProps) {
  const databaseReady = runtimeReadiness.databaseUrlPresent;
  const disabled = !databaseReady || !authenticated;

  return (
    <div className="space-y-12">
      <StatusBanner status={status} message={message} />
      <AdminQuickNav />
      <AdminReadinessPanel runtimeReadiness={runtimeReadiness} authConfigured={authConfigured} authenticated={authenticated} notificationMode={notificationMode} hasProductionStorage={hasProductionStorage} />

      <section className={`rounded-[2rem] border p-6 ${databaseReady && authenticated ? 'border-olive/20 bg-white' : 'border-amber-300 bg-amber-50'}`}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">CMS status</p>
            <h2 className="mt-3 font-display text-3xl text-rosewood">{databaseReady && authenticated ? 'Editing enabled' : databaseReady ? 'Login required' : 'Seeded preview mode'}</h2>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-700">{databaseReady && authenticated ? 'Admin forms are live. Changes write to Prisma, then revalidate storefront pages.' : databaseReady ? 'The database is connected, but CMS writes require admin authentication.' : 'The storefront is reading seeded fallback content. Add DATABASE_URL, run npm run db:push and npm run db:seed, then restart the app to enable editing.'}</p>
          </div>
          {authenticated ? <form action={logoutAction}><button className={secondaryButtonClass} type="submit">Sign out</button></form> : null}
        </div>
      </section>

      <section id="media" className="scroll-mt-8 rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">Media library</p>
          <h2 className="mt-2 font-display text-4xl text-rosewood">Images</h2>
          <p className="mt-3 text-sm leading-6 text-stone-600">Register external image URLs or upload local/dev images into <code>public/uploads</code>. For production, this can later move to S3, Cloudinary, or another object store.</p>
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <form action={createMediaFromUrlAction} className="grid gap-4 rounded-3xl border border-rosewood/10 bg-cream p-5">
            <h3 className="font-display text-3xl text-rosewood">Add image URL</h3>
            <Field label="Image URL" name="url" placeholder="https://..." disabled={disabled} />
            <Field label="Alt text" name="alt" placeholder="Blush rose bouquet" disabled={disabled} />
            <SubmitButton disabled={disabled}>Add media</SubmitButton>
          </form>
          <form action={uploadMediaAction} className="grid gap-4 rounded-3xl border border-rosewood/10 bg-cream p-5">
            <h3 className="font-display text-3xl text-rosewood">Upload image</h3>
            <label className="grid gap-2 text-sm font-semibold text-rosewood">Image file<input className={inputClass} name="file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" required disabled={disabled} /></label>
            <Field label="Alt text" name="alt" placeholder="Optional descriptive text" required={false} disabled={disabled} />
            <SubmitButton disabled={disabled}>Upload image</SubmitButton>
          </form>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {media.map((item) => (
            <article key={item.url} className="overflow-hidden rounded-3xl border border-rosewood/10 bg-cream shadow-sm">
              <div className="relative aspect-square bg-blush"><Image src={item.url} alt={item.alt} fill className="object-cover" sizes="25vw" /></div>
              <div className="space-y-2 p-4"><p className="text-sm font-semibold text-rosewood">{item.alt}</p><p className="break-all text-xs text-stone-500">{item.url}</p></div>
            </article>
          ))}
        </div>
      </section>

      <section id="homepage" className="scroll-mt-8 rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
        <div className="mb-6"><p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">Homepage</p><h2 className="mt-2 font-display text-4xl text-rosewood">Hero content</h2></div>
        <form action={updateHomepageAction} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2"><Field label="Eyebrow" name="eyebrow" defaultValue={homepage.eyebrow} disabled={disabled} /><Field label="Title" name="title" defaultValue={homepage.title} disabled={disabled} /></div>
          <TextArea label="Body" name="body" defaultValue={homepage.body} disabled={disabled} />
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Primary CTA label" name="primaryCtaLabel" defaultValue={homepage.primaryCtaLabel} disabled={disabled} />
            <Field label="Primary CTA URL" name="primaryCtaHref" defaultValue={homepage.primaryCtaHref} disabled={disabled} />
            <Field label="Secondary CTA label" name="secondaryCtaLabel" defaultValue={homepage.secondaryCtaLabel} disabled={disabled} />
            <Field label="Secondary CTA URL" name="secondaryCtaHref" defaultValue={homepage.secondaryCtaHref} disabled={disabled} />
            <Field label="Panel eyebrow" name="panelEyebrow" defaultValue={homepage.panelEyebrow} disabled={disabled} />
            <Field label="Panel title" name="panelTitle" defaultValue={homepage.panelTitle} disabled={disabled} />
          </div>
          <TextArea label="Panel body" name="panelBody" defaultValue={homepage.panelBody} disabled={disabled} />
          <SubmitButton disabled={disabled}>Save homepage</SubmitButton>
        </form>
      </section>

      <section id="categories" className="scroll-mt-8 rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
        <div className="mb-6"><p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">Categories</p><h2 className="mt-2 font-display text-4xl text-rosewood">Create category</h2></div>
        <form action={createCategoryAction} className="grid gap-4">
          <CategoryFields categories={categories} media={media} disabled={disabled} />
          <SubmitButton disabled={disabled}>Create category</SubmitButton>
        </form>
        <div className="mt-8 grid gap-5">
          {categories.map((category) => (
            <form key={category.slug} action={updateCategoryAction.bind(null, category.id ?? '')} className="grid gap-4 rounded-3xl border border-rosewood/10 bg-cream p-5">
              <CategoryFields category={category} categories={categories} media={media} disabled={disabled || !category.id} />
              <SubmitButton disabled={disabled || !category.id}>Update category</SubmitButton>
            </form>
          ))}
        </div>
      </section>

      <section id="products" className="scroll-mt-8 rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
        <div className="mb-6"><p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">Products</p><h2 className="mt-2 font-display text-4xl text-rosewood">Create product</h2></div>
        <form action={createProductAction} className="grid gap-4"><ProductFields categories={categories} media={media} disabled={disabled} /><SubmitButton disabled={disabled}>Create product</SubmitButton></form>
        <div className="mt-8 grid gap-5">{products.map((product) => <form key={product.slug} action={updateProductAction.bind(null, product.id ?? '')} className="grid gap-4 rounded-3xl border border-rosewood/10 bg-cream p-5"><ProductFields product={product} categories={categories} media={media} disabled={disabled || !product.id} /><SubmitButton disabled={disabled || !product.id}>Update product</SubmitButton></form>)}</div>
      </section>
    </div>
  );
}

function CategoryFields({ category, categories, media, disabled }: { category?: Category; categories: Category[]; media: MediaItem[]; disabled: boolean }) {
  const mediaUrls = new Set(media.map((item) => item.url));
  const selectedMediaUrl = category?.image && mediaUrls.has(category.image) ? category.image : '';
  const manualImageUrl = category?.image && !mediaUrls.has(category.image) ? category.image : '';
  const parentOptions = categories.filter((option) => option.id && option.id !== category?.id);

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Title" name="title" defaultValue={category?.title} placeholder="Flower Boxes" disabled={disabled} />
        <Field label="Slug" name="slug" defaultValue={category?.slug} placeholder="flower-boxes" required={false} disabled={disabled} />
        <Field label="Eyebrow" name="eyebrow" defaultValue={category?.eyebrow} placeholder="Signature gifts" disabled={disabled} />
        <Field label="Sort order" name="sortOrder" type="number" defaultValue={category?.sortOrder ?? 100} disabled={disabled} />
      </div>
      <label className="grid gap-2 text-sm font-semibold text-rosewood">Parent category<select className={inputClass} name="parentId" defaultValue={category?.parentId ?? ''} disabled={disabled}><option value="">No parent category</option>{parentOptions.map((option) => <option key={option.id} value={option.id}>{option.title}</option>)}</select></label>
      <label className="grid gap-2 text-sm font-semibold text-rosewood">Category image from media library<select className={inputClass} name="categorySelectedMediaUrl" defaultValue={selectedMediaUrl} disabled={disabled}><option value="">Use manual category image URL below</option>{media.map((item) => <option key={item.url} value={item.url}>{item.alt}</option>)}</select></label>
      <Field label="Manual category image URL" name="categoryImageUrl" defaultValue={manualImageUrl} placeholder="/seed-images/category-real/flower-boxes or /uploads/file.webp" required={false} disabled={disabled} />
      <TextArea label="Description" name="description" defaultValue={category?.description} disabled={disabled} />
      <div className="grid gap-3 md:grid-cols-3">
        <Toggle label="Visible on storefront" name="isActive" defaultChecked={category?.isActive !== false} disabled={disabled} />
        <Toggle label="Show on homepage" name="showOnHomepage" defaultChecked={category?.showOnHomepage !== false} disabled={disabled} />
      </div>
    </>
  );
}

function ProductFields({ product, categories, media, disabled }: { product?: Product; categories: Category[]; media: MediaItem[]; disabled: boolean }) {
  const selectedCategory = product ? categoryDefaultValue(product, categories) : categories[0]?.id ?? '';
  const mediaUrls = new Set(media.map((item) => item.url));
  const selectedMediaUrl = product?.image && mediaUrls.has(product.image) ? product.image : '';

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Title" name="title" defaultValue={product?.title} placeholder="Rose Garden Box" disabled={disabled} />
        <Field label="Slug" name="slug" defaultValue={product?.slug} placeholder="rose-garden-box" required={false} disabled={disabled} />
        <Field label="Product code" name="code" defaultValue={product?.code} placeholder="GL-4001" disabled={disabled} />
        <Field label="Price" name="price" type="number" defaultValue={product?.price ?? 0} disabled={disabled} />
        <Field label="Currency" name="currency" defaultValue={product?.currency ?? 'CAD'} disabled={disabled} />
        <label className="grid gap-2 text-sm font-semibold text-rosewood">Category<select className={inputClass} name="categoryId" defaultValue={selectedCategory} required disabled={disabled}>{categories.map((category) => <option key={category.slug} value={category.id ?? ''}>{category.parentTitle ? `${category.parentTitle} / ${category.title}` : category.title}</option>)}</select></label>
      </div>
      <label className="grid gap-2 text-sm font-semibold text-rosewood">Media library image<select className={inputClass} name="selectedMediaUrl" defaultValue={selectedMediaUrl} disabled={disabled}><option value="">Use manual image URL below</option>{media.map((item) => <option key={item.url} value={item.url}>{item.alt}</option>)}</select></label>
      <Field label="Manual image URL" name="imageUrl" defaultValue={product?.image} placeholder="https://... or /uploads/file.webp" required={false} disabled={disabled} />
      <TextArea label="Description" name="description" defaultValue={product?.description} disabled={disabled} />
      <div className="grid gap-3 md:grid-cols-4">
        <Toggle label="Visible on storefront" name="isActive" defaultChecked={product?.isActive !== false} disabled={disabled} />
        <Toggle label="Best seller" name="bestSeller" defaultChecked={Boolean(product?.bestSeller)} disabled={disabled} />
        <Toggle label="Available today" name="availableToday" defaultChecked={Boolean(product?.availableToday)} disabled={disabled} />
        <Toggle label="Manual purchase" name="requiresQuote" defaultChecked={Boolean(product?.requiresQuote)} disabled={disabled} />
      </div>
    </>
  );
}
