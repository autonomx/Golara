import 'server-only';

import { revalidateTag, unstable_cache } from 'next/cache';
import type { Category } from '@/lib/catalog';
import {
  getCategoryBySlug,
  getHomepageContent,
  getProductBySlug,
  listCategories,
  listHomepageCategories,
  listProducts
} from '@/lib/cms/catalog-repository';
import {
  listBestSellerProducts,
  listProductsForCategorySlugs,
  listPublicCategorySlugs,
  listPublicProductCountsByCategoryId,
  listPublicProductSlugs,
  listPublicProducts,
  type PublicCatalogReadOptions,
  type PublicProductQueryOptions
} from '@/lib/cms/public-catalog-queries';

const STOREFRONT_PUBLIC_REVALIDATE_SECONDS = 60;
const STOREFRONT_PUBLIC_TAG = 'storefront-public';
const STOREFRONT_CATALOG_TAG = 'storefront-catalog';
const STOREFRONT_HOMEPAGE_TAG = 'storefront-homepage';

export function revalidateStorefrontPublicCache() {
  revalidateTag(STOREFRONT_PUBLIC_TAG);
}

export function revalidateStorefrontCatalogCache() {
  revalidateTag(STOREFRONT_CATALOG_TAG);
}

export function revalidateStorefrontHomepageCache() {
  revalidateTag(STOREFRONT_HOMEPAGE_TAG);
}

function localeKey(locale?: string | null) {
  return locale?.trim() || 'default';
}

function takeKey(take?: number) {
  return Number.isFinite(take) ? String(Math.floor(Number(take))) : 'default';
}

function searchKey(search?: string) {
  return search?.trim().replace(/\s+/g, ' ') || 'none';
}

function categorySlugsKey(categorySlugs?: string[]) {
  return Array.from(new Set((categorySlugs ?? []).map((slug) => slug.trim()).filter(Boolean))).sort().join(',') || 'all';
}

function publicCache<T>(keyParts: string[], tags: string[], read: () => Promise<T>) {
  return unstable_cache(read, keyParts, {
    revalidate: STOREFRONT_PUBLIC_REVALIDATE_SECONDS,
    tags: [STOREFRONT_PUBLIC_TAG, ...tags]
  })();
}

export function getCachedHomepageContent(options: PublicCatalogReadOptions = {}) {
  const locale = localeKey(options.locale);
  return publicCache(
    ['homepage-content', locale],
    [STOREFRONT_HOMEPAGE_TAG],
    () => getHomepageContent({ locale: options.locale })
  );
}

export function listCachedCategories(options: PublicCatalogReadOptions = {}): Promise<Category[]> {
  const locale = localeKey(options.locale);
  return publicCache(
    ['categories', locale],
    [STOREFRONT_CATALOG_TAG],
    () => listCategories({ locale: options.locale })
  );
}

export function listCachedHomepageCategories(options: PublicCatalogReadOptions = {}): Promise<Category[]> {
  const locale = localeKey(options.locale);
  return publicCache(
    ['homepage-categories', locale],
    [STOREFRONT_CATALOG_TAG, STOREFRONT_HOMEPAGE_TAG],
    () => listHomepageCategories({ locale: options.locale })
  );
}

export function getCachedCategoryBySlug(slug: string, options: PublicCatalogReadOptions = {}) {
  const locale = localeKey(options.locale);
  return publicCache(
    ['category-by-slug', locale, slug],
    [STOREFRONT_CATALOG_TAG, `storefront-category:${slug}`],
    () => getCategoryBySlug(slug, { locale: options.locale })
  );
}

export function listCachedProducts(options: PublicCatalogReadOptions = {}) {
  const locale = localeKey(options.locale);
  return publicCache(
    ['products-all', locale],
    [STOREFRONT_CATALOG_TAG],
    () => listProducts({ locale: options.locale })
  );
}

export function listCachedPublicProducts(options: PublicProductQueryOptions = {}) {
  const locale = localeKey(options.locale);
  const search = searchKey(options.search);
  const slugs = categorySlugsKey(options.categorySlugs);
  const take = takeKey(options.take);
  return publicCache(
    ['products-public', locale, search, slugs, take],
    [STOREFRONT_CATALOG_TAG],
    () => listPublicProducts(options)
  );
}

export function listCachedBestSellerProducts(options: PublicCatalogReadOptions & { take?: number } = {}) {
  const locale = localeKey(options.locale);
  const take = takeKey(options.take);
  return publicCache(
    ['products-best-sellers', locale, take],
    [STOREFRONT_CATALOG_TAG, STOREFRONT_HOMEPAGE_TAG],
    () => listBestSellerProducts(options)
  );
}

export function listCachedProductsForCategorySlugs(
  categorySlugs: string[],
  options: PublicCatalogReadOptions & { take?: number } = {}
) {
  const locale = localeKey(options.locale);
  const slugs = categorySlugsKey(categorySlugs);
  const take = takeKey(options.take);
  return publicCache(
    ['products-for-category-slugs', locale, slugs, take],
    [STOREFRONT_CATALOG_TAG],
    () => listProductsForCategorySlugs(categorySlugs, options)
  );
}

export function listCachedPublicProductCountsByCategoryId() {
  return publicCache(
    ['product-counts-by-category-id'],
    [STOREFRONT_CATALOG_TAG, STOREFRONT_HOMEPAGE_TAG],
    listPublicProductCountsByCategoryId
  );
}

export function listCachedPublicProductSlugs() {
  return publicCache(
    ['product-slugs-public'],
    [STOREFRONT_CATALOG_TAG],
    listPublicProductSlugs
  );
}

export function listCachedPublicCategorySlugs() {
  return publicCache(
    ['category-slugs-public'],
    [STOREFRONT_CATALOG_TAG],
    listPublicCategorySlugs
  );
}

export function getCachedProductBySlug(slug: string, options: PublicCatalogReadOptions = {}) {
  const locale = localeKey(options.locale);
  return publicCache(
    ['product-by-slug', locale, slug],
    [STOREFRONT_CATALOG_TAG, `storefront-product:${slug}`],
    () => getProductBySlug(slug, { locale: options.locale })
  );
}
