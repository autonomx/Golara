import { PrismaClient } from '@prisma/client';
import { seedCategories, seedHomepageContent, seedProducts } from '../lib/seed-data';

const prisma = new PrismaClient();

async function main() {
  const categoryBySlug = new Map<string, { id: string }>();

  for (const category of seedCategories) {
    const savedCategory = await prisma.category.upsert({
      where: { slug: category.slug },
      create: {
        slug: category.slug,
        title: category.title,
        eyebrow: category.eyebrow,
        description: category.description,
        sortOrder: category.sortOrder ?? 0,
        isActive: category.isActive !== false
      },
      update: {
        title: category.title,
        eyebrow: category.eyebrow,
        description: category.description,
        sortOrder: category.sortOrder ?? 0,
        isActive: category.isActive !== false
      }
    });

    categoryBySlug.set(category.slug, savedCategory);
  }

  for (const product of seedProducts) {
    const category = categoryBySlug.get(product.category);
    if (!category) throw new Error(`Missing category for product ${product.slug}`);

    await prisma.product.upsert({
      where: { slug: product.slug },
      create: {
        slug: product.slug,
        code: product.code,
        title: product.title,
        description: product.description,
        priceCents: Math.round(product.price * 100),
        currency: product.currency,
        imageUrl: product.image,
        availableToday: product.availableToday,
        bestSeller: Boolean(product.bestSeller),
        isActive: product.isActive !== false,
        categoryId: category.id
      },
      update: {
        code: product.code,
        title: product.title,
        description: product.description,
        priceCents: Math.round(product.price * 100),
        currency: product.currency,
        imageUrl: product.image,
        availableToday: product.availableToday,
        bestSeller: Boolean(product.bestSeller),
        isActive: product.isActive !== false,
        categoryId: category.id
      }
    });
  }

  await prisma.homepageSection.upsert({
    where: { key: 'home.hero' },
    create: {
      key: 'home.hero',
      title: seedHomepageContent.title,
      subtitle: seedHomepageContent.eyebrow,
      body: seedHomepageContent.body,
      payload: seedHomepageContent,
      isActive: true,
      sortOrder: 0
    },
    update: {
      title: seedHomepageContent.title,
      subtitle: seedHomepageContent.eyebrow,
      body: seedHomepageContent.body,
      payload: seedHomepageContent,
      isActive: true
    }
  });
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
