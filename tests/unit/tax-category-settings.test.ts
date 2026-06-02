import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DEFAULT_TAX_CATEGORY_SETTING,
  calculateTaxAmountCents,
  formatTaxRatePercent,
  normalizeTaxCategoryKey,
  normalizeTaxCategorySettingInput,
  normalizeTaxCountryCode,
  normalizeTaxRateBasisPoints,
  normalizeTaxRegionCode
} from '../../lib/settings/tax-category-settings';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runTaxCategorySettingsTests() {
  const migration = source('prisma/migrations/20260603040000_add_tax_category_settings/migration.sql');
  const service = source('lib/settings/tax-category-settings.ts');
  const panel = source('components/admin/AdminTaxCategorySettingsPanel.tsx');
  const fulfillmentPanel = source('components/admin/AdminFulfillmentSettingsPanel.tsx');
  const actions = source('app/admin/settings/actions.ts');
  const roadmap = source('docs/ADMIN_SALEOR_PARITY_ROADMAP.md');

  assert.match(migration, /CREATE TABLE IF NOT EXISTS "TaxCategorySetting"/);
  assert.match(migration, /"taxRateBasisPoints" INTEGER NOT NULL DEFAULT 0/);
  assert.match(migration, /"countryCode" TEXT NOT NULL DEFAULT 'CA'/);
  assert.match(migration, /"appliesToShipping" BOOLEAN NOT NULL DEFAULT false/);
  assert.match(migration, /"isDefault" BOOLEAN NOT NULL DEFAULT false/);
  assert.match(migration, /TaxCategorySetting_key_key/);
  assert.match(migration, /TaxCategorySetting_single_default_idx/);
  assert.match(migration, /'standard-ca'/);
  assert.match(migration, /'Standard Canadian tax'/);

  assert.match(service, /export type TaxCategorySetting/);
  assert.match(service, /export type TaxCategorySettingInput/);
  assert.match(service, /DEFAULT_TAX_CATEGORY_SETTING/);
  assert.match(service, /normalizeTaxCategoryKey/);
  assert.match(service, /normalizeTaxRateBasisPoints/);
  assert.match(service, /calculateTaxAmountCents/);
  assert.match(service, /taxCategorySettingsService = \{/);
  assert.match(service, /async list\(\)/);
  assert.match(service, /async update\(input: TaxCategorySettingInput\)/);
  assert.match(service, /FROM "TaxCategorySetting"/);
  assert.match(service, /INSERT INTO "TaxCategorySetting"/);
  assert.match(service, /action: 'settings\.tax_category\.update'/);

  assert.equal(DEFAULT_TAX_CATEGORY_SETTING.key, 'standard-ca');
  assert.equal(DEFAULT_TAX_CATEGORY_SETTING.taxRateBasisPoints, 500);
  assert.equal(normalizeTaxCategoryKey(' Standard CA! '), 'standard-ca');
  assert.equal(normalizeTaxCountryCode(' ca '), 'CA');
  assert.equal(normalizeTaxRegionCode(' bc '), 'BC');
  assert.equal(normalizeTaxRateBasisPoints(1234.4), 1234);
  assert.equal(normalizeTaxRateBasisPoints(20000), 10000);
  assert.equal(formatTaxRatePercent(500), '5.00%');
  assert.equal(calculateTaxAmountCents(10000, 500), 500);

  const normalized = normalizeTaxCategorySettingInput({
    key: ' Flowers BC ',
    label: ' Floral tax ',
    description: '  Taxable flowers  ',
    taxRateBasisPoints: 1200.8,
    countryCode: ' ca ',
    regionCode: ' bc ',
    appliesToShipping: true,
    isDefault: true,
    isActive: true
  });

  assert.equal(normalized.key, 'flowers-bc');
  assert.equal(normalized.label, 'Floral tax');
  assert.equal(normalized.description, 'Taxable flowers');
  assert.equal(normalized.taxRateBasisPoints, 1201);
  assert.equal(normalized.countryCode, 'CA');
  assert.equal(normalized.regionCode, 'BC');
  assert.equal(normalized.appliesToShipping, true);

  assert.match(panel, /export function AdminTaxCategorySettingsPanel/);
  assert.match(panel, /updateTaxCategorySettingAction/);
  assert.match(panel, /Tax categories/);
  assert.match(panel, /name="taxRatePercent"/);
  assert.match(panel, /name="countryCode"/);
  assert.match(panel, /Save tax category/);

  assert.match(fulfillmentPanel, /taxCategorySettingsService\.list\(\)/);
  assert.match(fulfillmentPanel, /AdminTaxCategorySettingsPanel/);

  assert.match(actions, /updateTaxCategorySettingAction/);
  assert.match(actions, /taxCategorySettingsService\.update/);
  assert.match(actions, /basisPointsField/);
  assert.match(actions, /tax-category-updated/);

  assert.match(roadmap, /- \[x\] Add tax category settings\./);

  console.log('tax-category-settings.test.ts passed');
}
