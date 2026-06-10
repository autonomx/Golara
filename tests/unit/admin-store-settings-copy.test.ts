import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const PANEL_PATH = 'components/admin/AdminStoreSettingsPanel.tsx';

const EN_KEYS = [
  'eyebrow',
  'title',
  'body',
  'databaseUnavailable',
  'storeName',
  'legalName',
  'supportEmail',
  'supportPhone',
  'defaultLocale',
  'defaultCurrency',
  'timezone',
  'storefrontBaseUrl',
  'maintenanceMode',
  'save'
] as const;

const FA_VALUES = [
  'تنظیمات',
  'تنظیمات فروشگاه',
  'نام فروشگاه',
  'نام حقوقی',
  'ایمیل پشتیبانی',
  'تلفن پشتیبانی',
  'زبان پیش‌فرض',
  'ارز پیش‌فرض',
  'منطقه زمانی',
  'نشانی پایه فروشگاه',
  'حالت تعمیر و نگهداری',
  'ذخیره تنظیمات فروشگاه'
] as const;

export async function runAdminStoreSettingsCopyTests() {
  const source = readFileSync(PANEL_PATH, 'utf8');

  assert.match(source, /const copy = \{/);
  assert.match(source, /en: \{/);
  assert.match(source, /fa: \{/);
  assert.match(source, /function localeKey\(locale\?: SupportedLocale \| string \| null\): AdminLocale/);
  assert.match(source, /locale\?\.toLowerCase\(\)\.startsWith\('fa'\) \? 'fa' : 'en'/);
  assert.match(source, /const labels = copy\[localeKey\(locale\)\]/);

  for (const key of EN_KEYS) {
    assert.match(source, new RegExp(`${key}:`));
    assert.match(source, new RegExp(`labels\\.${key}`));
  }

  for (const value of FA_VALUES) {
    assert.match(source, new RegExp(value));
  }

  assert.doesNotMatch(source, />Store settings</);
  assert.doesNotMatch(source, />Save store settings</);
  assert.doesNotMatch(source, />Maintenance mode</);
  assert.doesNotMatch(source, />Store name</);

  console.log('admin-store-settings-copy.test.ts passed');
}
