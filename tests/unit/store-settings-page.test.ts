import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runStoreSettingsPageTests() {
  const migration = source('prisma/migrations/20260603000000_add_store_settings_page/migration.sql');
  const catalog = source('lib/catalog.ts');
  const service = source('lib/settings/store-settings.ts');
  const panel = source('components/admin/AdminStoreSettingsPanel.tsx');
  const actions = source('app/admin/settings/actions.ts');
  const adminConsole = source('app/admin/AdminConsolePage.tsx');
  const roadmap = source('docs/ADMIN_SALEOR_PARITY_ROADMAP.md');

  assert.match(migration, /CREATE TABLE IF NOT EXISTS "StoreSetting"/);
  assert.match(migration, /"key" TEXT NOT NULL DEFAULT 'primary'/);
  assert.match(migration, /"storeName" TEXT NOT NULL DEFAULT 'Golara'/);
  assert.match(migration, /"supportEmail" TEXT/);
  assert.match(migration, /"supportPhone" TEXT/);
  assert.match(migration, /"defaultLocale" TEXT NOT NULL DEFAULT 'fa-IR'/);
  assert.match(migration, /"defaultCurrency" TEXT NOT NULL DEFAULT 'TOMAN'/);
  assert.match(migration, /"timezone" TEXT NOT NULL DEFAULT 'America\/Vancouver'/);
  assert.match(migration, /"storefrontBaseUrl" TEXT/);
  assert.match(migration, /"isMaintenanceMode" BOOLEAN NOT NULL DEFAULT false/);
  assert.match(migration, /"StoreSetting_key_key"/);
  assert.match(migration, /"StoreSetting_defaultLocale_defaultCurrency_idx"/);
  assert.match(migration, /ON CONFLICT \("key"\) DO NOTHING/);

  assert.match(catalog, /export type StoreSetting = \{/);
  assert.match(catalog, /storeName: string/);
  assert.match(catalog, /defaultLocale: string/);
  assert.match(catalog, /defaultCurrency: string/);
  assert.match(catalog, /timezone: string/);
  assert.match(catalog, /isMaintenanceMode: boolean/);

  assert.match(service, /export const DEFAULT_STORE_SETTING/);
  assert.match(service, /key: 'primary'/);
  assert.match(service, /storeName: 'Golara'/);
  assert.match(service, /defaultLocale: 'fa-IR'/);
  assert.match(service, /defaultCurrency: 'TOMAN'/);
  assert.match(service, /timezone: 'America\/Vancouver'/);
  assert.match(service, /export type StoreSettingInput/);
  assert.match(service, /export function normalizeStoreSettingInput/);
  assert.match(service, /defaultCurrency\)\?\.toUpperCase\(\)/);
  assert.match(service, /storeSettingsService = \{/);
  assert.match(service, /async get\(\): Promise<StoreSetting>/);
  assert.match(service, /FROM "StoreSetting"/);
  assert.match(service, /WHERE "key" = 'primary'/);
  assert.match(service, /async update\(input: StoreSettingInput\): Promise<StoreSetting>/);
  assert.match(service, /INSERT INTO "StoreSetting"/);
  assert.match(service, /ON CONFLICT \("key"\) DO UPDATE SET/);
  assert.match(service, /action: 'settings\.store\.update'/);
  assert.match(service, /entity: 'storeSetting'/);

  assert.match(panel, /export function AdminStoreSettingsPanel/);
  assert.match(panel, /updateStoreSettingAction/);
  assert.match(panel, /Store settings/);
  assert.match(panel, /name="storeName"/);
  assert.match(panel, /name="defaultLocale"/);
  assert.match(panel, /name="defaultCurrency"/);
  assert.match(panel, /name="timezone"/);
  assert.match(panel, /name="isMaintenanceMode"/);
  assert.match(panel, /Save store settings/);

  assert.match(actions, /import \{ storeSettingsService \} from '@\/lib\/settings\/store-settings'/);
  assert.match(actions, /export async function updateStoreSettingAction/);
  assert.match(actions, /await assertAdminRole\('owner'\)/);
  assert.match(actions, /storeSettingsService\.update/);
  assert.match(actions, /redirect\('\/admin\/settings\?status=store-settings-updated'\)/);

  assert.match(adminConsole, /AdminStoreSettingsPanel/);
  assert.match(adminConsole, /storeSettingsService/);
  assert.match(adminConsole, /storeSetting\] = await Promise\.all/);
  assert.match(adminConsole, /storeSettingsService\.get\(\)/);
  assert.match(adminConsole, /<AdminStoreSettingsPanel setting=\{storeSetting\} databaseReady=\{runtimeReadiness\.databaseUrlPresent\} \/>/);

  assert.match(roadmap, /- \[x\] Add store settings page\./);

  console.log('store-settings-page.test.ts passed');
}
