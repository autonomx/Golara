import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  DEFAULT_STOREFRONT_CHANNEL_CURRENCY,
  DEFAULT_STOREFRONT_CHANNEL_LOCALE,
  buildFallbackStorefrontChannelDefaults,
  buildStorefrontChannelDefaults,
  createStorefrontChannel,
  getDefaultStorefrontChannelDefaults,
  isStorefrontChannelActive,
  isStorefrontChannelDefault,
  listStorefrontChannels,
  normalizeStorefrontChannelCurrency,
  normalizeStorefrontChannelInput,
  normalizeStorefrontChannelLocale,
  normalizeStorefrontChannelSlug,
  resolveStorefrontChannelDefaults,
  selectDefaultStorefrontChannel,
  type StorefrontChannelRecord
} from '../../lib/channels/channel-repository';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

function channelRecord(overrides: Partial<StorefrontChannelRecord> = {}): StorefrontChannelRecord {
  const now = new Date('2026-06-06T12:00:00.000Z');
  return {
    id: 'channel_123',
    slug: 'default',
    name: 'Default Storefront',
    currency: DEFAULT_STOREFRONT_CHANNEL_CURRENCY,
    locale: DEFAULT_STOREFRONT_CHANNEL_LOCALE,
    isActive: true,
    isDefault: false,
    metadata: {},
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

export async function runChannelStorefrontModelTests() {
  const migration = source('prisma/migrations/20260602200000_add_channel_storefront_model/migration.sql');
  const repository = source('lib/channels/channel-repository.ts');
  const schema = source('prisma/schema.prisma');

  assert.equal(DEFAULT_STOREFRONT_CHANNEL_CURRENCY, 'TOMAN');
  assert.equal(DEFAULT_STOREFRONT_CHANNEL_LOCALE, 'fa-IR');

  assert.equal(normalizeStorefrontChannelSlug(' Main Storefront! '), 'main-storefront');
  assert.equal(normalizeStorefrontChannelSlug('گل فروشی تهران'), 'گل-فروشی-تهران');
  assert.throws(() => normalizeStorefrontChannelSlug(' !!! '), /Storefront channel slug is required/);

  assert.equal(normalizeStorefrontChannelCurrency(undefined), 'TOMAN');
  assert.equal(normalizeStorefrontChannelCurrency(' usd '), 'USD');
  assert.equal(normalizeStorefrontChannelCurrency('toman'), 'TOMAN');
  assert.throws(() => normalizeStorefrontChannelCurrency('12'), /Unsupported storefront channel currency/);
  assert.throws(() => normalizeStorefrontChannelCurrency('TOO-LONG'), /Unsupported storefront channel currency/);

  assert.equal(normalizeStorefrontChannelLocale(undefined), 'fa-IR');
  assert.equal(normalizeStorefrontChannelLocale(' en_US '), 'en-US');
  assert.equal(normalizeStorefrontChannelLocale('fa'), 'fa');
  assert.throws(() => normalizeStorefrontChannelLocale('english_US'), /Unsupported storefront channel locale/);

  assert.deepEqual(normalizeStorefrontChannelInput({
    name: ' Main Store ',
    currency: ' usd ',
    locale: ' en_US ',
    isActive: false,
    isDefault: true,
    metadata: { source: 'unit' }
  }), {
    slug: 'main-store',
    name: 'Main Store',
    currency: 'USD',
    locale: 'en-US',
    isActive: false,
    isDefault: true,
    metadata: { source: 'unit' }
  });
  assert.deepEqual(normalizeStorefrontChannelInput({ name: 'Default' }), {
    slug: 'default',
    name: 'Default',
    currency: 'TOMAN',
    locale: 'fa-IR',
    isActive: true,
    isDefault: false,
    metadata: {}
  });
  assert.throws(() => normalizeStorefrontChannelInput({ name: ' ' }), /Storefront channel name is required/);

  assert.equal(isStorefrontChannelActive(channelRecord({ isActive: true })), true);
  assert.equal(isStorefrontChannelActive(channelRecord({ isActive: false })), false);
  assert.equal(isStorefrontChannelDefault(channelRecord({ isDefault: true })), true);
  assert.equal(isStorefrontChannelDefault(channelRecord({ isDefault: false })), false);

  const inactiveDefault = channelRecord({ id: 'inactive-default', slug: 'inactive-default', isDefault: true, isActive: false });
  const activeNonDefault = channelRecord({ id: 'active', slug: 'active', isDefault: false, isActive: true });
  const activeDefault = channelRecord({ id: 'active-default', slug: 'active-default', isDefault: true, isActive: true, currency: 'USD', locale: 'en-US' });
  assert.equal(selectDefaultStorefrontChannel([inactiveDefault, activeNonDefault]), activeNonDefault);
  assert.equal(selectDefaultStorefrontChannel([inactiveDefault, activeNonDefault, activeDefault]), activeDefault);
  assert.equal(selectDefaultStorefrontChannel([inactiveDefault]), null);

  assert.deepEqual(buildFallbackStorefrontChannelDefaults(), {
    currency: 'TOMAN',
    locale: 'fa-IR',
    source: 'fallback',
    channelId: null,
    channelSlug: null
  });
  assert.deepEqual(buildStorefrontChannelDefaults(null), buildFallbackStorefrontChannelDefaults());
  assert.deepEqual(buildStorefrontChannelDefaults(activeDefault), {
    currency: 'USD',
    locale: 'en-US',
    source: 'channel',
    channelId: 'active-default',
    channelSlug: 'active-default'
  });
  assert.deepEqual(resolveStorefrontChannelDefaults([inactiveDefault, activeNonDefault, activeDefault]), {
    currency: 'USD',
    locale: 'en-US',
    source: 'channel',
    channelId: 'active-default',
    channelSlug: 'active-default'
  });
  assert.deepEqual(resolveStorefrontChannelDefaults([]), buildFallbackStorefrontChannelDefaults());

  assert.deepEqual(await listStorefrontChannels(), []);
  assert.deepEqual(await getDefaultStorefrontChannelDefaults(), buildFallbackStorefrontChannelDefaults());
  await assert.rejects(() => createStorefrontChannel({ name: 'Default' }), /DATABASE_URL is not configured/);

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
