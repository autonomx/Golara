import type { Category } from '@/lib/catalog';

export type AdminCatalogSection = 'all' | 'media' | 'categories' | 'products';

type AdminCatalogControlsProps = {
  categories: Category[];
  section: AdminCatalogSection;
  search?: string;
  category?: string;
  flag?: string;
  columnParams?: Record<string, string | undefined>;
  showSectionNav?: boolean;
  t?: (key: string) => string;
};

const inputClass = 'rounded-lg border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';
const primaryButtonClass = 'w-fit rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none';

function catalogPath(section: AdminCatalogSection) {
  if (section === 'media') return '/admin/media';
  if (section === 'categories') return '/admin/categories';
  if (section === 'products') return '/admin/products';
  return '/admin';
}

function AdminCatalogSectionNav({ t = (key: string) => key }: { t?: (key: string) => string }) {
  const links = [
    { href: '#media', label: 'Media', detail: 'Images and uploads' },
    { href: '#categories', label: 'Categories', detail: 'Sections and subcategories' },
    { href: '#products', label: 'Products', detail: 'Items and bulk actions' }
  ];

  return (
    <nav aria-label={t('Catalog sections')} className="sticky top-20 z-10 rounded-lg border border-stone-200 bg-white/95 p-1.5 shadow-sm backdrop-blur">
      <div className="flex flex-wrap gap-1.5">
        {links.map((link) => (
          <a key={link.href} href={link.href} title={t(link.detail)} className="rounded-md border border-transparent bg-white px-3 py-2 text-sm font-semibold text-stone-700 transition hover:border-stone-200 hover:bg-stone-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-olive/20">
            {t(link.label)}
          </a>
        ))}
      </div>
    </nav>
  );
}

function AdminCatalogFilters({ categories, section, search, category, flag, columnParams, t = (key: string) => key }: Omit<AdminCatalogControlsProps, 'showSectionNav'>) {
  return (
    <form action={catalogPath(section)} className="mb-6 grid gap-3 rounded-lg border border-rosewood/10 bg-white p-4 md:grid-cols-[1.2fr_1fr_1fr_auto]">
      {section === 'all' ? <input type="hidden" name="tab" value="catalog" /> : null}
      {Object.entries(columnParams ?? {}).map(([name, value]) => value ? <input key={name} type="hidden" name={name} value={value} /> : null)}
      <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-rosewood/70">
        {t('Search')}
        <input name="catalogSearch" className={inputClass} defaultValue={search} placeholder={t('Title, code, slug...')} />
      </label>
      <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-rosewood/70">
        {t('Category')}
        <select name="catalogCategory" className={inputClass} defaultValue={category ?? ''}>
          <option value="">{t('All categories')}</option>
          {categories.map((item) => <option key={item.slug} value={item.slug}>{item.parentTitle ? `${item.parentTitle} / ${item.title}` : item.title}</option>)}
        </select>
      </label>
      <label className="grid gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-rosewood/70">
        {t('Product flag')}
        <select name="catalogFlag" className={inputClass} defaultValue={flag ?? ''}>
          <option value="">{t('All products')}</option>
          <option value="best-seller">{t('Best sellers')}</option>
          <option value="available-today">{t('Available today')}</option>
          <option value="quote-only">{t('Quote only')}</option>
          <option value="inactive">{t('Inactive')}</option>
          <option value="missing-image">{t('Missing image')}</option>
        </select>
      </label>
      <button type="submit" className={primaryButtonClass}>{t('Filter')}</button>
    </form>
  );
}

export function AdminCatalogControls({ categories, section, search, category, flag, columnParams, showSectionNav = false, t = (key: string) => key }: AdminCatalogControlsProps) {
  return (
    <>
      {showSectionNav ? <AdminCatalogSectionNav t={t} /> : null}
      <AdminCatalogFilters categories={categories} section={section} search={search} category={category} flag={flag} columnParams={columnParams} t={t} />
    </>
  );
}
