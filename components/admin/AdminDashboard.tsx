import Image from 'next/image';
import type { Category, HomepageContent, HomepageTranslation, MediaItem, Product } from '@/lib/catalog';
import { logoutAction } from '@/app/admin/logout/actions';
import { AdminReadinessPanel } from '@/components/admin/AdminReadinessPanel';
import { AdminSecurityPanel } from '@/components/admin/AdminSecurityPanel';
import { AdminTranslationPanel } from '@/components/admin/AdminTranslationPanel';
import { MediaSelectWithPreview } from '@/components/admin/MediaSelectWithPreview';
import { homepageBannerSlides, homepageBestSellerImage, homepageCategoryImage } from '@/lib/homepage-assets';
import {
  bulkUpdateProductsAction,
  createCategoryAction,
  createMediaFromUrlAction,
  createProductAction,
  updateMediaAction,
  updateMediaCategoryAction,
  updateCategoryAction,
  updateHomepageAction,
  updateProductAction,
  uploadMediaAction
} from '@/app/admin/actions';
import type { CustomerAuthEventSummary } from '@/lib/customers/customer-auth-event-summary';
import type { PaymentGatewayReadiness } from '@/lib/checkout/payment-gateway-config';
import type { InquiryNotificationReadiness } from '@/lib/notifications/inquiry-notifications-core';
import type { RuntimeReadiness } from '@/lib/runtime-readiness';

type Workspace = 'overview' | 'catalog' | 'content' | 'sales';

type AdminDashboardProps = {
  activeWorkspace: Workspace;
  categories: Category[];
  products: Product[];
  homepage: HomepageContent;
  homepageTranslations: HomepageTranslation[];
  media: MediaItem[];
  authEventSummary: CustomerAuthEventSummary;
  runtimeReadiness: RuntimeReadiness;
  authConfigured: boolean;
  authenticated: boolean;
  notificationReadiness: InquiryNotificationReadiness;
  notificationRetryRunbook: string[];
  checkoutReadiness: PaymentGatewayReadiness;
  catalogSearch?: string;
  catalogCategory?: string;
  catalogFlag?: string;
  status?: string;
  message?: string;
};

const statusLabels: Record<string, string> = {
  'homepage-updated': 'Homepage saved.',
  'homepage-translation-updated': 'Homepage translation saved.',
  'category-created': 'Category created.',
  'category-updated': 'Category updated.',
  'category-translation-updated': 'Category translation saved.',
  'product-created': 'Product created.',
  'product-updated': 'Product updated.',
  'product-bulk-updated': 'Products updated.',
  'product-translation-updated': 'Product translation saved.',
  'media-created': 'Media URL added.',
  'media-uploaded': 'Image uploaded.',
  'media-saved': 'Media item saved.'
};

const inputClass = 'rounded-lg border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';
const textAreaClass = 'min-h-28 rounded-lg border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';
const toggleClass = 'flex items-center gap-3 rounded-lg border border-rosewood/10 bg-white px-4 py-3 text-sm font-semibold text-rosewood outline-none transition focus-within:ring-4 focus-within:ring-olive/20';
const primaryButtonClass = 'rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none';
const secondaryButtonClass = 'rounded-full border border-rosewood/20 px-5 py-2 text-sm font-semibold text-rosewood outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20';
const panelClass = 'scroll-mt-36 rounded-lg border border-rosewood/10 bg-white p-6 shadow-[0_18px_48px_rgba(111,36,56,0.07)]';
const formCardClass = 'grid gap-4 rounded-lg border border-rosewood/10 bg-[#fffdfb] p-5 shadow-sm';
const scrollListClass = 'max-h-[760px] overflow-y-auto pr-2 [scrollbar-width:thin] [scrollbar-color:#6f2438_#fff8f1]';
const mediaCategoryOptions = [
  { value: 'product', label: 'Product' },
  { value: 'category', label: 'Category' },
  { value: 'homepage-banner', label: 'Home page banner' },
  { value: 'homepage-category', label: 'Home page category' },
  { value: 'homepage-best-seller', label: 'Home page best seller' },
  { value: 'general', label: 'General / other' }
];

function Field({ label, name, defaultValue, placeholder, type = 'text', required = true, disabled = false }: { label: string; name: string; defaultValue?: string | number; placeholder?: string; type?: string; required?: boolean; disabled?: boolean }) {
  return <label className="grid gap-2 text-sm font-semibold text-rosewood">{label}<input className={inputClass} name={name} type={type} defaultValue={defaultValue} placeholder={placeholder} required={required} disabled={disabled} /></label>;
}

function TextArea({ label, name, defaultValue, disabled = false }: { label: string; name: string; defaultValue?: string; disabled?: boolean }) {
  return <label className="grid gap-2 text-sm font-semibold text-rosewood">{label}<textarea className={textAreaClass} name={name} defaultValue={defaultValue} required disabled={disabled} /></label>;
}

function Toggle({ label, name, defaultChecked = true, disabled = false }: { label: string; name: string; defaultChecked?: boolean; disabled?: boolean }) {
  return <label className={toggleClass}><input name={name} type="checkbox" defaultChecked={defaultChecked} disabled={disabled} />{label}</label>;
}

function MediaCategorySelect({ defaultValue = 'product', disabled = false }: { defaultValue?: string; disabled?: boolean }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-rosewood">
      Image category
      <select className={inputClass} name="mediaCategory" defaultValue={defaultValue} disabled={disabled} required>
        {mediaCategoryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </label>
  );
}

function MediaCategoryInlineForm({ item, disabled }: { item: MediaItem; disabled: boolean }) {
  if (!item.id) {
    return <span>{mediaCategoryOptions.find((option) => option.value === item.mediaCategory)?.label ?? item.mediaCategory ?? 'General / other'}</span>;
  }

  return (
    <form action={updateMediaCategoryAction.bind(null, item.id)} className="grid min-w-56 gap-2">
      <select className={`${inputClass} py-2 text-sm`} name="mediaCategory" defaultValue={item.mediaCategory ?? 'general'} disabled={disabled} required>
        {mediaCategoryOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
      <button type="submit" className="rounded-full border border-rosewood/20 px-3 py-1.5 text-xs font-semibold text-rosewood outline-none transition hover:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:border-stone-200 disabled:text-stone-400" disabled={disabled}>
        Save category
      </button>
    </form>
  );
}

function SubmitButton({ children, disabled }: { children: React.ReactNode; disabled: boolean }) {
  return <button className={primaryButtonClass} type="submit" disabled={disabled}>{children}</button>;
}

function categoryDefaultValue(product: Product, categories: Category[]) {
  return product.categoryId ?? categories.find((category) => category.slug === product.category)?.id ?? '';
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

function StatusBanner({ status, message }: { status?: string; message?: string }) {
  if (!status && !message) return null;
  const isError = status === 'error';
  return <section className={`rounded-lg border p-5 text-sm font-semibold ${isError ? 'border-red-200 bg-red-50 text-red-800' : 'border-olive/20 bg-white text-olive'}`}>{message || statusLabels[status ?? ''] || status}</section>;
}

function DashboardIntro({ workspace, productCount, categoryCount, mediaCount }: { workspace: Workspace; productCount: number; categoryCount: number; mediaCount: number }) {
  const copy = {
    catalog: ['Catalog workspace', 'Products, categories, subcategories, and media', 'Create and maintain the product catalog that powers the storefront. Assign products to any category or subcategory, manage homepage visibility, and update images from the media library.'],
    content: ['Content workspace', 'Homepage and translations', 'Edit storefront copy and localized content without touching code.'],
    sales: ['Sales workspace', 'Orders and inquiries', 'Use the sales tab below for customer inquiries and checkout/order management.'],
    overview: ['Overview workspace', 'System readiness and access', 'Check database/auth readiness, security events, staff access, and audit activity before making operational changes.']
  }[workspace];

  return (
    <section className="rounded-lg border border-rosewood/10 bg-white p-6 shadow-[0_18px_48px_rgba(111,36,56,0.07)]">
      <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-end">
        <div><p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">{copy[0]}</p><h2 className="mt-2 font-display text-4xl text-rosewood md:text-5xl">{copy[1]}</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600 md:text-base">{copy[2]}</p></div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Metric value={productCount} label="Products" />
          <Metric value={categoryCount} label="Categories" />
          <Metric value={mediaCount} label="Media" />
        </div>
      </div>
    </section>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return <div className="rounded-lg border border-rosewood/10 bg-cream px-4 py-3"><div className="font-display text-3xl text-rosewood">{value}</div><div className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">{label}</div></div>;
}

function CatalogFilters({ categories, search, category, flag }: { categories: Category[]; search?: string; category?: string; flag?: string }) {
  return (
    <form action="/admin" className="mb-6 grid gap-3 rounded-lg border border-rosewood/10 bg-white p-4 md:grid-cols-[1.2fr_1fr_1fr_auto]">
      <input type="hidden" name="tab" value="catalog" />
      <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-rosewood/70">Search<input name="catalogSearch" className={inputClass} defaultValue={search} placeholder="Title, code, slug..." /></label>
      <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-rosewood/70">Category<select name="catalogCategory" className={inputClass} defaultValue={category ?? ''}><option value="">All categories</option>{categories.map((item) => <option key={item.slug} value={item.slug}>{item.parentTitle ? `${item.parentTitle} / ${item.title}` : item.title}</option>)}</select></label>
      <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-rosewood/70">Product flag<select name="catalogFlag" className={inputClass} defaultValue={flag ?? ''}><option value="">All products</option><option value="best-seller">Best sellers</option><option value="available-today">Available today</option><option value="quote-only">Quote only</option><option value="inactive">Inactive</option><option value="missing-image">Missing image</option></select></label>
      <button type="submit" className={primaryButtonClass}>Filter</button>
    </form>
  );
}

function CatalogSectionNav() {
  const links = [
    { href: '#media', label: 'Media', detail: 'Images and uploads' },
    { href: '#categories', label: 'Categories', detail: 'Sections and subcategories' },
    { href: '#products', label: 'Products', detail: 'Items and bulk actions' }
  ];

  return (
    <nav aria-label="Catalog sections" className="sticky top-28 z-10 rounded-lg border border-rosewood/10 bg-white/95 p-1.5 shadow-[0_10px_26px_rgba(111,36,56,0.07)] backdrop-blur">
      <div className="flex flex-wrap gap-1.5">
        {links.map((link) => (
          <a key={link.href} href={link.href} className="rounded-md border border-transparent bg-white px-3 py-2 text-sm font-semibold text-rosewood transition hover:border-rosewood/15 hover:bg-cream focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-olive/20">
            {link.label}
          </a>
        ))}
      </div>
    </nav>
  );
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

function MediaMeta({ item }: { item: MediaItem }) {
  const details = [item.sourceType, item.storageProvider, item.mimeType].filter(Boolean);
  if (!details.length) return null;
  return <p className="text-xs font-semibold uppercase tracking-[0.14em] text-olive">{details.join(' / ')}</p>;
}

type MediaUsage = {
  type: 'Product' | 'Category' | 'Home page banner' | 'Home page category' | 'Home page best seller' | 'Unassigned';
  label: string;
};

function normalizeMediaUrl(url?: string) {
  return url?.trim().toLowerCase();
}

function addMediaUsage(usageByUrl: Map<string, MediaUsage[]>, url: string | undefined, usage: MediaUsage) {
  const key = normalizeMediaUrl(url);
  if (!key) return;
  const usages = usageByUrl.get(key) ?? [];
  if (!usages.some((item) => item.type === usage.type && item.label === usage.label)) usages.push(usage);
  usageByUrl.set(key, usages);
}

function buildMediaUsageMap(categories: Category[], products: Product[]) {
  const usageByUrl = new Map<string, MediaUsage[]>();

  categories.forEach((category) => {
    addMediaUsage(usageByUrl, category.image, { type: 'Category', label: category.parentTitle ? `${category.parentTitle} / ${category.title}` : category.title });
    if (category.showOnHomepage !== false) {
      addMediaUsage(usageByUrl, category.image || homepageCategoryImage(category.slug), { type: 'Home page category', label: category.title });
    }
  });

  products.forEach((product) => {
    addMediaUsage(usageByUrl, product.image, { type: 'Product', label: product.title });
    if (product.bestSeller) {
      addMediaUsage(usageByUrl, product.image || homepageBestSellerImage(product.slug), { type: 'Home page best seller', label: product.title });
    }
  });

  homepageBannerSlides.forEach((slide) => {
    addMediaUsage(usageByUrl, slide.image, { type: 'Home page banner', label: slide.eyebrow });
  });

  return usageByUrl;
}

function inferredMediaUsage(item: MediaItem): MediaUsage[] {
  if (item.url.includes('/homepage/banners/')) return [{ type: 'Home page banner', label: item.alt }];
  if (item.url.includes('/homepage/categories/')) return [{ type: 'Home page category', label: item.alt }];
  if (item.url.includes('/homepage/best-seller/')) return [{ type: 'Home page best seller', label: item.alt }];
  if (item.productId) return [{ type: 'Product', label: item.alt }];
  return [{ type: 'Unassigned', label: 'Not linked in catalog' }];
}

function MediaUsagePills({ usages }: { usages: MediaUsage[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {usages.map((usage) => (
        <span key={`${usage.type}-${usage.label}`} className={`rounded-full px-2 py-1 text-xs font-semibold ${usage.type === 'Unassigned' ? 'bg-stone-100 text-stone-600' : 'bg-olive/10 text-olive'}`}>
          {usage.type}
        </span>
      ))}
    </div>
  );
}

function MediaEditFields({ item, disabled }: { item: MediaItem; disabled: boolean }) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr_1fr]">
        <Field label="Image URL" name="url" defaultValue={item.url} disabled={disabled} />
        <Field label="Alt text" name="alt" defaultValue={item.alt} disabled={disabled} />
        <MediaCategorySelect defaultValue={item.mediaCategory ?? 'general'} disabled={disabled} />
      </div>
      <SubmitButton disabled={disabled}>Update media</SubmitButton>
    </>
  );
}

function MediaTable({ media, categories, products, disabled }: { media: MediaItem[]; categories: Category[]; products: Product[]; disabled: boolean }) {
  const usageByUrl = buildMediaUsageMap(categories, products);

  return (
    <div className="mt-8 max-h-[760px] overflow-auto rounded-lg border border-rosewood/10 bg-white [scrollbar-width:thin] [scrollbar-color:#6f2438_#fff8f1]">
      <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
        <thead className="sticky top-0 z-[1] bg-cream text-xs font-semibold uppercase tracking-[0.16em] text-rosewood/70">
          <tr>
            <th className="px-4 py-3">Image</th>
            <th className="px-4 py-3">Image category</th>
            <th className="px-4 py-3">Belongs to</th>
            <th className="px-4 py-3">Linked item</th>
            <th className="px-4 py-3">Source</th>
            <th className="px-4 py-3">URL</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {media.map((item) => {
            const usages = usageByUrl.get(normalizeMediaUrl(item.url) ?? '') ?? inferredMediaUsage(item);
            return (
              <tr key={item.id ?? item.url} className="border-t border-rosewood/10 align-top">
                <td className="px-4 py-4">
                  <div className="flex min-w-72 gap-3">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-blush">
                      <Image src={item.url} alt={item.alt} fill className="object-cover" sizes="64px" />
                    </div>
                    <div>
                      <div className="font-semibold text-rosewood">{item.alt}</div>
                      <div className="mt-1 text-xs text-stone-500">{item.createdAt ? item.createdAt.toLocaleDateString('en-CA') : 'Seed or static asset'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-stone-700"><MediaCategoryInlineForm item={item} disabled={disabled} /></td>
                <td className="px-4 py-4"><MediaUsagePills usages={usages} /></td>
                <td className="px-4 py-4 text-stone-700">
                  <div className="grid gap-1">
                    {usages.map((usage) => <span key={`${usage.type}-${usage.label}`}>{usage.label}</span>)}
                  </div>
                </td>
                <td className="px-4 py-4"><MediaMeta item={item} /></td>
                <td className="px-4 py-4"><p className="max-w-sm break-all text-xs text-stone-500">{item.url}</p></td>
                <td className="px-4 py-4">
                  {item.id ? (
                    <details className="min-w-96">
                      <summary className="cursor-pointer text-xs font-semibold text-rosewood underline-offset-4 hover:underline">Edit</summary>
                      <form action={updateMediaAction.bind(null, item.id)} className="mt-4 grid gap-4 rounded-lg border border-rosewood/10 bg-[#fffdfb] p-4">
                        <MediaEditFields item={item} disabled={disabled} />
                      </form>
                    </details>
                  ) : <span className="text-xs font-semibold text-stone-400">Static</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function AdminDashboard({ activeWorkspace, categories, products, homepage, homepageTranslations, media, authEventSummary, runtimeReadiness, authConfigured, authenticated, notificationReadiness, notificationRetryRunbook, checkoutReadiness, catalogSearch, catalogCategory, catalogFlag, status, message }: AdminDashboardProps) {
  const databaseReady = runtimeReadiness.databaseUrlPresent;
  const disabled = !databaseReady || !authenticated;
  const showOverview = activeWorkspace === 'overview';
  const showCatalog = activeWorkspace === 'catalog';
  const showContent = activeWorkspace === 'content';
  const filteredProducts = products.filter((product) => {
    const search = catalogSearch?.trim();
    const matchesSearch = !search || includesText(product.title, search) || includesText(product.code, search) || includesText(product.slug, search) || includesText(product.description, search);
    const matchesCategory = !catalogCategory || product.category === catalogCategory;
    return matchesSearch && matchesCategory && productMatchesFlag(product, catalogFlag);
  });
  const filteredCategories = categories.filter((category) => {
    const search = catalogSearch?.trim();
    return !search || includesText(category.title, search) || includesText(category.slug, search) || includesText(category.description, search) || includesText(category.parentTitle, search);
  });

  return (
    <div className="space-y-8">
      <StatusBanner status={status} message={message} />
      <DashboardIntro workspace={activeWorkspace} productCount={products.length} categoryCount={categories.length} mediaCount={media.length} />
      {showCatalog ? <CatalogSectionNav /> : null}
      {showCatalog ? <CatalogFilters categories={categories} search={catalogSearch} category={catalogCategory} flag={catalogFlag} /> : null}
      {showOverview ? <AdminReadinessPanel runtimeReadiness={runtimeReadiness} authConfigured={authConfigured} authenticated={authenticated} notificationReadiness={notificationReadiness} notificationRetryRunbook={notificationRetryRunbook} checkoutReadiness={checkoutReadiness} /> : null}
      {showOverview && authenticated ? <AdminSecurityPanel summary={authEventSummary} /> : null}
      {showOverview ? <section className={`rounded-lg border p-6 ${databaseReady && authenticated ? 'border-olive/20 bg-white' : 'border-amber-300 bg-amber-50'}`}><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">CMS status</p><h2 className="mt-3 font-display text-3xl text-rosewood">{databaseReady && authenticated ? 'Editing enabled' : databaseReady ? 'Login required' : 'Seeded preview mode'}</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-stone-700">{databaseReady && authenticated ? 'Admin forms are live. Changes write to Prisma, then revalidate storefront pages.' : databaseReady ? 'The database is connected, but CMS writes require admin authentication.' : 'The storefront is reading seeded fallback content. Add DATABASE_URL, run npm run db:push and npm run db:seed, then restart the app to enable editing.'}</p></div>{authenticated ? <form action={logoutAction}><button className={secondaryButtonClass} type="submit">Sign out</button></form> : null}</div></section> : null}

      {showCatalog ? <section id="media" className={panelClass}><div className="mb-6"><p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">Media library</p><h2 className="mt-2 font-display text-4xl text-rosewood">Images</h2><p className="mt-3 text-sm leading-6 text-stone-600">Register external image URLs or upload local/dev images into <code>public/uploads</code>.</p></div><details className="rounded-lg border border-rosewood/10 bg-cream p-5"><summary className="cursor-pointer font-display text-3xl text-rosewood">Add image</summary><div className="mt-5 grid gap-6 lg:grid-cols-2"><form action={createMediaFromUrlAction} className={formCardClass}><h3 className="font-display text-3xl text-rosewood">Add image URL</h3><MediaCategorySelect disabled={disabled} /><Field label="Image URL" name="url" placeholder="https://..." disabled={disabled} /><Field label="Alt text" name="alt" placeholder="Blush rose bouquet" disabled={disabled} /><SubmitButton disabled={disabled}>Add media</SubmitButton></form><form action={uploadMediaAction} className={formCardClass}><h3 className="font-display text-3xl text-rosewood">Upload image</h3><MediaCategorySelect disabled={disabled} /><label className="grid gap-2 text-sm font-semibold text-rosewood">Image file<input className={inputClass} name="file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" required disabled={disabled} /></label><Field label="Alt text" name="alt" placeholder="Optional descriptive text" required={false} disabled={disabled} /><SubmitButton disabled={disabled}>Upload image</SubmitButton></form></div></details><MediaTable media={media} categories={categories} products={products} disabled={disabled} /></section> : null}

      {showContent ? <section id="homepage" className={panelClass}><div className="mb-6"><p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">Homepage</p><h2 className="mt-2 font-display text-4xl text-rosewood">Hero content</h2></div><form action={updateHomepageAction} className="grid gap-4"><div className="grid gap-4 md:grid-cols-2"><Field label="Eyebrow" name="eyebrow" defaultValue={homepage.eyebrow} disabled={disabled} /><Field label="Title" name="title" defaultValue={homepage.title} disabled={disabled} /></div><TextArea label="Body" name="body" defaultValue={homepage.body} disabled={disabled} /><div className="grid gap-4 md:grid-cols-2"><Field label="Primary CTA label" name="primaryCtaLabel" defaultValue={homepage.primaryCtaLabel} disabled={disabled} /><Field label="Primary CTA URL" name="primaryCtaHref" defaultValue={homepage.primaryCtaHref} disabled={disabled} /><Field label="Secondary CTA label" name="secondaryCtaLabel" defaultValue={homepage.secondaryCtaLabel} disabled={disabled} /><Field label="Secondary CTA URL" name="secondaryCtaHref" defaultValue={homepage.secondaryCtaHref} disabled={disabled} /><Field label="Panel eyebrow" name="panelEyebrow" defaultValue={homepage.panelEyebrow} disabled={disabled} /><Field label="Panel title" name="panelTitle" defaultValue={homepage.panelTitle} disabled={disabled} /></div><TextArea label="Panel body" name="panelBody" defaultValue={homepage.panelBody} disabled={disabled} /><SubmitButton disabled={disabled}>Save homepage</SubmitButton></form></section> : null}
      {showContent && authenticated ? <AdminTranslationPanel homepage={homepage} homepageTranslations={homepageTranslations} categories={categories} products={products} disabled={disabled} /> : null}

      {showCatalog ? <section id="categories" className={panelClass}><div className="mb-6"><p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">Categories</p><h2 className="mt-2 font-display text-4xl text-rosewood">Categories and subcategories</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">Use parent category to create subcategories. Products can be assigned to either top-level categories or nested subcategories.</p></div><details className="rounded-lg border border-rosewood/10 bg-cream p-5"><summary className="cursor-pointer font-display text-3xl text-rosewood">Create category or subcategory</summary><form action={createCategoryAction} className="mt-5 grid gap-4"><CategoryFields categories={categories} media={media} disabled={disabled} /><SubmitButton disabled={disabled}>Create category</SubmitButton></form></details><div className="mt-8 flex items-center justify-between gap-4"><p className="text-sm font-semibold text-stone-600">Showing {filteredCategories.length} categories. Scroll the list after the first 10.</p><a href="#products" className="text-sm font-semibold text-rosewood underline-offset-4 hover:underline">Jump to products</a></div><div className={`mt-4 grid gap-4 ${scrollListClass}`}>{filteredCategories.map((category) => <details key={category.slug} className="rounded-lg border border-rosewood/10 bg-[#fffdfb] p-5 shadow-sm"><summary className="cursor-pointer list-none"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-display text-2xl text-rosewood">{category.title}</h3><p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">{category.parentTitle ? `Subcategory of ${category.parentTitle}` : 'Top-level category'} - {category.productCount ?? 0} products</p></div><span className="rounded-full border border-rosewood/15 bg-white px-3 py-1 text-xs font-semibold text-rosewood">Edit</span></div></summary><form action={updateCategoryAction.bind(null, category.id ?? '')} className="mt-5 grid gap-4"><CategoryFields category={category} categories={categories} media={media} disabled={disabled || !category.id} /><SubmitButton disabled={disabled || !category.id}>Update category</SubmitButton></form></details>)}</div></section> : null}

      {showCatalog ? <section id="products" className={panelClass}><div className="mb-6"><p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">Products</p><h2 className="mt-2 font-display text-4xl text-rosewood">Product management</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">Create products, assign them to categories or subcategories, control homepage flags, and update catalog imagery.</p></div><details className="rounded-lg border border-rosewood/10 bg-cream p-5"><summary className="cursor-pointer font-display text-3xl text-rosewood">Create product</summary><form action={createProductAction} className="mt-5 grid gap-4"><ProductFields categories={categories} media={media} disabled={disabled} /><SubmitButton disabled={disabled}>Create product</SubmitButton></form></details><div className="mt-8 flex items-center justify-between gap-4"><p className="text-sm font-semibold text-stone-600">Showing {filteredProducts.length} products.</p><a href="#categories" className="text-sm font-semibold text-rosewood underline-offset-4 hover:underline">Back to categories</a></div><ProductBulkBar categories={categories} disabled={disabled} /><ProductTable products={filteredProducts} categories={categories} media={media} disabled={disabled} /></section> : null}
    </div>
  );
}

function ProductTable({ products, categories, media, disabled }: { products: Product[]; categories: Category[]; media: MediaItem[]; disabled: boolean }) {
  return (
    <div className="mt-4 max-h-[760px] overflow-auto rounded-lg border border-rosewood/10 bg-white [scrollbar-width:thin] [scrollbar-color:#6f2438_#fff8f1]">
      <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
        <thead className="sticky top-0 z-[1] bg-cream text-xs font-semibold uppercase tracking-[0.16em] text-rosewood/70">
          <tr>
            <th className="w-12 px-4 py-3">Pick</th>
            <th className="px-4 py-3">Product</th>
            <th className="px-4 py-3">Category</th>
            <th className="px-4 py-3">Price</th>
            <th className="px-4 py-3">Flags</th>
            <th className="px-4 py-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.slug} className="border-t border-rosewood/10 align-top">
              <td className="px-4 py-4">
                <input form="bulk-products-form" type="checkbox" name="productId" value={product.id ?? ''} disabled={disabled || !product.id} />
              </td>
              <td className="px-4 py-4">
                <div className="flex gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-blush">
                    {product.image ? <Image src={product.image} alt={product.title} fill className="object-cover" sizes="56px" /> : null}
                  </div>
                  <div>
                    <div className="font-semibold text-rosewood">{product.title}</div>
                    <div className="mt-1 text-xs text-stone-500">{product.code} - {product.slug}</div>
                  </div>
                </div>
              </td>
              <td className="px-4 py-4 text-stone-700">{product.categoryTitle || product.category}</td>
              <td className="px-4 py-4 text-stone-700">{product.price} {product.currency}</td>
              <td className="px-4 py-4">
                <div className="flex flex-wrap gap-2">
                  {product.bestSeller ? <span className="rounded-full bg-rosewood px-2 py-1 text-xs font-semibold text-white">Best</span> : null}
                  {product.availableToday ? <span className="rounded-full bg-olive px-2 py-1 text-xs font-semibold text-white">Today</span> : null}
                  {product.requiresQuote || product.price <= 0 ? <span className="rounded-full bg-stone-800 px-2 py-1 text-xs font-semibold text-white">Quote</span> : null}
                  {product.isActive === false ? <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">Inactive</span> : null}
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="grid min-w-[32rem] gap-3">
                  <a href={`/products/${product.slug}`} className="text-xs font-semibold text-rosewood underline-offset-4 hover:underline" target="_blank">View</a>
                  <details>
                    <summary className="cursor-pointer text-xs font-semibold text-rosewood underline-offset-4 hover:underline">Edit</summary>
                    <form action={updateProductAction.bind(null, product.id ?? '')} className="mt-4 grid gap-4 rounded-lg border border-rosewood/10 bg-[#fffdfb] p-4">
                      <ProductFields product={product} categories={categories} media={media} disabled={disabled || !product.id} />
                      <SubmitButton disabled={disabled || !product.id}>Update product</SubmitButton>
                    </form>
                  </details>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function mediaForCategory(media: MediaItem[], mediaCategory: string, defaultValue?: string) {
  return media.filter((item) => item.mediaCategory === mediaCategory || item.url === defaultValue);
}

function MediaSelect({ label, name, media, mediaCategory, defaultValue, disabled }: { label: string; name: string; media: MediaItem[]; mediaCategory: string; defaultValue?: string; disabled: boolean }) {
  return <MediaSelectWithPreview label={label} name={name} media={mediaForCategory(media, mediaCategory, defaultValue)} defaultValue={defaultValue} disabled={disabled} className={inputClass} />;
}

function CategoryFields({ category, categories, media, disabled }: { category?: Category; categories: Category[]; media: MediaItem[]; disabled: boolean }) {
  return <><div className="grid gap-4 md:grid-cols-2"><Field label="Title" name="title" defaultValue={category?.title} disabled={disabled} /><Field label="Slug" name="slug" defaultValue={category?.slug} disabled={disabled} /></div><TextArea label="Eyebrow" name="eyebrow" defaultValue={category?.eyebrow} disabled={disabled} /><TextArea label="Description" name="description" defaultValue={category?.description} disabled={disabled} /><MediaSelect label="Category image from media library" name="categorySelectedMediaUrl" media={media} mediaCategory="category" defaultValue={category?.image} disabled={disabled} /><Field label="Manual category image URL" name="categoryImageUrl" defaultValue={category?.image} required={false} disabled={disabled} /><label className="grid gap-2 text-sm font-semibold text-rosewood">Parent category<select className={inputClass} name="parentId" defaultValue={category?.parentId ?? ''} disabled={disabled}><option value="">No parent</option>{categories.filter((candidate) => candidate.id !== category?.id).map((candidate) => <option key={candidate.id ?? candidate.slug} value={candidate.id ?? ''}>{candidate.parentTitle ? `${candidate.parentTitle} / ${candidate.title}` : candidate.title}</option>)}</select></label><div className="grid gap-3 md:grid-cols-3"><Field label="Sort order" name="sortOrder" type="number" defaultValue={category?.sortOrder ?? 100} disabled={disabled} /><Toggle label="Show on homepage" name="showOnHomepage" defaultChecked={category?.showOnHomepage ?? true} disabled={disabled} /><Toggle label="Active" name="isActive" defaultChecked={category?.isActive ?? true} disabled={disabled} /></div></>;
}

function ProductFields({ product, categories, media, disabled }: { product?: Product; categories: Category[]; media: MediaItem[]; disabled: boolean }) {
  return <><div className="grid gap-4 md:grid-cols-2"><Field label="Title" name="title" defaultValue={product?.title} disabled={disabled} /><Field label="Slug" name="slug" defaultValue={product?.slug} disabled={disabled} /></div><div className="grid gap-4 md:grid-cols-2"><Field label="Code" name="code" defaultValue={product?.code} disabled={disabled} /><label className="grid gap-2 text-sm font-semibold text-rosewood">Category or subcategory<select className={inputClass} name="categoryId" defaultValue={categoryDefaultValue(product ?? ({ category: '' } as Product), categories)} disabled={disabled} required><option value="">Choose category</option>{categories.map((category) => <option key={category.id ?? category.slug} value={category.id ?? ''}>{category.parentTitle ? `${category.parentTitle} / ${category.title}` : category.title}</option>)}</select></label></div><TextArea label="Description" name="description" defaultValue={product?.description} disabled={disabled} /><div className="grid gap-4 md:grid-cols-2"><Field label="Price" name="price" type="number" defaultValue={product?.price ?? 0} disabled={disabled} /><Field label="Currency" name="currency" defaultValue={product?.currency ?? 'CAD'} disabled={disabled} /></div><MediaSelect label="Product image from media library" name="selectedMediaUrl" media={media} mediaCategory="product" defaultValue={product?.image} disabled={disabled} /><Field label="Manual product image URL" name="imageUrl" defaultValue={product?.image} required={false} disabled={disabled} /><div className="grid gap-3 md:grid-cols-4"><Toggle label="Available today" name="availableToday" defaultChecked={product?.availableToday ?? true} disabled={disabled} /><Toggle label="Best seller" name="bestSeller" defaultChecked={product?.bestSeller ?? false} disabled={disabled} /><Toggle label="Requires quote" name="requiresQuote" defaultChecked={product?.requiresQuote ?? false} disabled={disabled} /><Toggle label="Active" name="isActive" defaultChecked={product?.isActive ?? true} disabled={disabled} /></div><Field label="Sort order" name="sortOrder" type="number" defaultValue={0} disabled={disabled} /></>;
}
