import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runChannelProductAvailabilityModelTests() {
  const migration = source('prisma/migrations/20260602210000_add_channel_product_availability/migration.sql');
  const repository = source('lib/channels/channel-product-availability-repository.ts');

  assert.match(migration, /CREATE TABLE IF NOT EXISTS "ProductChannelAvailability"/);
  assert.match(migration, /"channelId" TEXT NOT NULL/);
  assert.match(migration, /"productId" TEXT NOT NULL/);
  assert.match(migration, /"isAvailable" BOOLEAN NOT NULL DEFAULT true/);
  assert.match(migration, /"isPublished" BOOLEAN NOT NULL DEFAULT true/);
  assert.match(migration, /"startsAt" TIMESTAMP\(3\)/);
  assert.match(migration, /"endsAt" TIMESTAMP\(3\)/);
  assert.match(migration, /"metadata" JSONB NOT NULL DEFAULT '\{\}'::jsonb/);
  assert.match(migration, /"ProductChannelAvailability_channel_fkey"/);
  assert.match(migration, /REFERENCES "StorefrontChannel"\("id"\) ON DELETE CASCADE/);
  assert.match(migration, /"ProductChannelAvailability_product_fkey"/);
  assert.match(migration, /REFERENCES "Product"\("id"\) ON DELETE CASCADE/);
  assert.match(migration, /"ProductChannelAvailability_window_order_chk"/);
  assert.match(migration, /"ProductChannelAvailability_channel_product_key"/);
  assert.match(migration, /"ProductChannelAvailability_channel_available_idx"/);
  assert.match(migration, /"ProductChannelAvailability_product_available_idx"/);
  assert.match(migration, /"ProductChannelAvailability_window_idx"/);

  assert.match(repository, /export type ProductChannelAvailabilityInput/);
  assert.match(repository, /export type ProductChannelAvailabilityRecord/);
  assert.match(repository, /export type ProductChannelAvailabilityWindow/);
  assert.match(repository, /export type ProductChannelAvailabilityState/);
  assert.match(repository, /export function assertProductChannelAvailabilityId/);
  assert.match(repository, /export function normalizeProductChannelAvailabilityWindowDate/);
  assert.match(repository, /export function assertProductChannelAvailabilityWindow/);
  assert.match(repository, /Product channel availability startsAt must be before endsAt/);
  assert.match(repository, /export function isProductChannelAvailabilityWithinWindow/);
  assert.match(repository, /export function isProductAvailableInChannel/);
  assert.match(repository, /availability\.isAvailable/);
  assert.match(repository, /availability\.isPublished/);
  assert.match(repository, /export function normalizeProductChannelAvailabilityInput/);
  assert.match(repository, /export async function listProductChannelAvailabilityForChannel/);
  assert.match(repository, /FROM "ProductChannelAvailability"/);
  assert.match(repository, /WHERE "channelId" = \$\{normalizedChannelId\}/);
  assert.match(repository, /export async function findProductChannelAvailability/);
  assert.match(repository, /AND "productId" = \$\{normalizedProductId\}/);
  assert.match(repository, /export async function createProductChannelAvailability/);
  assert.match(repository, /INSERT INTO "ProductChannelAvailability"/);
  assert.match(repository, /RETURNING\s+"id"/);

  console.log('channel-product-availability-model.test.ts passed');
}
