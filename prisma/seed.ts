import { PrismaClient } from '@prisma/client';
import { seedCategories, seedHomepageContent, seedProducts } from '../lib/seed-data';

const prisma = new PrismaClient();

function seedProductMediaProvider(url: string) {
  return url.includes('/seed-images/real-photo/') ? 'photo-real' : 'seed';
}

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
        imageUrl: category.image,
        showOnHomepage: category.showOnHomepage !== false,
        sortOrder: category.sortOrder ?? 0,
        isActive: category.isActive !== false
      },
      update: {
        title: category.title,
        eyebrow: category.eyebrow,
        description: category.description,
        imageUrl: category.image,
        showOnHomepage: category.showOnHomepage !== false,
        sortOrder: category.sortOrder ?? 0,
        isActive: category.isActive !== false
      },
      select: { id: true }
    });

    categoryBySlug.set(category.slug, savedCategory);
  }

  for (const category of seedCategories) {
    const parentId = category.parentSlug ? categoryBySlug.get(category.parentSlug)?.id : null;
    await prisma.category.update({
      where: { slug: category.slug },
      data: { parentId },
      select: { id: true }
    });
  }

  for (const product of seedProducts) {
    const category = categoryBySlug.get(product.category);
    if (!category) throw new Error(`Missing category for product ${product.slug}`);
    const requiresQuote = Boolean(product.requiresQuote || product.price <= 0);

    const savedProduct = await prisma.product.upsert({
      where: { slug: product.slug },
      create: {
        slug: product.slug,
        code: product.code,
        title: product.title,
        description: product.description,
        priceCents: Math.round(product.price),
        currency: product.currency,
        imageUrl: product.image,
        availableToday: product.availableToday,
        bestSeller: Boolean(product.bestSeller),
        requiresQuote,
        isActive: product.isActive !== false,
        categoryId: category.id
      },
      update: {
        code: product.code,
        title: product.title,
        description: product.description,
        priceCents: Math.round(product.price),
        currency: product.currency,
        imageUrl: product.image,
        availableToday: product.availableToday,
        bestSeller: Boolean(product.bestSeller),
        requiresQuote,
        isActive: product.isActive !== false,
        categoryId: category.id
      },
      select: { id: true }
    });

    await prisma.media.upsert({
      where: { url: product.image },
      create: {
        url: product.image,
        alt: product.title,
        sourceType: 'seed',
        storageProvider: seedProductMediaProvider(product.image),
        metadata: { mediaCategory: 'product', seedProductSlug: product.slug, productCode: product.code },
        productId: savedProduct.id
      },
      update: {
        alt: product.title,
        sourceType: 'seed',
        storageProvider: seedProductMediaProvider(product.image),
        metadata: { mediaCategory: 'product', seedProductSlug: product.slug, productCode: product.code },
        productId: savedProduct.id
      },
      select: { id: true }
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
    },
    select: { id: true }
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
