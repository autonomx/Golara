import { Prisma, PrismaClient } from '@prisma/client';
import { seedCategories, seedHomepageContent, seedProducts } from '../lib/seed-data';

const prisma = new PrismaClient();

function seedProductMediaProvider(url: string) {
  return url.includes('/seed-images/real-photo/') ? 'photo-real' : 'seed';
}

async function upsertSeedProduct(input: {
  slug: string;
  code: string;
  title: string;
  description: string;
  priceCents: number;
  currency: string;
  imageUrl: string;
  availableToday: boolean;
  bestSeller: boolean;
  requiresQuote: boolean;
  isActive: boolean;
  categoryId: string;
}) {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    INSERT INTO "Product" (
      "slug",
      "code",
      "title",
      "description",
      "priceCents",
      "currency",
      "imageUrl",
      "availableToday",
      "bestSeller",
      "requiresQuote",
      "isActive",
      "categoryId"
    ) VALUES (
      ${input.slug},
      ${input.code},
      ${input.title},
      ${input.description},
      ${input.priceCents},
      ${input.currency},
      ${input.imageUrl},
      ${input.availableToday},
      ${input.bestSeller},
      ${input.requiresQuote},
      ${input.isActive},
      ${input.categoryId}
    )
    ON CONFLICT ("slug") DO UPDATE SET
      "code" = EXCLUDED."code",
      "title" = EXCLUDED."title",
      "description" = EXCLUDED."description",
      "priceCents" = EXCLUDED."priceCents",
      "currency" = EXCLUDED."currency",
      "imageUrl" = EXCLUDED."imageUrl",
      "availableToday" = EXCLUDED."availableToday",
      "bestSeller" = EXCLUDED."bestSeller",
      "requiresQuote" = EXCLUDED."requiresQuote",
      "isActive" = EXCLUDED."isActive",
      "categoryId" = EXCLUDED."categoryId"
    RETURNING "id"
  `;

  const savedProduct = rows[0];
  if (!savedProduct) throw new Error(`Unable to save seed product ${input.slug}`);
  return savedProduct;
}

async function upsertSeedProductMedia(input: {
  url: string;
  alt: string;
  storageProvider: string;
  productId: string;
  metadata: Prisma.InputJsonObject;
}) {
  await prisma.$executeRaw`
    INSERT INTO "Media" (
      "url",
      "alt",
      "sourceType",
      "storageProvider",
      "metadata",
      "productId"
    ) VALUES (
      ${input.url},
      ${input.alt},
      'seed',
      ${input.storageProvider},
      ${input.metadata},
      ${input.productId}
    )
    ON CONFLICT ("url") DO UPDATE SET
      "alt" = EXCLUDED."alt",
      "sourceType" = EXCLUDED."sourceType",
      "storageProvider" = EXCLUDED."storageProvider",
      "metadata" = EXCLUDED."metadata",
      "productId" = EXCLUDED."productId"
  `;
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

    const savedProduct = await upsertSeedProduct({
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
    });

    await upsertSeedProductMedia({
      url: product.image,
      alt: product.title,
      storageProvider: seedProductMediaProvider(product.image),
      metadata: { mediaCategory: 'product', seedProductSlug: product.slug, productCode: product.code },
      productId: savedProduct.id
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
