import type { Product } from '@/lib/catalog';

export type AdminDashboardWorkspace = 'overview' | 'catalog' | 'content' | 'sales';

export type AdminCatalogSection = 'all' | 'media' | 'categories' | 'products';

export const adminCatalogPageSize = 12;

export const adminProductColumnOptions = [
  { key: 'pick', label: 'Bulk pick' },
  { key: 'product', label: 'Product' },
  { key: 'category', label: 'Category' },
  { key: 'price', label: 'Price' },
  { key: 'flags', label: 'Flags' },
  { key: 'actions', label: 'Actions' }
] as const;

export type AdminProductColumn = (typeof adminProductColumnOptions)[number]['key'];

export const adminMediaColumnOptions = [
  { key: 'image', label: 'Image' },
  { key: 'category', label: 'Image category' },
  { key: 'belongsTo', label: 'Belongs to' },
  { key: 'linkedItem', label: 'Linked item' },
  { key: 'source', label: 'Source' },
  { key: 'url', label: 'URL' },
  { key: 'actions', label: 'Actions' }
] as const;

export type AdminMediaColumn = (typeof adminMediaColumnOptions)[number]['key'];

export type AdminPageSlice<T> = {
  currentPage: number;
  pageCount: number;
  items: T[];
  start: number;
  end: number;
};

export function adminCatalogPath(section: AdminCatalogSection) {
  if (section === 'media') return '/admin/media';
  if (section === 'categories') return '/admin/categories';
  if (section === 'products') return '/admin/products';
  return '/admin';
}

export function adminPageSlice<T>(items: T[], page: number, pageSize = adminCatalogPageSize): AdminPageSlice<T> {
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

export function adminPaginationHref(path: string, pageParam: string, page: number, params: Record<string, string | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value) query.set(key, value);
  });
  if (page > 1) query.set(pageParam, String(page));
  const serialized = query.toString();
  return serialized ? `${path}?${serialized}` : path;
}

export function parseAdminCatalogColumns<T extends string>(
  value: string | string[] | undefined,
  options: readonly { key: T; label: string }[],
  required: T[] = []
) {
  const valid = new Set(options.map((option) => option.key));
  const raw = Array.isArray(value) ? value : value?.split(',');
  const selected = (raw ?? options.map((option) => option.key)).filter((item): item is T => valid.has(item as T));
  const withRequired = new Set<T>([...required, ...selected]);
  return options.map((option) => option.key).filter((key) => withRequired.has(key));
}

export function adminCatalogColumnParam<T extends string>(columns: T[], options: readonly { key: T; label: string }[]) {
  const defaults = options.map((option) => option.key);
  return columns.length === defaults.length && columns.every((column) => defaults.includes(column)) ? undefined : columns.join(',');
}

export function includesAdminCatalogText(value: string | undefined, search: string) {
  return value?.toLowerCase().includes(search.toLowerCase()) ?? false;
}

export function adminProductMatchesFlag(product: Product, flag?: string) {
  if (flag === 'best-seller') return Boolean(product.bestSeller);
  if (flag === 'available-today') return product.availableToday;
  if (flag === 'quote-only') return Boolean(product.requiresQuote || product.price <= 0);
  if (flag === 'inactive') return product.isActive === false;
  if (flag === 'missing-image') return !product.image;
  return true;
}
