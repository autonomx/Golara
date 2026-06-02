import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runLocalizedSeoMetadataModelTests() {
  const migration = source('prisma/migrations/20260602230000_add_localized_seo_metadata/migration.sql');
  const helper = source('lib/channels/localized-seo-metadata.ts');

  assert.match(migration, /ALTER TABLE "ProductTranslation"/);
  assert.match(migration, /ALTER TABLE "CategoryTranslation"/);
  assert.match(migration, /ALTER TABLE "HomepageSectionTranslation"/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS "seoTitle" TEXT/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS "seoDescription" TEXT/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS "canonicalPath" TEXT/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS "seoIndex" BOOLEAN NOT NULL DEFAULT true/);
  assert.match(migration, /"ProductTranslation_locale_canonicalPath_key"/);
  assert.match(migration, /"CategoryTranslation_locale_canonicalPath_key"/);
  assert.match(migration, /"HomepageSectionTranslation_locale_canonicalPath_key"/);
  assert.match(migration, /WHERE "canonicalPath" IS NOT NULL/);
  assert.match(migration, /"ProductTranslation_locale_seoIndex_idx"/);
  assert.match(migration, /"CategoryTranslation_locale_seoIndex_idx"/);
  assert.match(migration, /"HomepageSectionTranslation_locale_seoIndex_idx"/);

  assert.match(helper, /export type LocalizedSeoMetadataInput/);
  assert.match(helper, /export type LocalizedSeoMetadata/);
  assert.match(helper, /MAX_SEO_TITLE_LENGTH = 70/);
  assert.match(helper, /MAX_SEO_DESCRIPTION_LENGTH = 170/);
  assert.match(helper, /export function normalizeLocalizedSeoTitle/);
  assert.match(helper, /title\.slice\(0, MAX_SEO_TITLE_LENGTH\)/);
  assert.match(helper, /export function normalizeLocalizedSeoDescription/);
  assert.match(helper, /description\.slice\(0, MAX_SEO_DESCRIPTION_LENGTH\)/);
  assert.match(helper, /export function normalizeLocalizedCanonicalPath/);
  assert.match(helper, /path\.startsWith\('\/'\)/);
  assert.match(helper, /replace\(\/\\\/\+\/g, '\/'\)/);
  assert.match(helper, /export function normalizeLocalizedSeoIndex/);
  assert.match(helper, /return value \?\? true/);
  assert.match(helper, /export function buildLocalizedSeoMetadata/);
  assert.match(helper, /export function hasLocalizedSeoMetadata/);
  assert.match(helper, /metadata\.seoIndex === false/);

  console.log('localized-seo-metadata-model.test.ts passed');
}
