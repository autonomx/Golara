import assert from 'node:assert/strict';
import { withIsolatedPrisma } from '../utils/isolated-test-db';

export async function runRepositoryIntegrationTests() {
  await withIsolatedPrisma(async (client, testKey) => {
    const categoryId = `${testKey}_category`;
    const productId = `${testKey}_product`;
    const variantId = `${testKey}_variant`;

    await client.$executeRaw`
      INSERT INTO "Category" ("id", "slug", "title", "eyebrow", "description", "imageUrl", "isActive", "sortOrder", "createdAt", "updatedAt")
      VALUES (${categoryId}, ${testKey}, ${testKey}, ${testKey}, ${testKey}, null, true, 9999, NOW(), NOW())
    `;
    await client.$executeRaw`
      INSERT INTO "Product" ("id", "slug", "title", "description", "price", "imageUrl", "categoryId", "bestSeller", "isActive", "sortOrder", "createdAt", "updatedAt")
      VALUES (${productId}, ${testKey}, ${testKey}, ${testKey}, 123, null, ${categoryId}, false, true, 9999, NOW(), NOW())
    `;
    await client.$executeRaw`
      INSERT INTO "ProductVariant" ("id", "productId", "sku", "name", "priceCents", "currency", "stockQuantity", "isActive", "sortOrder", "createdAt", "updatedAt")
      VALUES (${variantId}, ${productId}, ${testKey}, ${testKey}, 12345, 'CAD', 5, true, 9999, NOW(), NOW())
    `;

    const rows = await client.$queryRaw<Array<{ sku: string; title: string }>>`
      SELECT v."sku", p."title"
      FROM "ProductVariant" v
      INNER JOIN "Product" p ON p."id" = v."productId"
      WHERE v."sku" = ${testKey}
    `;

    assert.equal(rows.length, 1);
    assert.equal(rows[0]?.sku, testKey);
    assert.equal(rows[0]?.title, testKey);
  });
  console.log('repository-integration.test.ts passed');
}
