import { PrismaClient } from '@prisma/client';
import { seedCategories } from '../lib/seed-data';
import { resolveCategoryImagePath } from '../lib/seed-category-images';

const prisma = new PrismaClient();

type CategoryMediaSeed = {
  url: string;
  alt: string;
  slugs: string[];
  titles: string[];
};

function categoryMediaProvider(url: string) {
  if (url.includes('/seed-images/category-real/')) return 'category-real';
  if (url.includes('/seed-images/photo-real/')) return 'photo-real';
  if (url.includes('/homepage/categories/')) return 'homepage-category';
  return 'seed';
}

function collectCategoryMediaSeeds() {
  const mediaByUrl = new Map<string, CategoryMediaSeed>();

  for (const category of seedCategories) {
    const url = resolveCategoryImagePath(category);
    const existing = mediaByUrl.get(url);

    if (existing) {
      existing.slugs.push(category.slug);
      existing.titles.push(category.title);
      continue;
    }

    mediaByUrl.set(url, {
      url,
      alt: `${category.title} category image`,
      slugs: [category.slug],
      titles: [category.title]
    });
  }

  return [...mediaByUrl.values()];
}

async function main() {
  for (const media of collectCategoryMediaSeeds()) {
    await prisma.media.upsert({
      where: { url: media.url },
      create: {
        url: media.url,
        alt: media.alt,
        sourceType: 'seed',
        storageProvider: categoryMediaProvider(media.url),
        metadata: {
          mediaCategory: 'category',
          seedCategorySlugs: media.slugs,
          seedCategoryTitles: media.titles
        }
      },
      update: {
        alt: media.alt,
        sourceType: 'seed',
        storageProvider: categoryMediaProvider(media.url),
        metadata: {
          mediaCategory: 'category',
          seedCategorySlugs: media.slugs,
          seedCategoryTitles: media.titles
        },
        productId: null
      },
      select: { id: true }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
