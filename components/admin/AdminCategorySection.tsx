import type { ReactNode } from 'react';
import type { Category, MediaItem } from '@/lib/catalog';
import { createCategoryAction, updateCategoryAction } from '@/app/admin/actions';
import { MediaSelectWithPreview } from '@/components/admin/MediaSelectWithPreview';

type PageSlice<T> = {
  currentPage: number;
  pageCount: number;
  items: T[];
  start: number;
  end: number;
};

type AdminCategorySectionProps = {
  categories: Category[];
  media: MediaItem[];
  pagedCategories: PageSlice<Category>;
  filteredCategoryCount: number;
  path: string;
  paginationParams: Record<string, string | undefined>;
  catalogSection: 'all' | 'categories';
  disabled: boolean;
  t?: (key: string) => string;
};

const inputClass = 'rounded-lg border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';
const textAreaClass = 'min-h-28 rounded-lg border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';
const toggleClass = 'flex items-center gap-3 rounded-lg border border-rosewood/10 bg-white px-4 py-3 text-sm font-semibold text-rosewood outline-none transition focus-within:ring-4 focus-within:ring-olive/20';
const primaryButtonClass = 'w-fit rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none';
const panelClass = 'scroll-mt-24 rounded-lg border border-rosewood/10 bg-white p-6 shadow-sm';
const scrollListClass = 'max-h-[760px] overflow-auto pr-2 [scrollbar-width:thin] [scrollbar-color:#6f2438_#fff8f1]';
const catalogPageSize = 12;

function paginationHref(path: string, pageParam: string, page: number, params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  if (page > 1) query.set(pageParam, String(page));
  const serialized = query.toString();
  return serialized ? `${path}?${serialized}` : path;
}

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

function PaginationControls({ path, pageParam, currentPage, pageCount, total, start, end, params, t = (key: string) => key }: { path: string; pageParam: string; currentPage: number; pageCount: number; total: number; start: number; end: number; params: Record<string, string | undefined>; t?: (key: string) => string }) {
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

function mediaForCategory(media: MediaItem[], mediaCategory: string, defaultValue?: string) {
  return media.filter((item) => item.mediaCategory === mediaCategory || item.url === defaultValue);
}

function MediaSelect({ label, name, media, mediaCategory, defaultValue, disabled }: { label: string; name: string; media: MediaItem[]; mediaCategory: string; defaultValue?: string; disabled: boolean }) {
  return <MediaSelectWithPreview label={label} name={name} media={mediaForCategory(media, mediaCategory, defaultValue)} defaultValue={defaultValue} disabled={disabled} className={inputClass} />;
}

function CategoryFields({ category, categories, media, disabled, t = (key: string) => key }: { category?: Category; categories: Category[]; media: MediaItem[]; disabled: boolean; t?: (key: string) => string }) {
  return <><div className="grid gap-4 md:grid-cols-2"><Field label={t('Title')} name="title" defaultValue={category?.title} disabled={disabled} /><Field label={t('Slug')} name="slug" defaultValue={category?.slug} disabled={disabled} /></div><TextArea label={t('Eyebrow')} name="eyebrow" defaultValue={category?.eyebrow} disabled={disabled} /><TextArea label={t('Description')} name="description" defaultValue={category?.description} disabled={disabled} /><MediaSelect label={t('Category image from media library')} name="categorySelectedMediaUrl" media={media} mediaCategory="category" defaultValue={category?.image} disabled={disabled} /><Field label={t('Manual category image URL')} name="categoryImageUrl" defaultValue={category?.image} required={false} disabled={disabled} /><label className="grid gap-2 text-sm font-semibold text-rosewood">{t('Parent category')}<select className={inputClass} name="parentId" defaultValue={category?.parentId ?? ''} disabled={disabled}><option value="">{t('No parent')}</option>{categories.filter((candidate) => candidate.id !== category?.id).map((candidate) => <option key={candidate.id ?? candidate.slug} value={candidate.id ?? ''}>{candidate.parentTitle ? `${candidate.parentTitle} / ${candidate.title}` : candidate.title}</option>)}</select></label><div className="grid gap-3 md:grid-cols-3"><Field label={t('Sort order')} name="sortOrder" type="number" defaultValue={category?.sortOrder ?? 100} disabled={disabled} /><Toggle label={t('Show on homepage')} name="showOnHomepage" defaultChecked={category?.showOnHomepage ?? true} disabled={disabled} /><Toggle label={t('Active')} name="isActive" defaultChecked={category?.isActive ?? true} disabled={disabled} /></div></>;
}

export function AdminCategorySection({ categories, media, pagedCategories, filteredCategoryCount, path, paginationParams, catalogSection, disabled, t = (key: string) => key }: AdminCategorySectionProps) {
  return (
    <section id="categories" className={panelClass}>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">{t('Categories')}</p>
        <h2 className="mt-2 font-display text-4xl text-rosewood">{t('Categories and subcategories')}</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">{t('Use parent category to create subcategories. Products can be assigned to either top-level categories or nested subcategories.')}</p>
      </div>
      <details className="rounded-lg border border-rosewood/10 bg-cream p-5">
        <summary className="cursor-pointer font-display text-3xl text-rosewood">{t('Create category or subcategory')}</summary>
        <form action={createCategoryAction} className="mt-5 grid gap-4">
          <CategoryFields categories={categories} media={media} disabled={disabled} t={t} />
          <SubmitButton disabled={disabled}>{t('Create category')}</SubmitButton>
        </form>
      </details>
      <div className="mt-8 flex items-center justify-between gap-4">
        <PaginationControls path={path} pageParam="categoryPage" currentPage={pagedCategories.currentPage} pageCount={pagedCategories.pageCount} total={filteredCategoryCount} start={pagedCategories.start} end={pagedCategories.end} params={paginationParams} t={t} />
        {catalogSection === 'all' ? <a href="#products" className="text-sm font-semibold text-rosewood underline-offset-4 hover:underline">{t('Jump to products')}</a> : null}
      </div>
      {pagedCategories.items.length === 0 ? <EmptyState title={t('No categories found')} body={t('Create category or subcategory')} /> : <div className={`mt-4 grid gap-4 ${scrollListClass}`}>{pagedCategories.items.map((category) => <details key={category.slug} className="rounded-lg border border-rosewood/10 bg-[#fffdfb] p-5 shadow-sm"><summary className="cursor-pointer list-none"><div className="flex flex-wrap items-center justify-between gap-3"><div><h3 className="font-display text-2xl text-rosewood">{category.title}</h3><p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">{category.parentTitle ? `${t('Parent category')}: ${category.parentTitle}` : t('Top-level category')} - {category.productCount ?? 0} {t('Products')}</p></div><span className="rounded-full border border-rosewood/15 bg-white px-3 py-1 text-xs font-semibold text-rosewood">{t('Edit')}</span></div></summary><form action={updateCategoryAction.bind(null, category.id ?? '')} className="mt-5 grid gap-4"><CategoryFields category={category} categories={categories} media={media} disabled={disabled || !category.id} t={t} /><SubmitButton disabled={disabled || !category.id}>{t('Update category')}</SubmitButton></form></details>)}</div>}
    </section>
  );
}
