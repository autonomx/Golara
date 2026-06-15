import 'server-only';

import type { Prisma } from '@prisma/client';
import type { Category, Product, ProductVariant } from '@/lib/catalog';
import { prisma } from '@/lib/prisma';
import { readWithSeedFallback } from '@/lib/cms/repository-fallback-policy';
import { localizeSeedProducts } from '@/lib/localization/catalog-seed-fallback';
import { seedCategories, seedProducts } from '@/lib/seed-data';
import { localizedField, selectTranslatedContent, type TranslationLike } from '@/lib/i18n/translated-content';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=80';
const DEFAULT_PRODUCT_TAKE = 48;
const MAX_PRODUCT_TAKE = 96;
const DEFAULT_BEST_SELLER_TAKE = 12;

export type PublicCatalogReadOptions = { locale?: string | null };
export type PublicProductQueryOptions = PublicCatalogReadOptions & { search?: string; categorySlugs?: string[]; take?: number };

export type CategoryProductCount = { categoryId: string; count: number };
export type PublicSlug = { slug: string };

const publicProductCardSelect = {
  id: true,
  slug: true,
  code: true,
  title: true,
  description: true,
  seoTitle: true,
  seoDescription: true,
  canonicalPath: true,
  seoIndex: true,
  priceCents: true,
  currency: true,
  availableToday: true,
  bestSeller: true,
  requiresQuote: true,
  isActive: true,
  categoryId: true,
  imageUrl: true,
  productTypeId: true,
  category: {
    select: {
      slug: true,
      title: true,
      translations: {
        select: {
          locale: true,
          title: true,
          eyebrow: true,
          description: true,
          imageAlt: true,
          isPublished: true,
          updatedAt: true
        }
      }
    }
  },
  images: { select: { url: true, alt: true }, take: 1, orderBy: { createdAt: 'asc' as const } },
  variants: {
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' as const }, { name: 'asc' as const }],
    take: 1,
    select: {
      id: true,
      productId: true,
      sku: true,
      name: true,
      priceCents: true,
      currency: true,
      imageUrl: true,
      stockQuantity: true,
      trackInventory: true,
      lowStockThreshold: true,
      isActive: true,
      sortOrder: true,
      updatedAt: true
    }
  },
  translations: {
    select: {
      locale: true,
      title: true,
      description: true,
      imageAlt: true,
      isPublished: true,
      updatedAt: true
    }
  }
} satisfies Prisma.ProductSelect;

type DbProductTranslation = TranslationLike & {
  title: string;
  description: string | null;
  imageAlt: string | null;
  updatedAt?: Date;
};

type DbCategoryTranslation = TranslationLike & {
  title: string;
  eyebrow: string | null;
  description: string | null;
  imageAlt: string | null;
  updatedAt?: Date;
};

type PublicProductCardRow = {
  id: string;
  slug: string;
  code: string;
  title: string;
  description: string;
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalPath: string | null;
  seoIndex: boolean;
  priceCents: number;
  currency: string;
  availableToday: boolean;
  bestSeller: boolean;
  requiresQuote: boolean;
  isActive: boolean;
  categoryId: string;
  imageUrl: string;
  productTypeId: string | null;
  category: {
    slug: string;
    title: string;
    translations?: DbCategoryTranslation[];
  };
  images?: { url: string; alt: string }[];
  variants?: Array<{
    id: string;
    productId: string;
    sku: string;
    name: string;
    priceCents: number;
    currency: string;
    imageUrl: string | null;
    stockQuantity: number;
    trackInventory?: boolean | null;
    lowStockThreshold?: number | null;
    isActive: boolean;
    sortOrder: number;
    updatedAt?: Date;
  }>;
  translations?: DbProductTranslation[];
};

function readWithFallback<T>(readFromDb: () => Promise<T>, fallback: () => T): Promise<T> {
  return readWithSeedFallback(readFromDb, fallback, 'public catalog read');
}

function normalizeTake(take: number | undefined, fallback = DEFAULT_PRODUCT_TAKE) {
  if (!take || !Number.isFinite(take)) return fallback;
  return Math.max(1, Math.min(MAX_PRODUCT_TAKE, Math.floor(take)));
}

function normalizeSearch(search?: string) {
  const normalized = search?.trim().replace(/\s+/g, ' ');
  return normalized || undefined;
}

function normalizedCategorySlugs(categorySlugs?: string[]) {
  const slugs = Array.from(new Set((categorySlugs ?? []).map((slug) => slug.trim()).filter(Boolean)));
  return slugs.length ? slugs : undefined;
}

function publicProductWhere(options: PublicProductQueryOptions & { bestSeller?: boolean } = {}): Prisma.ProductWhereInput {
  const slugs = normalizedCategorySlugs(options.categorySlugs);
  const search = normalizeSearch(options.search);
  const where: Prisma.ProductWhereInput = {
    isActive: true,
    category: slugs ? { isActive: true, slug: { in: slugs } } : { isActive: true }
  };

  if (options.bestSeller) where.bestSeller = true;

  if (search) {
    where.AND = [
      {
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { slug: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { category: { title: { contains: search, mode: 'insensitive' } } },
          { translations: { some: { isPublished: true, OR: [{ title: { contains: search, mode: 'insensitive' } }, { description: { contains: search, mode: 'insensitive' } }] } } }
        ]
      }
    ];
  }

  return where;
}

function mapPublicProductVariant(variant: NonNullable<PublicProductCardRow['variants']>[number]): ProductVariant {
  return {
    id: variant.id,
    productId: variant.productId,
    sku: variant.sku,
    name: variant.name,
    price: variant.priceCents / 100,
    currency: variant.currency,
    image: variant.imageUrl ?? undefined,
    stockQuantity: variant.stockQuantity,
    trackInventory: variant.trackInventory ?? undefined,
    lowStockThreshold: variant.lowStockThreshold ?? undefined,
    isActive: variant.isActive,
    sortOrder: variant.sortOrder,
    updatedAt: variant.updatedAt
  };
}

function mapPublicProduct(product: PublicProductCardRow, options: PublicCatalogReadOptions = {}): Product {
  const productSelection = selectTranslatedContent({ translations: product.translations, base: product, requestedLocale: options.locale });
  const categorySelection = selectTranslatedContent({ translations: product.category.translations, base: product.category, requestedLocale: options.locale });
  const image = product.imageUrl || product.images?.[0]?.url || FALLBACK_IMAGE;

  return {
    id: product.id,
    slug: product.slug,
    code: product.code,
    title: localizedField({ selection: productSelection, field: 'title' }),
    category: product.category.slug,
    categoryId: product.categoryId,
    categoryTitle: localizedField({ selection: categorySelection, field: 'title' }),
    productTypeId: product.productTypeId ?? undefined,
    price: product.priceCents / 100,
    currency: product.currency,
    availableToday: product.availableToday,
    bestSeller: product.bestSeller,
    requiresQuote: product.requiresQuote || product.priceCents <= 0,
    isActive: product.isActive,
    image,
    description: localizedField({ selection: productSelection, field: 'description' }),
    seoTitle: product.seoTitle ?? undefined,
    seoDescription: product.seoDescription ?? undefined,
    canonicalPath: product.canonicalPath ?? undefined,
    seoIndex: product.seoIndex,
    variants: product.variants?.map(mapPublicProductVariant)
  };
}

function seedProductsForQuery(options: PublicProductQueryOptions & { bestSeller?: boolean } = {}) {
  const search = normalizeSearch(options.search)?.toLowerCase();
  const slugs = normalizedCategorySlugs(options.categorySlugs);
  const slugSet = slugs ? new Set(slugs) : undefined;
  const take = normalizeTake(options.take, options.bestSeller ? DEFAULT_BEST_SELLER_TAKE : DEFAULT_PRODUCT_TAKE);

  return localizeSeedProducts(
    seedProducts
      .filter((product) => product.isActive !== false)
      .filter((product) => (options.bestSeller ? product.bestSeller : true))
      .filter((product) => (slugSet ? slugSet.has(product.category) : true))
      .filter((product) => {
        if (!search) return true;
        return [product.title, product.slug, product.code, product.description, product.category]
          .filter(Boolean)
          .some((value) => value?.toLowerCase().includes(search));
      })
      .sort((a, b) => Number(Boolean(b.bestSeller)) - Number(Boolean(a.bestSeller)) || a.title.localeCompare(b.title))
      .slice(0, take),
    options.locale,
    seedCategories
  );
}

export async function listPublicProducts(options: PublicProductQueryOptions = {}): Promise<Product[]> {
  const take = normalizeTake(options.take);
  return readWithFallback(async () => {
    const products = await prisma.product.findMany({
      where: publicProductWhere(options),
      select: publicProductCardSelect,
      orderBy: [{ bestSeller: 'desc' }, { title: 'asc' }],
      take
    });
    return products.map((product) => mapPublicProduct(product, options));
  }, () => seedProductsForQuery({ ...options, take }));
}

export async function listBestSellerProducts(options: PublicCatalogReadOptions & { take?: number } = {}): Promise<Product[]> {
  const take = normalizeTake(options.take, DEFAULT_BEST_SELLER_TAKE);
  return readWithFallback(async () => {
    const products = await prisma.product.findMany({
      where: publicProductWhere({ bestSeller: true }),
      select: publicProductCardSelect,
      orderBy: [{ title: 'asc' }],
      take
    });
    return products.map((product) => mapPublicProduct(product, options));
  }, () => seedProductsForQuery({ ...options, bestSeller: true, take }));
}

export async function listProductsForCategorySlugs(categorySlugs: string[], options: PublicCatalogReadOptions & { take?: number } = {}): Promise<Product[]> {
  return listPublicProducts({ ...options, categorySlugs });
}

export async function listPublicProductCountsByCategoryId(): Promise<CategoryProductCount[]> {
  return readWithFallback(async () => {
    const counts = await prisma.product.groupBy({
      by: ['categoryId'],
      where: { isActive: true, category: { isActive: true } },
      _count: { _all: true }
    });
    return counts.map((count) => ({ categoryId: count.categoryId, count: count._count._all }));
  }, () => {
    const counts = new Map<string, number>();
    const categoryIdBySlug = new Map(seedCategories.map((category) => [category.slug, category.id]).filter((entry): entry is [string, string] => Boolean(entry[1])));
    for (const product of seedProducts) {
      if (product.isActive === false) continue;
      const categoryId = categoryIdBySlug.get(product.category);
      if (!categoryId) continue;
      counts.set(categoryId, (counts.get(categoryId) ?? 0) + 1);
    }
    return Array.from(counts, ([categoryId, count]) => ({ categoryId, count }));
  });
}

export async function listPublicProductSlugs(): Promise<PublicSlug[]> {
  return readWithFallback(async () => {
    return prisma.product.findMany({
      where: { isActive: true, category: { isActive: true } },
      select: { slug: true },
      orderBy: [{ slug: 'asc' }]
    });
  }, () => seedProducts.filter((product) => product.isActive !== false).map((product) => ({ slug: product.slug })).sort((a, b) => a.slug.localeCompare(b.slug)));
}

export async function listPublicCategorySlugs(): Promise<PublicSlug[]> {
  return readWithFallback(async () => {
    return prisma.category.findMany({
      where: { isActive: true },
      select: { slug: true },
      orderBy: [{ slug: 'asc' }]
    });
  }, () => seedCategories.filter((category) => category.isActive !== false).map((category) => ({ slug: category.slug })).sort((a, b) => a.slug.localeCompare(b.slug)));
}

export function withCategoryCountsFromDirectCounts(categories: Category[], directCounts: CategoryProductCount[]) {
  const countByCategoryId = new Map(directCounts.map((item) => [item.categoryId, item.count]));
  const childrenByParentSlug = new Map<string, Category[]>();

  for (const category of categories) {
    if (!category.parentSlug) continue;
    const children = childrenByParentSlug.get(category.parentSlug) ?? [];
    children.push(category);
    childrenByParentSlug.set(category.parentSlug, children);
  }

  function countTree(category: Category, seen = new Set<string>()): number {
    if (seen.has(category.slug)) return 0;
    seen.add(category.slug);
    const ownCount = category.id ? countByCategoryId.get(category.id) ?? 0 : 0;
    const childCount = (childrenByParentSlug.get(category.slug) ?? []).reduce((sum, child) => sum + countTree(child, seen), 0);
    return ownCount + childCount;
  }

  return categories.map((category) => ({ ...category, productCount: countTree(category) }));
}
