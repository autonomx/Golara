import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DEFAULT_HOMEPAGE_BANNER_MEDIA_SETTING,
  normalizeHomepageBannerAlt,
  normalizeHomepageBannerHref,
  normalizeHomepageBannerLocale,
  normalizeHomepageBannerMediaSettingInput
} from '../../lib/settings/homepage-banner-media-settings';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runHomepageBannerMediaSettingsTests() {
  const migration = source('prisma/migrations/20260603020000_add_homepage_banner_media_settings/migration.sql');
  const service = source('lib/settings/homepage-banner-media-settings.ts');
  const panel = source('components/admin/AdminHomepageBannerMediaSettingsPanel.tsx');
  const settingsPanel = source('components/admin/AdminStorefrontNavigationPanel.tsx');
  const actions = source('app/admin/settings/actions.ts');
  const roadmap = source('docs/ADMIN_SALEOR_PARITY_ROADMAP.md');

  assert.match(migration, /CREATE TABLE IF NOT EXISTS "HomepageBannerMediaSetting"/);
  assert.match(migration, /"key" TEXT NOT NULL/);
  assert.match(migration, /"locale" TEXT/);
  assert.match(migration, /"mediaId" TEXT/);
  assert.match(migration, /"imageUrl" TEXT/);
  assert.match(migration, /"imageAlt" TEXT/);
  assert.match(migration, /"ctaLabel" TEXT/);
  assert.match(migration, /"ctaHref" TEXT/);
  assert.match(migration, /"isActive" BOOLEAN NOT NULL DEFAULT true/);
  assert.match(migration, /HomepageBannerMediaSetting_mediaId_fkey/);
  assert.match(migration, /HomepageBannerMediaSetting_key_locale_key/);
  assert.match(migration, /'primary'/);
  assert.match(migration, /'Fresh floral moments for every occasion'/);

  assert.match(service, /export type HomepageBannerMediaSetting/);
  assert.match(service, /export type HomepageBannerMediaSettingInput/);
  assert.match(service, /DEFAULT_HOMEPAGE_BANNER_MEDIA_SETTING/);
  assert.match(service, /normalizeHomepageBannerLocale/);
  assert.match(service, /normalizeHomepageBannerHref/);
  assert.match(service, /normalizeHomepageBannerAlt/);
  assert.match(service, /normalizeHomepageBannerMediaSettingInput/);
  assert.match(service, /homepageBannerMediaSettingsService = \{/);
  assert.match(service, /async get\(key = 'primary'/);
  assert.match(service, /async update\(input: HomepageBannerMediaSettingInput\)/);
  assert.match(service, /FROM "HomepageBannerMediaSetting"/);
  assert.match(service, /INSERT INTO "HomepageBannerMediaSetting"/);
  assert.match(service, /action: 'settings\.homepage_banner_media\.update'/);

  assert.equal(DEFAULT_HOMEPAGE_BANNER_MEDIA_SETTING.key, 'primary');
  assert.equal(DEFAULT_HOMEPAGE_BANNER_MEDIA_SETTING.isActive, true);
  assert.equal(normalizeHomepageBannerLocale(' fa_IR '), 'fa-IR');
  assert.equal(normalizeHomepageBannerHref('products'), '/products');
  assert.equal(normalizeHomepageBannerHref('#hero'), '#hero');
  assert.equal(normalizeHomepageBannerHref('https://example.com'), 'https://example.com');
  assert.equal(normalizeHomepageBannerHref('   '), null);
  assert.equal(normalizeHomepageBannerAlt('a'.repeat(200))?.length, 160);

  const normalized = normalizeHomepageBannerMediaSettingInput({
    key: ' primary ',
    locale: 'en_US',
    eyebrow: ' Fresh ',
    title: ' Seasonal arrangements ',
    subtitle: '  Same day delivery  ',
    mediaId: ' media_1 ',
    imageUrl: ' https://cdn.example.com/banner.jpg ',
    imageAlt: ' Banner alt ',
    ctaLabel: ' Shop now ',
    ctaHref: 'products',
    isActive: true,
    sortOrder: Number.NaN
  });

  assert.equal(normalized.key, 'primary');
  assert.equal(normalized.locale, 'en-US');
  assert.equal(normalized.title, 'Seasonal arrangements');
  assert.equal(normalized.subtitle, 'Same day delivery');
  assert.equal(normalized.mediaId, 'media_1');
  assert.equal(normalized.ctaHref, '/products');
  assert.equal(normalized.sortOrder, DEFAULT_HOMEPAGE_BANNER_MEDIA_SETTING.sortOrder);

  assert.match(panel, /export function AdminHomepageBannerMediaSettingsPanel/);
  assert.match(panel, /updateHomepageBannerMediaSettingAction/);
  assert.match(panel, /Homepage banner\/media/);
  assert.match(panel, /name="mediaId"/);
  assert.match(panel, /name="imageUrl"/);
  assert.match(panel, /name="imageAlt"/);
  assert.match(panel, /Save homepage banner\/media/);

  assert.match(settingsPanel, /homepageBannerMediaSettingsService\.get\(\)/);
  assert.match(settingsPanel, /<AdminHomepageBannerMediaSettingsPanel setting=\{homepageBannerMediaSetting\} databaseReady=\{databaseReady\} \/>/);

  assert.match(actions, /updateHomepageBannerMediaSettingAction/);
  assert.match(actions, /homepageBannerMediaSettingsService\.update/);
  assert.match(actions, /revalidatePath\('\/'\)/);
  assert.match(actions, /homepage-banner-media-updated/);

  assert.match(roadmap, /- \[x\] Add homepage banner\/media settings\./);
  assert.match(roadmap, /- \[x\] Add variant-aware cart and checkout order line fields before inventory reservation\./);

  console.log('homepage-banner-media-settings.test.ts passed');
}
