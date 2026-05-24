import 'server-only';

import type { Category, HomepageContent, MediaItem, Product } from '@/lib/catalog';
import { prisma, hasDatabase } from '@/lib/prisma';
import { seedCategories, seedHomepageContent, seedProducts } from '@/lib/seed-data';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1200&q=80';

type DbCategory = {
  id: string;
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  sortOrder: number;
  isActive: boolean;
};

type DbProduct = {
  id: string;
  slug: string;
  code: string;
  title: string;
  description: string;
  priceCents: number;
  currency: string;
  availableToday: boolean;
  bestSeller: boolean;
  isActive: boolean;
  categoryId: string;
  imageUrl: string;
  category?: DbCategory;
  images?: { url: string; alt: string }[];
};

function bySortThenTitle(a: Category, b: Category) {
  return (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.title.localeCompare(b.title);
}

function mapCategory(category: DbCategory): Category {
  return {
    id: category.id,
    slug: category.slug,
    title: category.title,
    eyebrow: category.eyebrow,
    description: category.description,
    sortOrder: category.sortOrder,
    isActive: category.isActive
  };
}

function mapProduct(product: DbProduct): Product {
  const image = product.imageUrl || product.images?.[0]?.url || FALLBACK_IMAGE;

  return {
    id: product.id,
    slug: product.slug,
    code: product.code,
    title: product.title,
    category: product.category?.slug ?? '',
    categoryId: product.categoryId,
    categoryTitle: product.category?.title,
    price: product.priceCents / 100,
    currency: product.currency,
    availableToday: product.availableToday,
    bestSeller: product.bestSeller,
    isActive: product.isActive,
    image,
    description: product.description
  };
}

function fallbackMedia(): MediaItem[] {
  const seen = new Set<string>();
  return seedProducts
    .filter((product) => {
      if (seen.has(product.image)) return false;
      seen.add(product.image);
      return true;
    })
    .map((product) => ({
      url: product.image,
      alt: product.title
    }));
}

function payloadObject(value: unknown): Partial<HomepageContent> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Partial<HomepageContent>;
}

async function readWithFallback<T>(readFromDb: () => Promise<T>, fallback: () => T): Promise<T> {
  if (!hasDatabase()) return fallback();

  try {
    return await readFromDb();
  } catch (error) {
    console.warn('[cms] database read failed; using seeded fallback content', error);
    return fallback();
  }
}

export async function listMedia(): Promise<MediaItem[]> {
  return readWithFallback(
    async () => {
      const media = await prisma.media.findMany({
        orderBy: { createdAt: 'desc' }
      });

      return media.map((item) => ({
        id: item.id,
        url: item.url,
        alt: item.alt,
        productId: item.productId ?? undefined,
        createdAt: item.createdAt
      }));
    },
    fallbackMedia
  );
}

export async function listCategories(): Promise<Category[]> {
  return readWithFallback(
    async () => {
      const categories = await prisma.category.findMany({
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }]
      });

      return categories.map(mapCategory);
    },
    () => [...seedCategories].filter((category) => category.isActive !== false).sort(bySortThenTitle)
  );
}

export async function listAdminCategories(): Promise<Category[]> {
  return readWithFallback(
    async () => {
      const categories = await prisma.category.findMany({
        orderBy: [{ sortOrder: 'asc' }, { title: 'asc' }]
      });

      return categories.map(mapCategory);
    },
    () => [...seedCategories].sort(bySortThenTitle)
  );
}

export async function getCategoryBySlug(slug: string): Promise<Category | undefined> {
  const categories = await listCategories();
  return categories.find((category) => category.slug === slug);
}

export async function listProducts(): Promise<Product[]> {
  return readWithFallback(
    async () => {
      const products = await prisma.product.findMany({
        where: { isActive: true, category: { isActive: true } },
        include: { category: true, images: true },
        orderBy: [{ bestSeller: 'desc' }, { title: 'asc' }]
      });

      return products.map(mapProduct);
    },
    () => seedProducts.filter((product) => product.isActive !== false)
  );
}

export async function listAdminProducts(): Promise<Product[]> {
  return readWithFallback(
    async () => {
      const products = await prisma.product.findMany({
        include: { category: true, images: true },
        orderBy: [{ title: 'asc' }]
      });

      return products.map(mapProduct);
    },
    () => seedProducts
  );
}

export async function getProductBySlug(slug: string): Promise<Product | undefined> {
  return readWithFallback(
    async () => {
      const product = await prisma.product.findUnique({
        where: { slug },
        include: { category: true, images: true }
      });

      if (!product || !product.isActive || !product.category?.isActive) return undefined;
      return mapProduct(product);
    },
    () => seedProducts.find((product) => product.slug === slug && product.isActive !== false)
  );
}

export async function listProductsByCategorySlug(slug: string): Promise<Product[]> {
  return readWithFallback(
    async () => {
      const products = await prisma.product.findMany({
        where: { isActive: true, category: { slug, isActive: true } },
        include: { category: true, images: true },
        orderBy: [{ bestSeller: 'desc' }, { title: 'asc' }]
      });

      return products.map(mapProduct);
    },
    () => seedProducts.filter((product) => product.category === slug && product.isActive !== false)
  );
}

export async function getHomepageContent(): Promise<HomepageContent> {
  return readWithFallback(
    async () => {
      const section = await prisma.homepageSection.findUnique({
        where: { key: 'home.hero' }
      });

      if (!section?.isActive) return seedHomepageContent;

      return {
        ...seedHomepageContent,
        eyebrow: section.subtitle ?? seedHomepageContent.eyebrow,
        title: section.title,
        body: section.body ?? seedHomepageContent.body,
        ...payloadObject(section.payload)
      };
    },
    () => seedHomepageContent
  );
}
