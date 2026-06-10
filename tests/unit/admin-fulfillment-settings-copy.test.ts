import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const PANEL_PATH = 'components/admin/AdminFulfillmentSettingsPanel.tsx';
const COPY_PATH = 'lib/localization/admin-copy.ts';

const TRANSLATED_KEYS = [
  'Settings',
  'Fulfillment methods',
  'Configure delivery, pickup, courier, and manual fulfillment options for checkout and staff workflows.',
  'Database settings are unavailable until DATABASE_URL is configured.',
  'Label',
  'Key',
  'Sort',
  'Description',
  'Active',
  'Default',
  'Address',
  'Scheduling',
  'Save method'
] as const;

const PERSIAN_VALUES = [
  'تنظیمات',
  'روش های انجام سفارش',
  'گزینه های ارسال، تحویل حضوری، پیک و انجام دستی را برای checkout و جریان کاری تیم تنظیم کنید.',
  'تنظیمات پایگاه داده تا زمانی که DATABASE_URL تنظیم نشود در دسترس نیست.',
  'برچسب',
  'کلید',
  'ترتیب',
  'توضیحات',
  'فعال',
  'پیش فرض',
  'نشانی',
  'زمان بندی',
  'ذخیره روش'
] as const;

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function runAdminFulfillmentSettingsCopyTests() {
  const panelSource = readFileSync(PANEL_PATH, 'utf8');
  const copySource = readFileSync(COPY_PATH, 'utf8');

  assert.match(panelSource, /import \{ createAdminTranslator \} from '@\/lib\/localization\/admin-copy';/);
  assert.match(panelSource, /const t = createAdminTranslator\(locale\);/);
  assert.match(panelSource, /function Toggle\(\{ label, name, defaultChecked, disabled \}: \{ label: string; name: string; defaultChecked: boolean; disabled: boolean \}\)/);

  for (const key of TRANSLATED_KEYS) {
    assert.match(panelSource, new RegExp(`t\\('${escapeRegExp(key)}'\\)`));
    assert.match(copySource, new RegExp(`'${escapeRegExp(key)}':`));
  }

  for (const value of PERSIAN_VALUES) {
    assert.match(copySource, new RegExp(escapeRegExp(value)));
  }

  assert.doesNotMatch(panelSource, />Fulfillment methods</);
  assert.doesNotMatch(panelSource, />Save method</);
  assert.doesNotMatch(panelSource, />Database settings are unavailable until DATABASE_URL is configured\.</);

  console.log('admin-fulfillment-settings-copy.test.ts passed');
}
