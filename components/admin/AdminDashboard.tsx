import Image from 'next/image';
import Link from 'next/link';
import type { Category, HomepageContent, HomepageTranslation, MediaItem, Product, ProductType } from '@/lib/catalog';
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
  importProductsCsvAction,
  quickEditProductsAction,
  updateMediaAction,
  updateMediaCategoryAction,
  updateCategoryAction,
  updateHomepageAction,
  uploadMediaAction
} from '@/app/admin/actions';
import type { CustomerAuthEventSummary } from '@/lib/customers/customer-auth-event-summary';
import type { PaymentGatewayReadiness } from '@/lib/checkout/payment-gateway-config';
import type { InquiryNotificationReadiness } from '@/lib/notifications/inquiry-notifications-core';
import type { RuntimeReadiness } from '@/lib/runtime-readiness';
import type { SupportedLocale } from '@/lib/i18n/locales';
import { createAdminTranslator } from '@/lib/localization/admin-copy';

type Workspace = 'overview' | 'catalog' | 'content' | 'sales';

type CatalogSection = 'all' | 'media' | 'categories' | 'products';

type AdminDashboardProps = {
  activeWorkspace: Workspace;
  catalogSection?: CatalogSection;
  categories: Category[];
  products: Product[];
  productTypes: ProductType[];
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
  productPage?: number;
  categoryPage?: number;
  mediaPage?: number;
  productColumns?: string | string[];
  mediaColumns?: string | string[];
  status?: string;
  message?: string;
  locale?: SupportedLocale | string | null;
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
  'product-imported': 'Products imported.',
  'product-quick-edited': 'Product quick edit saved.',
  'product-translation-updated': 'Product translation saved.',
  'media-created': 'Media URL added.',
  'media-uploaded': 'Image uploaded.',
  'media-saved': 'Media item saved.'
};

const inputClass = 'rounded-lg border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';
const textAreaClass = 'min-h-28 rounded-lg border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';
const toggleClass = 'flex items-center gap-3 rounded-lg border border-rosewood/10 bg-white px-4 py-3 text-sm font-semibold text-rosewood outline-none transition focus-within:ring-4 focus-within:ring-olive/20';
const primaryButtonClass = 'w-fit rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none';
const secondaryButtonClass = 'rounded-full border border-rosewood/20 px-5 py-2 text-sm font-semibold text-rosewood outline-none transition hover:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20';
const formCardClass = 'grid gap-4 rounded-lg border border-rosewood/10 bg-white p-5 shadow-sm';
const panelClass = 'scroll-mt-24 rounded-lg border border-rosewood/10 bg-white p-6 shadow-sm';
const scrollListClass = 'max-h-[760px] overflow-auto pr-2 [scrollbar-width:thin] [scrollbar-color:#6f2438_#fff8f1]';
const catalogPageSize = 12;

const productColumnOptions = [
  { key: 'pick', label: 'Bulk pick' },
  { key: 'product', label: 'Product' },
  { key: 'category', label: 'Category' },
  { key: 'price', label: 'Price' },
  { key: 'flags', label: 'Flags' },
  { key: 'actions', label: 'Actions' }
] as const;

type ProductColumn = (typeof productColumnOptions)[number]['key'];

const mediaColumnOptions = [
  { key: 'image', label: 'Image' },
  { key: 'category', label: 'Image category' },
  { key: 'belongsTo', label: 'Belongs to' },
  { key: 'linkedItem', label: 'Linked item' },
  { key: 'source', label: 'Source' },
  { key: 'url', label: 'URL' },
  { key: 'actions', label: 'Actions' }
] as const;

type MediaColumn = (typeof mediaColumnOptions)[number]['key'];

const mediaCategoryOptions = [
  { value: 'product', label: 'Product' },
  { value: 'category', label: 'Category' },
  { value: 'homepage-banner', label: 'Homepage hero' },
  { value: 'homepage-best-seller', label: 'Homepage best seller' },
  { value: 'homepage-category', label: 'Homepage category' },
  { value: 'general', label: 'General / other' }
];

type MediaUsage = { type: string; label: string };

function Field({ label, name, defaultValue, placeholder, type = 'text', disabled = false, required = true }: { label: string; name: string; defaultValue?: string | number; placeholder?: string; type?: string; disabled?: boolean; required?: boolean }) {
  return <label className="grid gap-2 text-sm font-semibold text-rosewood">{label}<input className={inputClass} name={name} type={type} defaultValue={defaultValue} placeholder={placeholder} disabled={disabled} required={required} /></label>;
}

function TextArea({ label, name, defaultValue, disabled = false }: { label: string; name: string; defaultValue?: string; disabled?: boolean }) {
  return <label className="grid gap-2 text-sm font-semibold text-rosewood">{label}<textarea className={textAreaClass} name={name} defaultValue={defaultValue} disabled={disabled} required /></label>;
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

function mediaUrlLabel(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.pathname.split('/').filter(Boolean).at(-1) ?? parsed.hostname;
  } catch {
    return url.split('/').filter(Boolean).at(-1) ?? url;
  }
}

function mediaUrlFolder(url: string) {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split('/').filter(Boolean);
    return parts.length > 1 ? `/${parts.slice(0, -1).join('/')}` : parsed.hostname;
  } catch {
    const parts = url.split('/').filter(Boolean);
    return parts.length > 1 ? `/${parts.slice(0, -1).join('/')}` : 'local asset';
  }
}

function MediaUrlCell({ url }: { url: string }) {
  return (
    <div className="max-w-56" title={url}>
      <span className="inline-flex max-w-full rounded-md border border-stone-200 bg-stone-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-stone-700">
        <span className="truncate">{mediaUrlLabel(url)}</span>
      </span>
      <div className="mt-1 max-w-full truncate text-[11px] font-semibold uppercase tracking-[0.12em] text-olive">{mediaUrlFolder(url)}</div>
    </div>
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

function catalogPath(section: CatalogSection) {
  if (section === 'media') return '/admin/media';
  if (section === 'categories') return '/admin/categories';
  if (section === 'products') return '/admin/products';
  return '/admin';
}

function pageSlice<T>(items: T[], page: number, pageSize = catalogPageSize) {
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize));
  const currentPage = Math.min(Math.max(1, page), pageCount);
  const start = (currentPage - 1) * pageSize;
  return {
    currentPage,
    pageCount,
    items: items.slice(start, start + pageSize),
    start: items.length === 0 ? 0 : start + 1,
    end: Math.min(start + pageSize, items.length)
  };
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

function parseColumns<T extends string>(value: string | string[] | undefined, options: readonly { key: T; label: string }[], required: T[] = []) {
  const valid = new Set(options.map((option) => option.key));
  const raw = Array.isArray(value) ? value : value?.split(',');
  const selected = (raw ?? options.map((option) => option.key)).filter((item): item is T => valid.has(item as T));
  const withRequired = new Set<T>([...required, ...selected]);
  return options.map((option) => option.key).filter((key) => withRequired.has(key));
}

function columnParam<T extends string>(columns: T[], options: readonly { key: T; label: string }[]) {
  const defaults = options.map((option) => option.key);
  return columns.length === defaults.length && columns.every((column) => defaults.includes(column)) ? undefined : columns.join(',');
}

function ColumnVisibilityControls<T extends string>({ path, paramName, title, options, selected, hiddenInputs, t = (key: string) => key }: { path: string; paramName: string; title: string; options: readonly { key: T; label: string }[]; selected: T[]; hiddenInputs: Record<string, string | undefined>; t?: (key: string) => string }) {
  const selectedSet = new Set(selected);
  return (
    <details className="rounded-lg border border-stone-200 bg-white p-4">
      <summary className="cursor-pointer text-sm font-bold text-stone-950">{t(title)}</summary>
      <form action={path} className="mt-4 grid gap-3">
        {Object.entries(hiddenInputs).map(([name, value]) => value ? <input key={name} type="hidden" name={name} value={value} /> : null)}
        <div className="flex flex-wrap gap-2">
          {options.map((option) => (
            <label key={option.key} className="inline-flex items-center gap-2 rounded-md border border-stone-200 bg-stone-50 px-3 py-2 text-sm font-semibold text-stone-700">
              <input type="checkbox" name={paramName} value={option.key} defaultChecked={selectedSet.has(option.key)} />
              {t(option.label)}
            </label>
          ))}
        </div>
        <button type="submit" className="w-fit rounded-md bg-rosewood px-4 py-2 text-sm font-semibold text-white">{t('Apply columns')}</button>
      </form>
    </details>
  );
}

function PaginationControls({ path, pageParam, currentPage, pageCount, total, start, end, params, t = (key: string) => key }: { path: string; pageParam: string; currentPage: number; pageCount: number; total: number; start: number; end: number; params: Record<string, string | undefined>; t?: (key: string) => string }) {
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

function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="mt-4 rounded-lg border border-dashed border-stone-300 bg-stone-50 p-8 text-center">
      <h3 className="text-lg font-bold text-stone-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-stone-600">{body}</p>
    </div>
  );
}

function StatusBanner({ status, message, t = (key: string) => key }: { status?: string; message?: string; t?: (key: string) => string }) {
  if (!status && !message) return null;
  const isError = status === 'error';
  return <section className={`rounded-lg border p-5 text-sm font-semibold ${isError ? 'border-red-200 bg-red-50 text-red-800' : 'border-olive/20 bg-white text-olive'}`}>{message || t(statusLabels[status ?? ''] || status || '')}</section>;
}

function DashboardIntro({ workspace, productCount, categoryCount, mediaCount, t = (key: string) => key }: { workspace: Workspace; productCount: number; categoryCount: number; mediaCount: number; t?: (key: string) => string }) {
  const copy = {
    catalog: ['Catalog workspace', 'Products, categories, subcategories, and media', 'Create and maintain the product catalog that powers the storefront. Assign products to any category or subcategory, manage homepage visibility, and update images from the media library.'],
    content: ['Content workspace', 'Homepage and translations', 'Edit storefront copy and localized content without touching code.'],
    sales: ['Sales workspace', 'Orders and inquiries', 'Use the sales tab below for customer inquiries and checkout/order management.'],
    overview: ['Overview workspace', 'System readiness and access', 'Check database/auth readiness, security events, staff access, and audit activity before making operational changes.']
  }[workspace];

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-stone-500">{t(copy[0])}</p><h2 className="mt-1 text-2xl font-bold text-stone-950">{t(copy[1])}</h2><p className="mt-2 max-w-3xl text-sm leading-6 text-stone-600">{t(copy[2])}</p></div>
        <div className="grid grid-cols-3 gap-2 text-center">
          <Metric value={productCount} label={t('Products')} />
          <Metric value={categoryCount} label={t('Categories')} />
          <Metric value={mediaCount} label={t('Media')} />
        </div>
      </div>
    </section>
  );
}

function Metric({ value, label }: { value: number; label: string }) {
  return <div className="rounded-md border border-stone-200 bg-stone-50 px-4 py-3"><div className="text-xl font-bold text-stone-950">{value}</div><div className="text-[11px] font-bold uppercase tracking-[0.14em] text-stone-500">{label}</div></div>;
}

function CatalogFilters({ categories, section, search, category, flag, columnParams, t = (key: string) => key }: { categories: Category[]; section: CatalogSection; search?: string; category?: string; flag?: string; columnParams?: Record<string, string | undefined>; t?: (key: string) => string }) {
  return (
    <form action={catalogPath(section)} className="mb-6 grid gap-3 rounded-lg border border-rosewood/10 bg-white p-4 md:grid-cols-[1.2fr_1fr_1fr_auto]">
      {section === 'all' ? <input type="hidden" name="tab" value="catalog" /> : null}
      {Object.entries(columnParams ?? {}).map(([name, value]) => value ? <input key={name} type="hidden" name={name} value={value} /> : null)}
      <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-rosewood/70">{t('Search')}<input name="catalogSearch" className={inputClass} defaultValue={search} placeholder={t('Title, code, slug...')} /></label>
      <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-rosewood/70">{t('Category')}<select name="catalogCategory" className={inputClass} defaultValue={category ?? ''}><option value="">{t('All categories')}</option>{categories.map((item) => <option key={item.slug} value={item.slug}>{item.parentTitle ? `${item.parentTitle} / ${item.title}` : item.title}</option>)}</select></label>
      <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-rosewood/70">{t('Product flag')}<select name="catalogFlag" className={inputClass} defaultValue={flag ?? ''}><option value="">{t('All products')}</option><option value="best-seller">{t('Best sellers')}</option><option value="available-today">{t('Available today')}</option><option value="quote-only">{t('Quote only')}</option><option value="inactive">{t('Inactive')}</option><option value="missing-image">{t('Missing image')}</option></select></label>
      <button type="submit" className={primaryButtonClass}>{t('Filter')}</button>
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
    <nav aria-label="Catalog sections" className="sticky top-20 z-10 rounded-lg border border-stone-200 bg-white/95 p-1.5 shadow-sm backdrop-blur">
      <div className="flex flex-wrap gap-1.5">
        {links.map((link) => (
          <a key={link.href} href={link.href} className="rounded-md border border-transparent bg-white px-3 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-200 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-olive/20">
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

function normalizeMediaUrl(url?: string | null) {
  return url?.trim() || null;
}

function addMediaUsage(map: Map<string, MediaUsage[]>, url: string | undefined, usage: MediaUsage) {
  const normalized = normalizeMediaUrl(url);
  if (!normalized) return;
  const existing = map.get(normalized) ?? [];
  if (!existing.some((item) => item.type === usage.type && item.label === usage.label)) existing.push(usage);
  map.set(normalized, existing);
}

function buildMediaUsageMap(categories: Category[], products: Product[]) {
  const map = new Map<string, MediaUsage[]>();
  for (const category of categories) {
    addMediaUsage(map, category.image, { type: 'Category', label: category.title });
    if (category.showOnHomepage) addMediaUsage(map, category.image, { type: 'Homepage category', label: category.title });
  }
  for (const product of products) {
    addMediaUsage(map, product.image, { type: 'Product', label: product.title });
    if (product.bestSeller) addMediaUsage(map, product.image, { type: 'Homepage best seller', label: product.title });
  }
  for (const slide of homepageBannerSlides) addMediaUsage(map, slide.image, { type: 'Homepage hero', label: slide.title });
  addMediaUsage(map, homepageBestSellerImage, { type: 'Homepage best seller', label: 'Featured collection' });
  ['available-today', 'birthday', 'weddings', 'condolences'].forEach((slug) => addMediaUsage(map, homepageCategoryImage(slug), { type: 'Homepage category', label: slug }));
  return map;
}

function inferredMediaUsage(item: MediaItem): MediaUsage[] {
  if (item.mediaCategory === 'homepage-banner') return [{ type: 'Homepage hero', label: item.alt }];
  if (item.mediaCategory === 'homepage-best-seller') return [{ type: 'Homepage best seller', label: item.alt }];
  if (item.mediaCategory === 'homepage-category') return [{ type: 'Homepage category', label: item.alt }];
  if (item.mediaCategory === 'category') return [{ type: 'Category', label: item.alt }];
  if (item.mediaCategory === 'product') return [{ type: 'Product', label: item.alt }];
  return [{ type: 'Unassigned', label: item.alt }];
}

function MediaMeta({ item }: { item: MediaItem }) {
  return <div className="grid gap-1 text-xs font-semibold uppercase tracking-[0.14em] text-olive"><span>{item.source ?? 'static'}</span>{item.storageKey ? <span className="text-stone-400">{item.storageKey}</span> : null}</div>;
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

function MediaTable({ media, categories, products, disabled, columns }: { media: MediaItem[]; categories: Category[]; products: Product[]; disabled: boolean; columns: MediaColumn[] }) {
  const usageByUrl = buildMediaUsageMap(categories, products);
  const show = (column: MediaColumn) => columns.includes(column);

  if (media.length === 0) {
    return <EmptyState title="No images found" body="Add an image above, or clear filters and pagination to return to the full media library." />;
  }

  return (
    <div className="mt-8 max-h-[760px] overflow-auto rounded-lg border border-rosewood/10 bg-white [scrollbar-width:thin] [scrollbar-color:#6f2438_#fff8f1]">
      <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
        <thead className="sticky top-0 z-[1] bg-cream text-xs font-semibold uppercase tracking-[0.16em] text-rosewood/70">
          <tr>
            {show('image') ? <th className="px-4 py-3">Image</th> : null}
            {show('category') ? <th className="px-4 py-3">Image category</th> : null}
            {show('belongsTo') ? <th className="px-4 py-3">Belongs to</th> : null}
            {show('linkedItem') ? <th className="px-4 py-3">Linked item</th> : null}
            {show('source') ? <th className="px-4 py-3">Source</th> : null}
            {show('url') ? <th className="px-4 py-3">URL</th> : null}
            {show('actions') ? <th className="px-4 py-3">Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {media.map((item) => {
            const usages = usageByUrl.get(normalizeMediaUrl(item.url) ?? '') ?? inferredMediaUsage(item);
            return (
              <tr key={item.id ?? item.url} className="border-t border-rosewood/10 align-top">
                {show('image') ? <td className="px-4 py-4">
                  <div className="flex min-w-72 gap-3">
                    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-blush">
                      <Image src={item.url} alt={item.alt} fill className="object-cover" sizes="64px" />
                    </div>
                    <div>
                      <div className="font-semibold text-rosewood">{item.alt}</div>
                      <div className="mt-1 text-xs text-stone-500">{item.createdAt ? item.createdAt.toLocaleDateString('en-CA') : 'Seed or static asset'}</div>
                    </div>
                  </div>
                </td> : null}
                {show('category') ? <td className="px-4 py-4 text-stone-700"><MediaCategoryInlineForm item={item} disabled={disabled} /></td> : null}
                {show('belongsTo') ? <td className="px-4 py-4"><MediaUsagePills usages={usages} /></td> : null}
                {show('linkedItem') ? <td className="px-4 py-4 text-stone-700">
                  <div className="grid gap-1">
                    {usages.map((usage) => <span key={`${usage.type}-${usage.label}`}>{usage.label}</span>)}
                  </div>
                </td> : null}
                {show('source') ? <td className="px-4 py-4"><MediaMeta item={item} /></td> : null}
                {show('url') ? <td className="px-4 py-4"><MediaUrlCell url={item.url} /></td> : null}
                {show('actions') ? <td className="px-4 py-4">
                  {item.id ? (
                    <details className="min-w-96">
                      <summary className="cursor-pointer text-xs font-semibold text-rosewood underline-offset-4 hover:underline">Edit</summary>
                      <form action={updateMediaAction.bind(null, item.id)} className="mt-4 grid gap-4 rounded-lg border border-rosewood/10 bg-[#fffdfb] p-4">
                        <MediaEditFields item={item} disabled={disabled} />
                      </form>
                    </details>
                  ) : <span className="text-xs font-semibold text-stone-400">Static</span>}
                </td> : null}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function AdminDashboard({ activeWorkspace, catalogSection = 'all', categories, products, productTypes, homepage, homepageTranslations, media, authEventSummary, runtimeReadiness, authConfigured, authenticated, notificationReadiness, notificationRetryRunbook, checkoutReadiness, catalogSearch, catalogCategory, catalogFlag, productPage = 1, categoryPage = 1, mediaPage = 1, productColumns, mediaColumns, status, message, locale }: AdminDashboardProps) {
  const t = createAdminTranslator(locale);
  const databaseReady = runtimeReadiness.databaseUrlPresent;
  const disabled = !databaseReady || !authenticated;
  const showOverview = activeWorkspace === 'overview';
  const showCatalog = activeWorkspace === 'catalog';
  const showContent = activeWorkspace === 'content';
  const showMediaSection = showCatalog && (catalogSection === 'all' || catalogSection === 'media');
  const showCategorySection = showCatalog && (catalogSection === 'all' || catalogSection === 'categories');
  const showProductSection = showCatalog && (catalogSection === 'all' || catalogSection === 'products');
  const filteredProducts = products.filter((product) => {
    const search = catalogSearch?.trim();
    const matchesSearch = !search || includesText(product.title, search) || includesText(product.code, search) || includesText(product.slug, search) || includesText(product.description, search);
    const matchesCategory = !catalogCategory || product.category === catalogCategory;
    return matchesSearch && productMatchesFlag(product, catalogFlag) && matchesCategory;
  });
  const filteredCategories = categories.filter((category) => {
    const search = catalogSearch?.trim();
    return !search || includesText(category.title, search) || includesText(category.slug, search) || includesText(category.description, search) || includesText(category.parentTitle, search);
  });
  const path = catalogPath(catalogSection);
  const selectedProductColumns = parseColumns(productColumns, productColumnOptions, ['product', 'actions']);
  const selectedMediaColumns = parseColumns(mediaColumns, mediaColumnOptions, ['image', 'actions']);
  const productColumnsParam = columnParam(selectedProductColumns, productColumnOptions);
  const mediaColumnsParam = columnParam(selectedMediaColumns, mediaColumnOptions);
  const columnParams = { productColumns: productColumnsParam, mediaColumns: mediaColumnsParam };
  const paginationParams = { catalogSearch, catalogCategory, catalogFlag, ...columnParams };
  const pagedProducts = pageSlice(filteredProducts, productPage);
  const pagedCategories = pageSlice(filteredCategories, categoryPage);
  const pagedMedia = pageSlice(media, mediaPage);

  return (
    <div className="space-y-8">
      <StatusBanner status={status} message={message} t={t} />
      <DashboardIntro workspace={activeWorkspace} productCount={products.length} categoryCount={categories.length} mediaCount={media.length} t={t} />
      {showCatalog && catalogSection === 'all' ? <CatalogSectionNav /> : null}
      {showCatalog ? <CatalogFilters categories={categories} section={catalogSection} search={catalogSearch} category={catalogCategory} flag={catalogFlag} columnParams={columnParams} t={t} /> : null}
      {showOverview ? <AdminReadinessPanel runtimeReadiness={runtimeReadiness} authConfigured={authConfigured} authenticated={authenticated} notificationReadiness={notificationReadiness} notificationRetryRunbook={notificationRetryRunbook} checkoutReadiness={checkoutReadiness} locale={locale} /> : null}
      {showOverview && authenticated ? <AdminSecurityPanel summary={authEventSummary} locale={locale} /> : null}
      {showOverview ? <section className={`rounded-lg border p-6 ${databaseReady && authenticated ? 'border-olive/20 bg-white' : 'border-amber-300 bg-amber-50'}`}><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">CMS status</p><h2 className="mt-3 font-display text-3xl text-rosewood">{databaseReady && authenticated ? 'Editing enabled' : databaseReady ? 'Login required' : 'Seeded preview mode'}</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-stone-700">{databaseReady && authenticated ? 'Admin forms are live. Changes write to Prisma, then revalidate storefront pages.' : databaseReady ? 'The database is connected, but CMS writes require admin authentication.' : 'The storefront is reading seeded fallback content. Add DATABASE_URL, run npm run db:push and npm run db:seed, then restart the app to enable editing.'}</p></div>{authenticated ? <form action={logoutAction}><button className={secondaryButtonClass} type="submit">Sign out</button></form> : null}</div></section> : null}

      {showMediaSection ? <section id="media" className={panelClass}><div className="mb-6"><p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">{t('Media library')}</p><h2 className="mt-2 font-display text-4xl text-rosewood">{t('Images')}</h2><p className="mt-3 text-sm leading-6 text-stone-600">{t('Register external image URLs or upload local/dev images into')} <code>public/uploads</code>.</p></div><details className="rounded-lg border border-rosewood/10 bg-cream p-5"><summary className="cursor-pointer font-display text-3xl text-rosewood">{t('Add image')}</summary><div className="mt-5 grid gap-6 lg:grid-cols-2"><form action={createMediaFromUrlAction} className={formCardClass}><h3 className="font-display text-3xl text-rosewood">{t('Add image URL')}</h3><MediaCategorySelect disabled={disabled} /><Field label={t('Image URL')} name="url" placeholder="https://..." disabled={disabled} /><Field label={t('Alt text')} name="alt" placeholder="Blush rose bouquet" disabled={disabled} /><SubmitButton disabled={disabled}>{t('Add media')}</SubmitButton></form><form action={uploadMediaAction} className={formCardClass}><h3 className="font-display text-3xl text-rosewood">{t('Upload image')}</h3><MediaCategorySelect disabled={disabled} /><label className="grid gap-2 text-sm font-semibold text-rosewood">{t('Image file')}<input className={inputClass} name="file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" required disabled={disabled} /></label><Field label={t('Alt text')} name="alt" placeholder={t('Optional descriptive text')} required={false} disabled={disabled} /><SubmitButton disabled={disabled}>{t('Upload image')}</SubmitButton></form></div></details><div className="mt-4"><ColumnVisibilityControls path={path} paramName="mediaColumns" title="Media columns" options={mediaColumnOptions} selected={selectedMediaColumns} hiddenInputs={{ tab: catalogSection === 'all' ? 'catalog' : undefined, catalogSearch, catalogCategory, catalogFlag, productColumns: productColumnsParam }} t={t} /></div><MediaTable media={pagedMedia.items} categories={categories} products={products} disabled={disabled} columns={selectedMediaColumns} /><div className="mt-4"><PaginationControls path={path} pageParam="mediaPage" currentPage={pagedMedia.currentPage} pageCount={pagedMedia.pageCount} total={media.length} start={pagedMedia.start} end={pagedMedia.end} params={paginationParams} t={t} /></div></section> : null}

      {showContent ? <section id="homepage" className={panelClass}><div className="mb-6"><p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">Homepage</p><h2 className="mt-2 font-display text-4xl text-rosewood">Hero content</h2></div><form action={updateHomepageAction} className="grid gap-4"><div className="grid gap-4 md:grid-cols-2"><Field label="Eyebrow" name="eyebrow" defaultValue={homepage.eyebrow} disabled={disabled} /><Field label="Title" name="title" defaultValue={homepage.title} disabled={disabled} /></div><TextArea label="Body" name="body" defaultValue={homepage.body} disabled={disabled} /><div className="grid gap-4 md:grid-cols-2"><Field label="Primary CTA label" name="primaryCtaLabel" defaultValue={homepage.primaryCtaLabel} disabled={disabled} /><Field label="Primary CTA URL" name="primaryCtaHref" defaultValue={homepage.primaryCtaHref} disabled={disabled} /><Field label="Secondary CTA label" name="secondaryCtaLabel" defaultValue={homepage.secondaryCtaLabel} disabled={disabled} /><Field label="Secondary CTA URL" name="secondaryCtaHref" defaultValue={homepage.secondaryCtaHref} disabled={disabled} /><Field label="Panel eyebrow" name="panelEyebrow" defaultValue={homepage.panelEyebrow} disabled={disabled} /><Field label="Panel title" name="panelTitle" defaultValue={homepage.panelTitle} disabled={disabled} /></div><TextArea label="Panel body" name="panelBody" defaultValue={homepage.panelBody} disabled={disabled} /><SubmitButton disabled={disabled}>Save homepage</SubmitButton></form></section> : null}
      {showContent && authenticated ? <AdminTranslationPanel homepage={homepage} homepageTranslations={homepageTranslations} categories={categories} products={products} disabled={disabled} locale={locale} /> : null}

      {showCategorySection ? <section id="categories" className={panelClass}><div className="mb-6"><p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">Categories</p><h2 className="mt-2 font-display text-4xl text-rosewood">Categories and subcategories</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">Use parent category to create subcategories. Products can be assigned to either top-level categories or nested subcategories.</p></div><details className="rounded-lg border border-rosewood/10 bg-cream p-5"><summary className="cursor-pointer font-display text-3xl text-rosewood">Create category or subcategory</summary><form action={createCategoryAction} className="mt-5 grid gap-4"><CategoryFields categories={categories} media={media} disabled={disabled} /><SubmitButton disabled={disabled}>Create category</SubmitButton></form></details><div className="mt-8 flex items-center justify-between gap-4"><PaginationControls path={path} pageParam="categoryPage" currentPage={pagedCategories.currentPage} pageCount={pagedCategories.pageCount} total={filteredCategories.length} start={pagedCategories.start} end={pagedCategories.end} params={paginationParams} />{catalogSection === 'all' ? <a href="#products" className="text-sm font-semibold text-rosewood underline-offset-4 hover:underline">Jump to products</a> : null}</div>{pagedCategories.items.length === 0 ? <EmptyState title="No categories found" body="Create a category above, or adjust the current search filter." /> : <div className={`mt-4 grid gap-4 ${scrollListClass}`}>{pagedCategories.items.map((category) => <details key={category.slug} className="rounded-lg border border-rosewood/10 bg-[#fffdfb] p-5 shadow-sm"><summary className="cursor-pointer list-none"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-display text-2xl text-rosewood">{category.title}</h3><p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">{category.parentTitle ? `Subcategory of ${category.parentTitle}` : 'Top-level category'} - {category.productCount ?? 0} products</p></div><span className="rounded-full border border-rosewood/15 bg-white px-3 py-1 text-xs font-semibold text-rosewood">Edit</span></div></summary><form action={updateCategoryAction.bind(null, category.id ?? '')} className="mt-5 grid gap-4"><CategoryFields category={category} categories={categories} media={media} disabled={disabled || !category.id} /><SubmitButton disabled={disabled || !category.id}>Update category</SubmitButton></form></details>)}</div>}</section> : null}

      {showProductSection ? <section id="products" className={panelClass}><div className="mb-6"><p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">Products</p><h2 className="mt-2 font-display text-4xl text-rosewood">Product management</h2><p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">Create products, assign them to categories or subcategories, control homepage flags, and update catalog imagery.</p></div><details className="rounded-lg border border-rosewood/10 bg-cream p-5"><summary className="cursor-pointer font-display text-3xl text-rosewood">Create product</summary><form action={createProductAction} className="mt-5 grid gap-4"><ProductFields categories={categories} productTypes={productTypes} media={media} disabled={disabled} /><SubmitButton disabled={disabled}>Create product</SubmitButton></form></details><div className="mt-4 grid gap-4 rounded-lg border border-rosewood/10 bg-white p-5 md:grid-cols-[1fr_auto] md:items-start"><details><summary className="cursor-pointer font-display text-3xl text-rosewood">Import products</summary><form action={importProductsCsvAction} className="mt-5 grid gap-4"><label className="grid gap-2 text-sm font-semibold text-rosewood">CSV file<input className={inputClass} name="file" type="file" accept=".csv,text/csv" required disabled={disabled} /></label><p className="text-sm leading-6 text-stone-600">Use the export file as the template. Imports update existing products by code or slug and create new rows when no match exists.</p><SubmitButton disabled={disabled}>Import CSV</SubmitButton></form></details><a href="/admin/products/export" className={secondaryButtonClass}>Export CSV</a></div><div className="mt-8 flex items-center justify-between gap-4"><PaginationControls path={path} pageParam="productPage" currentPage={pagedProducts.currentPage} pageCount={pagedProducts.pageCount} total={filteredProducts.length} start={pagedProducts.start} end={pagedProducts.end} params={paginationParams} />{catalogSection === 'all' ? <a href="#categories" className="text-sm font-semibold text-rosewood underline-offset-4 hover:underline">Back to categories</a> : null}</div><ProductBulkBar categories={categories} disabled={disabled} /><ProductQuickEditPanel products={pagedProducts.items} categories={categories} disabled={disabled} /><div className="mt-4"><ColumnVisibilityControls path={path} paramName="productColumns" title="Product columns" options={productColumnOptions} selected={selectedProductColumns} hiddenInputs={{ tab: catalogSection === 'all' ? 'catalog' : undefined, catalogSearch, catalogCategory, catalogFlag, mediaColumns: mediaColumnsParam }} /></div><ProductTable products={pagedProducts.items} disabled={disabled} columns={selectedProductColumns} /></section> : null}
    </div>
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
              {show('pick') ? <td className="px-4 py-4">
                <input form="bulk-products-form" type="checkbox" name="productId" value={product.id ?? ''} disabled={disabled || !product.id} />
              </td> : null}
              {show('product') ? <td className="px-4 py-4">
                <div className="flex gap-3">
                  <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-blush">
                    {product.image ? <Image src={product.image} alt={product.title} fill className="object-cover" sizes="56px" /> : null}
                  </div>
                  <div>
                    <div className="font-semibold text-rosewood">{product.title}</div>
                    <div className="mt-1 text-xs text-stone-500">{product.code} - {product.slug}</div>
                  </div>
                </div>
              </td> : null}
              {show('category') ? <td className="px-4 py-4 text-stone-700">{product.categoryTitle || product.category}</td> : null}
              {show('price') ? <td className="px-4 py-4 text-stone-700">{product.price} {product.currency}</td> : null}
              {show('flags') ? <td className="px-4 py-4">
                <div className="flex flex-wrap gap-2">
                  {product.bestSeller ? <span className="rounded-full bg-rosewood px-2 py-1 text-xs font-semibold text-white">Best</span> : null}
                  {product.availableToday ? <span className="rounded-full bg-olive px-2 py-1 text-xs font-semibold text-white">Today</span> : null}
                  {product.requiresQuote || product.price <= 0 ? <span className="rounded-full bg-stone-800 px-2 py-1 text-xs font-semibold text-white">Quote</span> : null}
                  {product.isActive === false ? <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">Inactive</span> : null}
                </div>
              </td> : null}
              {show('actions') ? <td className="px-4 py-4">
                <div className="grid min-w-[32rem] gap-3">
                  <a href={`/products/${product.slug}`} className="text-xs font-semibold text-rosewood underline-offset-4 hover:underline" target="_blank">View</a>
                  <Link href={`/admin/products/${product.id ?? product.slug}`} className="text-xs font-semibold text-rosewood underline-offset-4 hover:underline" aria-disabled={disabled || !product.id}>Edit</Link>
                </div>
              </td> : null}
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

function ProductFields({ product, categories, productTypes, media, disabled }: { product?: Product; categories: Category[]; productTypes: ProductType[]; media: MediaItem[]; disabled: boolean }) {
  return <><div className="grid gap-4 md:grid-cols-2"><Field label="Title" name="title" defaultValue={product?.title} disabled={disabled} /><Field label="Slug" name="slug" defaultValue={product?.slug} disabled={disabled} /></div><div className="grid gap-4 md:grid-cols-3"><Field label="Code" name="code" defaultValue={product?.code} disabled={disabled} /><label className="grid gap-2 text-sm font-semibold text-rosewood">Category or subcategory<select className={inputClass} name="categoryId" defaultValue={categoryDefaultValue(product ?? ({ category: '' } as Product), categories)} disabled={disabled} required><option value="">Choose category</option>{categories.map((category) => <option key={category.id ?? category.slug} value={category.id ?? ''}>{category.parentTitle ? `${category.parentTitle} / ${category.title}` : category.title}</option>)}</select></label><label className="grid gap-2 text-sm font-semibold text-rosewood">Product type<select className={inputClass} name="productTypeId" defaultValue={product?.productTypeId ?? ''} disabled={disabled}><option value="">No product type</option>{productTypes.map((productType) => <option key={productType.id} value={productType.id}>{productType.name}</option>)}</select></label></div><TextArea label="Description" name="description" defaultValue={product?.description} disabled={disabled} /><div className="grid gap-4 md:grid-cols-2"><Field label="Price" name="price" type="number" defaultValue={product?.price ?? 0} disabled={disabled} /><Field label="Currency" name="currency" defaultValue={product?.currency ?? 'CAD'} disabled={disabled} /></div><MediaSelect label="Product image from media library" name="selectedMediaUrl" media={media} mediaCategory="product" defaultValue={product?.image} disabled={disabled} /><Field label="Manual product image URL" name="imageUrl" defaultValue={product?.image} required={false} disabled={disabled} /><div className="grid gap-3 md:grid-cols-4"><Toggle label="Available today" name="availableToday" defaultChecked={product?.availableToday ?? true} disabled={disabled} /><Toggle label="Best seller" name="bestSeller" defaultChecked={product?.bestSeller ?? false} disabled={disabled} /><Toggle label="Requires quote" name="requiresQuote" defaultChecked={product?.requiresQuote ?? false} disabled={disabled} /><Toggle label="Active" name="isActive" defaultChecked={product?.isActive ?? true} disabled={disabled} /></div><Field label="Sort order" name="sortOrder" type="number" defaultValue={0} disabled={disabled} /></>;
}
