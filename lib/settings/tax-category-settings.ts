import 'server-only';

import { recordAdminAuditLog } from '@/lib/admin-audit-log';
import { hasDatabase, prisma } from '@/lib/prisma';

export type TaxCategorySetting = {
  id: string;
  key: string;
  label: string;
  description?: string | null;
  taxRateBasisPoints: number;
  countryCode: string;
  regionCode?: string | null;
  appliesToShipping: boolean;
  isDefault: boolean;
  isActive: boolean;
  updatedAt?: Date;
};

export type TaxCategorySettingInput = {
  key: string;
  label: string;
  description?: string | null;
  taxRateBasisPoints: number;
  countryCode: string;
  regionCode?: string | null;
  appliesToShipping: boolean;
  isDefault: boolean;
  isActive: boolean;
};

export const DEFAULT_TAX_CATEGORY_SETTING: TaxCategorySetting = {
  id: 'tax-category-standard-ca',
  key: 'standard-ca',
  label: 'Standard Canadian tax',
  description: 'Default tax category foundation for taxable products and delivery rules.',
  taxRateBasisPoints: 500,
  countryCode: 'CA',
  regionCode: null,
  appliesToShipping: false,
  isDefault: true,
  isActive: true
};

function optionalText(value?: string | null) {
  const normalized = value?.trim().replace(/\s+/g, ' ');
  return normalized || null;
}

export function normalizeTaxCategoryKey(value?: string | null) {
  const normalized = optionalText(value)?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return normalized || DEFAULT_TAX_CATEGORY_SETTING.key;
}

export function normalizeTaxRegionCode(value?: string | null) {
  return optionalText(value)?.toUpperCase() ?? null;
}

export function normalizeTaxCountryCode(value?: string | null) {
  return optionalText(value)?.toUpperCase() ?? DEFAULT_TAX_CATEGORY_SETTING.countryCode;
}

export function normalizeTaxRateBasisPoints(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(10000, Math.round(value)));
}

export function formatTaxRatePercent(basisPoints: number) {
  return `${(normalizeTaxRateBasisPoints(basisPoints) / 100).toFixed(2)}%`;
}

export function calculateTaxAmountCents(subtotalCents: number, taxRateBasisPoints: number) {
  if (!Number.isFinite(subtotalCents)) return 0;
  return Math.max(0, Math.round((Math.max(0, subtotalCents) * normalizeTaxRateBasisPoints(taxRateBasisPoints)) / 10000));
}

export function normalizeTaxCategorySettingInput(input: TaxCategorySettingInput): TaxCategorySettingInput {
  return {
    key: normalizeTaxCategoryKey(input.key),
    label: optionalText(input.label) ?? DEFAULT_TAX_CATEGORY_SETTING.label,
    description: optionalText(input.description),
    taxRateBasisPoints: normalizeTaxRateBasisPoints(input.taxRateBasisPoints),
    countryCode: normalizeTaxCountryCode(input.countryCode),
    regionCode: normalizeTaxRegionCode(input.regionCode),
    appliesToShipping: input.appliesToShipping,
    isDefault: input.isDefault,
    isActive: input.isActive
  };
}

function mapTaxCategorySetting(row: TaxCategorySetting): TaxCategorySetting {
  return {
    id: row.id,
    key: row.key,
    label: row.label,
    description: row.description ?? null,
    taxRateBasisPoints: row.taxRateBasisPoints,
    countryCode: row.countryCode,
    regionCode: row.regionCode ?? null,
    appliesToShipping: row.appliesToShipping,
    isDefault: row.isDefault,
    isActive: row.isActive,
    updatedAt: row.updatedAt
  };
}

export const taxCategorySettingsService = {
  async list(): Promise<TaxCategorySetting[]> {
    if (!hasDatabase()) return [DEFAULT_TAX_CATEGORY_SETTING];

    const rows = await prisma.$queryRaw<TaxCategorySetting[]>`
      SELECT "id", "key", "label", "description", "taxRateBasisPoints", "countryCode", "regionCode", "appliesToShipping", "isDefault", "isActive", "updatedAt"
      FROM "TaxCategorySetting"
      ORDER BY "isDefault" DESC, "countryCode" ASC, "regionCode" ASC NULLS FIRST, "label" ASC
    `;

    return rows.length ? rows.map(mapTaxCategorySetting) : [DEFAULT_TAX_CATEGORY_SETTING];
  },

  async update(input: TaxCategorySettingInput): Promise<TaxCategorySetting> {
    if (!hasDatabase()) throw new Error('DATABASE_URL is not configured.');

    const normalized = normalizeTaxCategorySettingInput(input);
    if (normalized.isDefault) {
      await prisma.$executeRaw`
        UPDATE "TaxCategorySetting"
        SET "isDefault" = false, "updatedAt" = CURRENT_TIMESTAMP
        WHERE "key" <> ${normalized.key}
      `;
    }

    const rows = await prisma.$queryRaw<TaxCategorySetting[]>`
      INSERT INTO "TaxCategorySetting" ("key", "label", "description", "taxRateBasisPoints", "countryCode", "regionCode", "appliesToShipping", "isDefault", "isActive")
      VALUES (${normalized.key}, ${normalized.label}, ${normalized.description}, ${normalized.taxRateBasisPoints}, ${normalized.countryCode}, ${normalized.regionCode}, ${normalized.appliesToShipping}, ${normalized.isDefault}, ${normalized.isActive})
      ON CONFLICT ("key") DO UPDATE SET
        "label" = EXCLUDED."label",
        "description" = EXCLUDED."description",
        "taxRateBasisPoints" = EXCLUDED."taxRateBasisPoints",
        "countryCode" = EXCLUDED."countryCode",
        "regionCode" = EXCLUDED."regionCode",
        "appliesToShipping" = EXCLUDED."appliesToShipping",
        "isDefault" = EXCLUDED."isDefault",
        "isActive" = EXCLUDED."isActive",
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING "id", "key", "label", "description", "taxRateBasisPoints", "countryCode", "regionCode", "appliesToShipping", "isDefault", "isActive", "updatedAt"
    `;
    const setting = mapTaxCategorySetting(rows[0]);

    await recordAdminAuditLog({
      action: 'settings.tax_category.update',
      entity: 'taxCategorySetting',
      entityId: setting.id,
      summary: `Updated tax category: ${setting.label}`,
      metadata: {
        key: setting.key,
        countryCode: setting.countryCode,
        regionCode: setting.regionCode,
        taxRateBasisPoints: setting.taxRateBasisPoints,
        appliesToShipping: setting.appliesToShipping,
        isDefault: setting.isDefault,
        isActive: setting.isActive
      }
    });

    return setting;
  }
};
