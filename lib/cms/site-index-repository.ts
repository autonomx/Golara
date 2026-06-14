import 'server-only';

import { unstable_cache } from 'next/cache';
import { hasDatabase, prisma } from '@/lib/prisma';
import { seedCategories, seedProducts } from '@/lib/seed-data';

export type SiteIndexEntry = {
  slug: string;
  updatedAt?: Date;
  bestSeller?: boolean;
};

const SITE_INDEX_REVALIDATE_SECONDS = 60;
const STOREFRONT_PUBLIC_TAG = 'storefront-public';
const STOREFRONT_CATALOG_TAG = 'storefront-catalog';

async function readCategoryIndexEntries(): Promise<SiteIndexEntry[]> {
  if (!hasDatabase()) {
    return seedCategories
      .filter((category) => category.isActive !== false)
      .map((category) => ({ slug: category.slug }));
  }

  try {
    const categories = await prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true, updatedAt: true },
      orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }]
    });
    return categories;
  } catch (error) {
    console.warn('[site-index] category read failed; using seeded fallback content', error);
    return seedCategories
      .filter((category) => category.isActive !== false)
      .map((category) => ({ slug: category.slug }));
  }
}

async function readProductIndexEntries(): Promise<SiteIndexEntry[]> {
  if (!hasDatabase()) {
    return seedProducts
      .filter((product) => product.isActive !== false)
      .map((product) => ({ slug: product.slug, bestSeller: product.bestSeller }));
  }

  try {
    const products = await prisma.product.findMany({
      where: { isActive: true, category: { isActive: true } },
      select: { slug: true, updatedAt: true, bestSeller: true },
      orderBy: [{ bestSeller: 'desc' }, { title: 'asc' }]
    });
    return products;
  } catch (error) {
    console.warn('[site-index] product read failed; using seeded fallback content', error);
    return seedProducts
      .filter((product) => product.isActive !== false)
      .map((product) => ({ slug: product.slug, bestSeller: product.bestSeller }));
  }
}

export const listCategoryIndexEntries = unstable_cache(readCategoryIndexEntries, ['site-index-categories'], {
  revalidate: SITE_INDEX_REVALIDATE_SECONDS,
  tags: [STOREFRONT_PUBLIC_TAG, STOREFRONT_CATALOG_TAG]
});

export const listProductIndexEntries = unstable_cache(readProductIndexEntries, ['site-index-products'], {
  revalidate: SITE_INDEX_REVALIDATE_SECONDS,
  tags: [STOREFRONT_PUBLIC_TAG, STOREFRONT_CATALOG_TAG]
});
