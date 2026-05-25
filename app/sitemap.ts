import type { MetadataRoute } from 'next';
import { listCategories, listProducts } from '@/lib/cms/catalog-repository';
import { absoluteSiteUrl } from '@/lib/site-metadata';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([listCategories(), listProducts()]);
  const now = new Date();

  return [
    {
      url: absoluteSiteUrl('/'),
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1
    },
    ...categories.map((category) => ({
      url: absoluteSiteUrl(`/categories/${category.slug}`),
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: 0.8
    })),
    ...products.map((product) => ({
      url: absoluteSiteUrl(`/products/${product.slug}`),
      lastModified: now,
      changeFrequency: 'weekly' as const,
      priority: product.bestSeller ? 0.9 : 0.7
    }))
  ];
}
