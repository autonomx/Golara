import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runChannelStorefrontModelTests() {
  const migration = source('prisma/migrations/20260602200000_add_channel_storefront_model/migration.sql');
  const repository = source('lib/channels/channel-repository.ts');
  const schema = source('prisma/schema.prisma');

  assert.match(migration, /CREATE TABLE IF NOT EXISTS "StorefrontChannel"/);
  assert.match(migration, /"slug" TEXT NOT NULL/);
  assert.match(migration, /"name" TEXT NOT NULL/);
  assert.match(migration, /"currency" TEXT NOT NULL DEFAULT 'TOMAN'/);
  assert.match(migration, /"locale" TEXT NOT NULL DEFAULT 'fa-IR'/);
  assert.match(migration, /"isActive" BOOLEAN NOT NULL DEFAULT true/);
  assert.match(migration, /"isDefault" BOOLEAN NOT NULL DEFAULT false/);
  assert.match(migration, /"metadata" JSONB NOT NULL DEFAULT '\{\}'::jsonb/);
  assert.match(migration, /"StorefrontChannel_slug_key"/);
  assert.match(migration, /"StorefrontChannel_default_unique_idx"/);
  assert.match(migration, /WHERE "isDefault" = true/);
  assert.match(migration, /"StorefrontChannel_active_default_idx"/);
  assert.match(migration, /"StorefrontChannel_currency_locale_idx"/);

  assert.match(schema, /model StorefrontChannel/);
  assert.match(schema, /slug\s+String\s+@unique/);
  assert.match(schema, /currency\s+String\s+@default\("TOMAN"\)/);
  assert.match(schema, /locale\s+String\s+@default\("fa-IR"\)/);
  assert.match(schema, /isActive\s+Boolean\s+@default\(true\)/);
  assert.match(schema, /isDefault\s+Boolean\s+@default\(false\)/);
  assert.match(schema, /@@index\(\[isActive, isDefault\]\)/);
  assert.match(schema, /@@index\(\[currency, locale\]\)/);

  assert.match(repository, /export const DEFAULT_STOREFRONT_CHANNEL_CURRENCY = 'TOMAN'/);
  assert.match(repository, /export const DEFAULT_STOREFRONT_CHANNEL_LOCALE = 'fa-IR'/);
  assert.match(repository, /export type StorefrontChannelInput/);
  assert.match(repository, /export type StorefrontChannelRecord/);
  assert.match(repository, /export type StorefrontChannelDefaults/);
  assert.match(repository, /source: 'channel' \| 'fallback'/);
  assert.match(repository, /export function normalizeStorefrontChannelSlug/);
  assert.match(repository, /export function normalizeStorefrontChannelCurrency/);
  assert.match(repository, /currency\.toUpperCase\(\)/);
  assert.match(repository, /export function normalizeStorefrontChannelLocale/);
  assert.match(repository, /locale\.replace\('_', '-'\)/);
  assert.match(repository, /export function normalizeStorefrontChannelInput/);
  assert.match(repository, /export function isStorefrontChannelActive/);
  assert.match(repository, /export function isStorefrontChannelDefault/);
  assert.match(repository, /export function selectDefaultStorefrontChannel/);
  assert.match(repository, /channel\.isDefault && channel\.isActive/);
  assert.match(repository, /export function buildFallbackStorefrontChannelDefaults/);
  assert.match(repository, /currency: DEFAULT_STOREFRONT_CHANNEL_CURRENCY/);
  assert.match(repository, /locale: DEFAULT_STOREFRONT_CHANNEL_LOCALE/);
  assert.match(repository, /source: 'fallback'/);
  assert.match(repository, /export function buildStorefrontChannelDefaults/);
  assert.match(repository, /source: 'channel'/);
  assert.match(repository, /channelId: channel\.id/);
  assert.match(repository, /channelSlug: channel\.slug/);
  assert.match(repository, /export function resolveStorefrontChannelDefaults/);
  assert.match(repository, /buildStorefrontChannelDefaults\(selectDefaultStorefrontChannel\(channels\)\)/);
  assert.match(repository, /export async function getDefaultStorefrontChannelDefaults/);
  assert.match(repository, /const channels = await listStorefrontChannels\(\)/);
  assert.match(repository, /export async function listStorefrontChannels/);
  assert.match(repository, /FROM "StorefrontChannel"/);
  assert.match(repository, /export async function createStorefrontChannel/);
  assert.match(repository, /INSERT INTO "StorefrontChannel"/);
  assert.match(repository, /RETURNING\s+"id"/);

  console.log('channel-storefront-model.test.ts passed');
}
