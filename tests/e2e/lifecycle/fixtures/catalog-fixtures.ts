import type { PrismaClient } from '@prisma/client';

export async function createLifecycleChannel(prisma: PrismaClient) {
  return prisma.storefrontChannel.create({
    data: {
      slug: 'e2e-default',
      name: 'E2E Default Channel',
      currency: 'TOMAN',
      locale: 'fa-IR',
      isActive: true,
      isDefault: true,
      metadata: { lifecycle: true }
    }
  });
}

export async function createLifecycleCategory(prisma: PrismaClient) {
  return prisma.category.create({
    data: {
      slug: 'e2e-roses',
      title: 'E2E Roses',
      eyebrow: 'Lifecycle catalog',
      description: 'Deterministic category for local lifecycle database tests.',
      imageUrl: '/seed-images/photo-real/standard-bouquet.jpg',
      showOnHomepage: false,
      sortOrder: 1,
      isActive: true
    }
  });
}

export async function createLifecycleProductType(prisma: PrismaClient) {
  return prisma.productType.create({
    data: {
      slug: 'e2e-bouquet',
      name: 'E2E Bouquet',
      description: 'Deterministic product type for local lifecycle database tests.',
      isActive: true,
      sortOrder: 1
    }
  });
}

export async function createLifecycleProductWithVariantAndStock(
  prisma: PrismaClient,
  deps: {
    categoryId: string;
    productTypeId: string;
  }
) {
  const product = await prisma.product.create({
    data: {
      slug: 'e2e-red-rose-bouquet',
      code: 'E2E-ROSE-001',
      title: 'E2E Red Rose Bouquet',
      description: 'Deterministic product for local lifecycle database tests.',
      priceCents: 125000,
      currency: 'TOMAN',
      imageUrl: '/seed-images/photo-real/standard-bouquet.jpg',
      availableToday: true,
      bestSeller: false,
      requiresQuote: false,
      isActive: true,
      sortOrder: 1,
      categoryId: deps.categoryId,
      productTypeId: deps.productTypeId
    }
  });

  const variant = await prisma.productVariant.create({
    data: {
      productId: product.id,
      sku: 'E2E-ROSE-001-STANDARD',
      name: 'Standard',
      priceCents: product.priceCents,
      currency: product.currency,
      imageUrl: product.imageUrl,
      stockQuantity: 12,
      trackInventory: true,
      lowStockThreshold: 3,
      isActive: true,
      sortOrder: 1
    }
  });

  const warehouseLocation = await prisma.warehouseLocation.create({
    data: {
      slug: 'e2e-vancouver-studio',
      name: 'E2E Vancouver Studio',
      description: 'Deterministic warehouse location for local lifecycle database tests.',
      city: 'Vancouver',
      region: 'BC',
      countryCode: 'CA',
      isActive: true,
      sortOrder: 1
    }
  });

  const variantStock = await prisma.productVariantLocationStock.create({
    data: {
      variantId: variant.id,
      locationId: warehouseLocation.id,
      quantity: 12,
      reservedQuantity: 0,
      lowStockThreshold: 3
    }
  });

  return { product, variant, warehouseLocation, variantStock };
}
