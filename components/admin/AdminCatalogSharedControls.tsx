import Link from 'next/link';

type ColumnOption<T extends string> = {
  key: T;
  label: string;
};

type PaginationState = {
  currentPage: number;
  pageCount: number;
  total: number;
  start: number;
  end: number;
};

type PaginationControlsProps = PaginationState & {
  path: string;
  pageParam: string;
  pageSize?: number;
  params: Record<string, string | undefined>;
  t?: (key: string) => string;
};

type ColumnVisibilityControlsProps<T extends string> = {
  path: string;
  paramName: string;
  title: string;
  options: readonly ColumnOption<T>[];
  selected: T[];
  hiddenInputs: Record<string, string | undefined>;
  t?: (key: string) => string;
};

function paginationHref(path: string, pageParam: string, page: number, params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  if (page > 1) query.set(pageParam, String(page));
  const serialized = query.toString();
  return serialized ? `${path}?${serialized}` : path;
}

export function AdminCatalogPaginationControls({ path, pageParam, currentPage, pageCount, total, start, end, pageSize = 12, params, t = (key: string) => key }: PaginationControlsProps) {
  if (total <= pageSize) {
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

export function AdminCatalogColumnVisibilityControls<T extends string>({ path, paramName, title, options, selected, hiddenInputs, t = (key: string) => key }: ColumnVisibilityControlsProps<T>) {
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
