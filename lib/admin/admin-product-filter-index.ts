import 'server-only';

import { hasDatabase, prisma } from '@/lib/prisma';
import { seedProducts } from '@/lib/seed-data';

export type AdminProductFilterIndexItem = {
  title: string;
  code: string;
  slug: string;
  description?: string;
  category: string;
  availableToday: boolean;
  bestSeller?: boolean;
  requiresQuote?: boolean;
  price: number;
  isActive?: boolean;
  image?: string;
};

function seedProductFilterIndex(): AdminProductFilterIndexItem[] {
  return seedProducts.map((product) => ({
    title: product.title,
    code: product.code,
    slug: product.slug,
    description: product.description,
    category: product.category,
    availableToday: product.availableToday,
    bestSeller: product.bestSeller,
    requiresQuote: product.requiresQuote,
    price: product.price,
    isActive: product.isActive,
    image: product.image
  }));
}

export async function listAdminProductFilterIndex(): Promise<AdminProductFilterIndexItem[]> {
  if (!hasDatabase()) return seedProductFilterIndex();

  const products = await prisma.product.findMany({
    select: {
      title: true,
      code: true,
      slug: true,
      description: true,
      priceCents: true,
      availableToday: true,
      bestSeller: true,
      requiresQuote: true,
      isActive: true,
      imageUrl: true,
      category: { select: { slug: true } }
    },
    orderBy: [{ title: 'asc' }]
  });

  return products.map((product) => ({
    title: product.title,
    code: product.code,
    slug: product.slug,
    description: product.description,
    category: product.category?.slug ?? '',
    availableToday: product.availableToday,
    bestSeller: product.bestSeller,
    requiresQuote: product.requiresQuote,
    price: product.priceCents / 100,
    isActive: product.isActive,
    image: product.imageUrl
  }));
}
