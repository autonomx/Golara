import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runChannelPriceOverrideModelTests() {
  const migration = source('prisma/migrations/20260602220000_add_channel_price_overrides/migration.sql');
  const repository = source('lib/channels/channel-price-override-repository.ts');

  assert.match(migration, /CREATE TABLE IF NOT EXISTS "ProductChannelPriceOverride"/);
  assert.match(migration, /"channelId" TEXT NOT NULL/);
  assert.match(migration, /"productId" TEXT/);
  assert.match(migration, /"variantId" TEXT/);
  assert.match(migration, /"priceCents" INTEGER NOT NULL/);
  assert.match(migration, /"currency" TEXT NOT NULL DEFAULT 'TOMAN'/);
  assert.match(migration, /"isActive" BOOLEAN NOT NULL DEFAULT true/);
  assert.match(migration, /"metadata" JSONB NOT NULL DEFAULT '\{\}'::jsonb/);
  assert.match(migration, /"ProductChannelPriceOverride_channel_fkey"/);
  assert.match(migration, /REFERENCES "StorefrontChannel"\("id"\) ON DELETE CASCADE/);
  assert.match(migration, /"ProductChannelPriceOverride_product_fkey"/);
  assert.match(migration, /REFERENCES "Product"\("id"\) ON DELETE CASCADE/);
  assert.match(migration, /"ProductChannelPriceOverride_variant_fkey"/);
  assert.match(migration, /REFERENCES "ProductVariant"\("id"\) ON DELETE CASCADE/);
  assert.match(migration, /"ProductChannelPriceOverride_target_chk"/);
  assert.match(migration, /"ProductChannelPriceOverride_price_nonnegative_chk"/);
  assert.match(migration, /"ProductChannelPriceOverride_window_order_chk"/);
  assert.match(migration, /"ProductChannelPriceOverride_channel_product_key"/);
  assert.match(migration, /WHERE "productId" IS NOT NULL/);
  assert.match(migration, /"ProductChannelPriceOverride_channel_variant_key"/);
  assert.match(migration, /WHERE "variantId" IS NOT NULL/);
  assert.match(migration, /"ProductChannelPriceOverride_channel_active_idx"/);
  assert.match(migration, /"ProductChannelPriceOverride_currency_idx"/);
  assert.match(migration, /"ProductChannelPriceOverride_window_idx"/);

  assert.match(repository, /export type ProductChannelPriceOverrideInput/);
  assert.match(repository, /export type ProductChannelPriceOverrideRecord/);
  assert.match(repository, /export function assertProductChannelPriceOverrideId/);
  assert.match(repository, /export function normalizeProductChannelPriceCents/);
  assert.match(repository, /nonnegative integer/);
  assert.match(repository, /export function normalizeProductChannelPriceOverrideCurrency/);
  assert.match(repository, /normalizeStorefrontChannelCurrency/);
  assert.match(repository, /export function assertProductChannelPriceOverrideWindow/);
  assert.match(repository, /startsAt must be before endsAt/);
  assert.match(repository, /export function assertProductChannelPriceOverrideTarget/);
  assert.match(repository, /exactly one productId or variantId/);
  assert.match(repository, /export function isProductChannelPriceOverrideWithinWindow/);
  assert.match(repository, /export function isProductChannelPriceOverrideActive/);
  assert.match(repository, /override\.isActive/);
  assert.match(repository, /export function applyProductChannelPriceOverride/);
  assert.match(repository, /return normalizeProductChannelPriceCents\(override\.priceCents\)/);
  assert.match(repository, /export function normalizeProductChannelPriceOverrideInput/);
  assert.match(repository, /export async function listProductChannelPriceOverridesForChannel/);
  assert.match(repository, /FROM "ProductChannelPriceOverride"/);
  assert.match(repository, /export async function findProductChannelPriceOverride/);
  assert.match(repository, /AND "productId" = \$\{target\.productId\}/);
  assert.match(repository, /AND "variantId" = \$\{target\.variantId\}/);
  assert.match(repository, /export async function createProductChannelPriceOverride/);
  assert.match(repository, /INSERT INTO "ProductChannelPriceOverride"/);
  assert.match(repository, /RETURNING\s+"id"/);

  console.log('channel-price-override-model.test.ts passed');
}
