import type { MetadataRoute } from 'next';
import { listCategoryIndexEntries, listProductIndexEntries } from '@/lib/cms/site-index-repository';
import { absoluteSiteUrl } from '@/lib/site-metadata';

export const revalidate = 300;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, products] = await Promise.all([listCategoryIndexEntries(), listProductIndexEntries()]);
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
      lastModified: category.updatedAt ?? now,
      changeFrequency: 'weekly' as const,
      priority: 0.8
    })),
    ...products.map((product) => ({
      url: absoluteSiteUrl(`/products/${product.slug}`),
      lastModified: product.updatedAt ?? now,
      changeFrequency: 'weekly' as const,
      priority: product.bestSeller ? 0.9 : 0.7
    }))
  ];
}
