import assert from 'node:assert/strict';
import { PrismaClient } from '@prisma/client';

export const TEST_DATA_PREFIX = 'golara_test_';

export function getIsolatedTestDatabaseUrl() {
  const testUrl = process.env.TEST_DATABASE_URL?.trim();
  if (!testUrl) return null;
  const appUrl = process.env.DATABASE_URL?.trim();
  assert.notEqual(testUrl, appUrl, 'TEST_DATABASE_URL must not match DATABASE_URL. Refusing to write to the app/demo database.');
  assert.match(testUrl, /test|shadow|ci/i, 'TEST_DATABASE_URL must visibly identify a test/shadow/ci database.');
  return testUrl;
}

export function createIsolatedPrismaClient() {
  const url = getIsolatedTestDatabaseUrl();
  if (!url) return null;
  return new PrismaClient({ datasources: { db: { url } } });
}

export function uniqueTestKey(label: string) {
  return `${TEST_DATA_PREFIX}${label}_${Date.now()}_${Math.random().toString(36).slice(2)}`.replace(/[^a-zA-Z0-9_-]/g, '_');
}

export async function withIsolatedPrisma<T>(fn: (client: PrismaClient, testKey: string) => Promise<T>) {
  const client = createIsolatedPrismaClient();
  if (!client) {
    console.log('Skipping isolated DB test: TEST_DATABASE_URL is not configured.');
    return null;
  }

  const testKey = uniqueTestKey('db');
  try {
    return await fn(client, testKey);
  } finally {
    await cleanupKnownTestRows(client, testKey).catch((error) => {
      console.warn(`Isolated DB cleanup warning for ${testKey}:`, error instanceof Error ? error.message : String(error));
    });
    await client.$disconnect();
  }
}

export async function cleanupKnownTestRows(client: PrismaClient, testKey: string) {
  const likeKey = `${TEST_DATA_PREFIX}%`;
  await client.$executeRawUnsafe('DELETE FROM "ImportExportJob" WHERE "id" LIKE $1 OR "target" LIKE $1', likeKey).catch(() => undefined);
  await client.$executeRawUnsafe('DELETE FROM "ApiTokenCredential" WHERE "key" LIKE $1 OR "label" LIKE $1', likeKey).catch(() => undefined);
  await client.$executeRawUnsafe('DELETE FROM "IntegrationAppRegistry" WHERE "key" LIKE $1 OR "label" LIKE $1', likeKey).catch(() => undefined);
  await client.$executeRawUnsafe('DELETE FROM "WebhookEventLog" WHERE "id" LIKE $1', likeKey).catch(() => undefined);
  await client.$executeRawUnsafe('DELETE FROM "WebhookConfiguration" WHERE "key" LIKE $1 OR "label" LIKE $1', likeKey).catch(() => undefined);
  await client.$executeRawUnsafe('DELETE FROM "StorefrontNavigationMenuItem" WHERE "label" LIKE $1', likeKey).catch(() => undefined);
  await client.$executeRawUnsafe('DELETE FROM "StorefrontNavigationMenu" WHERE "key" LIKE $1 OR "label" LIKE $1', likeKey).catch(() => undefined);
  await client.$executeRawUnsafe('DELETE FROM "StoreSetting" WHERE "key" LIKE $1 OR "storeName" LIKE $1', likeKey).catch(() => undefined);
  await client.$executeRawUnsafe('DELETE FROM "ProductVariant" WHERE "sku" LIKE $1 OR "name" LIKE $1', likeKey).catch(() => undefined);
  await client.$executeRawUnsafe('DELETE FROM "Product" WHERE "slug" LIKE $1 OR "title" LIKE $1', likeKey).catch(() => undefined);
  await client.$executeRawUnsafe('DELETE FROM "Category" WHERE "slug" LIKE $1 OR "title" LIKE $1', likeKey).catch(() => undefined);
  void testKey;
}
