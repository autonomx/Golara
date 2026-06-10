import Image from 'next/image';
import type { ReactNode } from 'react';
import type { Category, MediaItem, Product } from '@/lib/catalog';
import {
  createMediaFromUrlAction,
  updateMediaAction,
  updateMediaCategoryAction,
  uploadMediaAction
} from '@/app/admin/actions';
import { homepageBannerSlides, homepageBestSellerImage, homepageCategoryImage } from '@/lib/homepage-assets';

type CatalogSection = 'all' | 'media' | 'categories' | 'products';

type MediaUsage = { type: string; label: string };

type AdminTranslator = (key: string) => string;

export const mediaColumnOptions = [
  { key: 'image', label: 'Image' },
  { key: 'category', label: 'Image category' },
  { key: 'belongsTo', label: 'Belongs to' },
  { key: 'linkedItem', label: 'Linked item' },
  { key: 'source', label: 'Source' },
  { key: 'url', label: 'URL' },
  { key: 'actions', label: 'Actions' }
] as const;

export type MediaColumn = (typeof mediaColumnOptions)[number]['key'];

type PageSlice<T> = {
  currentPage: number;
  pageCount: number;
  items: T[];
  start: number;
  end: number;
};

type AdminMediaSectionProps = {
  categories: Category[];
  products: Product[];
  disabled: boolean;
  path: string;
  catalogSection: CatalogSection;
  catalogSearch?: string;
  catalogCategory?: string;
  catalogFlag?: string;
  productColumnsParam?: string;
  selectedMediaColumns: MediaColumn[];
  pagedMedia: PageSlice<MediaItem>;
  totalMedia: number;
  paginationParams: Record<string, string | undefined>;
  t?: AdminTranslator;
};

const inputClass = 'rounded-lg border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';
const primaryButtonClass = 'w-fit rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none';
const formCardClass = 'grid gap-4 rounded-lg border border-rosewood/10 bg-white p-5 shadow-sm';
const panelClass = 'scroll-mt-24 rounded-lg border border-rosewood/10 bg-white p-6 shadow-sm';
const catalogPageSize = 12;

const mediaCategoryOptions = [
  { value: 'product', label: 'Product' },
  { value: 'category', label: 'Category' },
  { value: 'homepage-banner', label: 'Homepage hero' },
  { value: 'homepage-best-seller', label: 'Homepage best seller' },
  { value: 'homepage-category', label: 'Homepage category' },
  { value: 'general', label: 'General / other' }
];

function Field({ label, name, defaultValue, placeholder, type = 'text', disabled = false, required = true }: { label: string; name: string; defaultValue?: string | number; placeholder?: string; type?: string; disabled?: boolean; required?: boolean }) {
  return <label className="grid gap-2 text-sm font-semibold text-rosewood">{label}<input className={inputClass} name={name} type={type} defaultValue={defaultValue} placeholder={placeholder} disabled={disabled} required={required} /></label>;
}

function MediaCategorySelect({ defaultValue = 'product', disabled = false, t }: { defaultValue?: string; disabled?: boolean; t: AdminTranslator }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-rosewood">
      {t('Image category')}
      <select className={inputClass} name="mediaCategory" defaultValue={defaultValue} disabled={disabled} required>
        {mediaCategoryOptions.map((option) => <option key={option.value} value={option.value}>{t(option.label)}</option>)}
      </select>
    </label>
  );
}

function SubmitButton({ children, disabled }: { children: ReactNode; disabled: boolean }) {
  return <button className={primaryButtonClass} type="submit" disabled={disabled}>{children}</button>;
}

function normalizeMediaUrl(url?: string | null) {
  return url?.trim() || null;
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

function MediaUsagePills({ usages, t }: { usages: MediaUsage[]; t: AdminTranslator }) {
  return (
    <div className="flex flex-wrap gap-2">
      {usages.map((usage) => (
        <span key={`${usage.type}-${usage.label}`} className={`rounded-full px-2 py-1 text-xs font-semibold ${usage.type === 'Unassigned' ? 'bg-stone-100 text-stone-600' : 'bg-olive/10 text-olive'}`}>
          {t(usage.type)}
        </span>
      ))}
    </div>
  );
}

function MediaCategoryInlineForm({ item, disabled, t }: { item: MediaItem; disabled: boolean; t: AdminTranslator }) {
  if (!item.id) {
    const label = mediaCategoryOptions.find((option) => option.value === item.mediaCategory)?.label ?? item.mediaCategory ?? 'General / other';
    return <span>{t(label)}</span>;
  }

  return (
    <form action={updateMediaCategoryAction.bind(null, item.id)} className="grid min-w-56 gap-2">
      <select className={`${inputClass} py-2 text-sm`} name="mediaCategory" defaultValue={item.mediaCategory ?? 'general'} disabled={disabled} required>
        {mediaCategoryOptions.map((option) => <option key={option.value} value={option.value}>{t(option.label)}</option>)}
      </select>
      <button type="submit" className="rounded-full border border-rosewood/20 px-3 py-1.5 text-xs font-semibold text-rosewood outline-none transition hover:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:border-stone-200 disabled:text-stone-400" disabled={disabled}>
        {t('Save category')}
      </button>
    </form>
  );
}

function MediaEditFields({ item, disabled, t }: { item: MediaItem; disabled: boolean; t: AdminTranslator }) {
  return (
    <>
      <div className="grid gap-4 md:grid-cols-[1.4fr_1fr_1fr]">
        <Field label={t('Image URL')} name="url" defaultValue={item.url} disabled={disabled} />
        <Field label={t('Alt text')} name="alt" defaultValue={item.alt} disabled={disabled} />
        <MediaCategorySelect defaultValue={item.mediaCategory ?? 'general'} disabled={disabled} t={t} />
      </div>
      <SubmitButton disabled={disabled}>{t('Update media')}</SubmitButton>
    </>
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

function MediaTable({ media, categories, products, disabled, columns, t }: { media: MediaItem[]; categories: Category[]; products: Product[]; disabled: boolean; columns: MediaColumn[]; t: AdminTranslator }) {
  const usageByUrl = buildMediaUsageMap(categories, products);
  const show = (column: MediaColumn) => columns.includes(column);

  if (media.length === 0) {
    return <EmptyState title={t('No images found')} body={t('Add an image above, or clear filters and pagination to return to the full media library.')} />;
  }

  return (
    <div className="mt-8 max-h-[760px] overflow-auto rounded-lg border border-rosewood/10 bg-white [scrollbar-width:thin] [scrollbar-color:#6f2438_#fff8f1]">
      <table className="w-full min-w-[1180px] border-collapse text-left text-sm">
        <thead className="sticky top-0 z-[1] bg-cream text-xs font-semibold uppercase tracking-[0.16em] text-rosewood/70">
          <tr>
            {show('image') ? <th className="px-4 py-3">{t('Image')}</th> : null}
            {show('category') ? <th className="px-4 py-3">{t('Image category')}</th> : null}
            {show('belongsTo') ? <th className="px-4 py-3">{t('Belongs to')}</th> : null}
            {show('linkedItem') ? <th className="px-4 py-3">{t('Linked item')}</th> : null}
            {show('source') ? <th className="px-4 py-3">{t('Source')}</th> : null}
            {show('url') ? <th className="px-4 py-3">{t('URL')}</th> : null}
            {show('actions') ? <th className="px-4 py-3">{t('Actions')}</th> : null}
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
                      <div className="mt-1 text-xs text-stone-500">{item.createdAt ? item.createdAt.toLocaleDateString('en-CA') : t('Seed or static asset')}</div>
                    </div>
                  </div>
                </td> : null}
                {show('category') ? <td className="px-4 py-4 text-stone-700"><MediaCategoryInlineForm item={item} disabled={disabled} t={t} /></td> : null}
                {show('belongsTo') ? <td className="px-4 py-4"><MediaUsagePills usages={usages} t={t} /></td> : null}
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
                      <summary className="cursor-pointer text-xs font-semibold text-rosewood underline-offset-4 hover:underline">{t('Edit')}</summary>
                      <form action={updateMediaAction.bind(null, item.id)} className="mt-4 grid gap-4 rounded-lg border border-rosewood/10 bg-[#fffdfb] p-4">
                        <MediaEditFields item={item} disabled={disabled} t={t} />
                      </form>
                    </details>
                  ) : <span className="text-xs font-semibold text-stone-400">{t('Static')}</span>}
                </td> : null}
              </tr>
            );
          })}
        </tbody>
      </table>
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

function PaginationControls({ path, pageParam, currentPage, pageCount, total, start, end, params, t = (key: string) => key }: { path: string; pageParam: string; currentPage: number; pageCount: number; total: number; start: number; end: number; params: Record<string, string | undefined>; t?: AdminTranslator }) {
  if (total <= catalogPageSize) {
    return <p className="text-sm font-semibold text-stone-600">{t('Showing')} {total} {total === 1 ? t('item') : t('items')}.</p>;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <p className="font-semibold text-stone-600">{t('Showing')} {start}-{end} {t('of')} {total}.</p>
      <div className="flex items-center gap-2">
        <a aria-disabled={currentPage <= 1} href={paginationHref(path, pageParam, Math.max(1, currentPage - 1), params)} className={`rounded-md border px-3 py-2 font-semibold ${currentPage <= 1 ? 'pointer-events-none border-stone-200 text-stone-300' : 'border-rosewood/20 text-rosewood hover:border-rosewood'}`}>
          {t('Previous')}
        </a>
        <span className="rounded-md border border-stone-200 bg-stone-50 px-3 py-2 font-semibold text-stone-700">{t('Page')} {currentPage} {t('of')} {pageCount}</span>
        <a aria-disabled={currentPage >= pageCount} href={paginationHref(path, pageParam, Math.min(pageCount, currentPage + 1), params)} className={`rounded-md border px-3 py-2 font-semibold ${currentPage >= pageCount ? 'pointer-events-none border-stone-200 text-stone-300' : 'border-rosewood/20 text-rosewood hover:border-rosewood'}`}>
          {t('Next')}
        </a>
      </div>
    </div>
  );
}

function ColumnVisibilityControls<T extends string>({ path, paramName, title, options, selected, hiddenInputs, t = (key: string) => key }: { path: string; paramName: string; title: string; options: readonly { key: T; label: string }[]; selected: T[]; hiddenInputs: Record<string, string | undefined>; t?: AdminTranslator }) {
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

export function AdminMediaSection({
  categories,
  products,
  disabled,
  path,
  catalogSection,
  catalogSearch,
  catalogCategory,
  catalogFlag,
  productColumnsParam,
  selectedMediaColumns,
  pagedMedia,
  totalMedia,
  paginationParams,
  t = (key: string) => key
}: AdminMediaSectionProps) {
  return (
    <section id="media" className={panelClass}>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">{t('Media library')}</p>
        <h2 className="mt-2 font-display text-4xl text-rosewood">{t('Images')}</h2>
        <p className="mt-3 text-sm leading-6 text-stone-600">{t('Register external image URLs or upload local/dev images into')} <code>public/uploads</code>.</p>
      </div>
      <details className="rounded-lg border border-rosewood/10 bg-cream p-5">
        <summary className="cursor-pointer font-display text-3xl text-rosewood">{t('Add image')}</summary>
        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <form action={createMediaFromUrlAction} className={formCardClass}>
            <h3 className="font-display text-3xl text-rosewood">{t('Add image URL')}</h3>
            <MediaCategorySelect disabled={disabled} t={t} />
            <Field label={t('Image URL')} name="url" placeholder="https://..." disabled={disabled} />
            <Field label={t('Alt text')} name="alt" placeholder={t('Blush rose bouquet')} disabled={disabled} />
            <SubmitButton disabled={disabled}>{t('Add media')}</SubmitButton>
          </form>
          <form action={uploadMediaAction} className={formCardClass}>
            <h3 className="font-display text-3xl text-rosewood">{t('Upload image')}</h3>
            <MediaCategorySelect disabled={disabled} t={t} />
            <label className="grid gap-2 text-sm font-semibold text-rosewood">{t('Image file')}<input className={inputClass} name="file" type="file" accept="image/jpeg,image/png,image/webp,image/gif" required disabled={disabled} /></label>
            <Field label={t('Alt text')} name="alt" placeholder={t('Optional descriptive text')} required={false} disabled={disabled} />
            <SubmitButton disabled={disabled}>{t('Upload image')}</SubmitButton>
          </form>
        </div>
      </details>
      <div className="mt-4">
        <ColumnVisibilityControls
          path={path}
          paramName="mediaColumns"
          title="Media columns"
          options={mediaColumnOptions}
          selected={selectedMediaColumns}
          hiddenInputs={{ tab: catalogSection === 'all' ? 'catalog' : undefined, catalogSearch, catalogCategory, catalogFlag, productColumns: productColumnsParam }}
          t={t}
        />
      </div>
      <MediaTable media={pagedMedia.items} categories={categories} products={products} disabled={disabled} columns={selectedMediaColumns} t={t} />
      <div className="mt-4">
        <PaginationControls path={path} pageParam="mediaPage" currentPage={pagedMedia.currentPage} pageCount={pagedMedia.pageCount} total={totalMedia} start={pagedMedia.start} end={pagedMedia.end} params={paginationParams} t={t} />
      </div>
    </section>
  );
}
