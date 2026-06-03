import 'server-only';

import { recordAdminAuditLog } from '@/lib/admin-audit-log';
import type { StoreSetting } from '@/lib/catalog';
import { hasDatabase, prisma } from '@/lib/prisma';

export const DEFAULT_STORE_SETTING: StoreSetting = {
  id: 'store-setting-primary',
  key: 'primary',
  storeName: 'Golara',
  legalName: undefined,
  supportEmail: undefined,
  supportPhone: undefined,
  defaultLocale: 'fa-IR',
  defaultCurrency: 'TOMAN',
  timezone: 'America/Vancouver',
  storefrontBaseUrl: undefined,
  isMaintenanceMode: false
};

export type StoreSettingInput = {
  storeName: string;
  legalName?: string | null;
  supportEmail?: string | null;
  supportPhone?: string | null;
  defaultLocale: string;
  defaultCurrency: string;
  timezone: string;
  storefrontBaseUrl?: string | null;
  isMaintenanceMode: boolean;
};

function optionalText(value?: string | null) {
  const normalized = value?.trim().replace(/\s+/g, ' ');
  return normalized || null;
}

function isMissingStoreSettingTableError(error: unknown) {
  const code = typeof error === 'object' && error !== null && 'code' in error ? String((error as { code?: unknown }).code) : '';
  const message = error instanceof Error ? error.message : String(error);
  return code === 'P2010' && /StoreSetting|42P01|does not exist/i.test(message);
}

export function normalizeStoreSettingInput(input: StoreSettingInput): StoreSettingInput {
  const storeName = optionalText(input.storeName) ?? DEFAULT_STORE_SETTING.storeName;
  const defaultLocale = optionalText(input.defaultLocale)?.replace('_', '-') ?? DEFAULT_STORE_SETTING.defaultLocale;
  const defaultCurrency = optionalText(input.defaultCurrency)?.toUpperCase() ?? DEFAULT_STORE_SETTING.defaultCurrency;
  const timezone = optionalText(input.timezone) ?? DEFAULT_STORE_SETTING.timezone;

  return {
    storeName,
    legalName: optionalText(input.legalName),
    supportEmail: optionalText(input.supportEmail),
    supportPhone: optionalText(input.supportPhone),
    defaultLocale,
    defaultCurrency,
    timezone,
    storefrontBaseUrl: optionalText(input.storefrontBaseUrl),
    isMaintenanceMode: input.isMaintenanceMode
  };
}

function mapStoreSetting(row: StoreSetting): StoreSetting {
  return {
    id: row.id,
    key: row.key,
    storeName: row.storeName,
    legalName: row.legalName ?? undefined,
    supportEmail: row.supportEmail ?? undefined,
    supportPhone: row.supportPhone ?? undefined,
    defaultLocale: row.defaultLocale,
    defaultCurrency: row.defaultCurrency,
    timezone: row.timezone,
    storefrontBaseUrl: row.storefrontBaseUrl ?? undefined,
    isMaintenanceMode: row.isMaintenanceMode,
    updatedAt: row.updatedAt
  };
}

export const storeSettingsService = {
  async get(): Promise<StoreSetting> {
    if (!hasDatabase()) return DEFAULT_STORE_SETTING;

    try {
      const rows = await prisma.$queryRaw<StoreSetting[]>`
        SELECT
          "id",
          "key",
          "storeName",
          "legalName",
          "supportEmail",
          "supportPhone",
          "defaultLocale",
          "defaultCurrency",
          "timezone",
          "storefrontBaseUrl",
          "isMaintenanceMode",
          "updatedAt"
        FROM "StoreSetting"
        WHERE "key" = 'primary'
        LIMIT 1
      `;

      return rows[0] ? mapStoreSetting(rows[0]) : DEFAULT_STORE_SETTING;
    } catch (error) {
      if (isMissingStoreSettingTableError(error)) return DEFAULT_STORE_SETTING;
      throw error;
    }
  },

  async update(input: StoreSettingInput): Promise<StoreSetting> {
    if (!hasDatabase()) throw new Error('DATABASE_URL is not configured.');

    const normalized = normalizeStoreSettingInput(input);
    const rows = await prisma.$queryRaw<StoreSetting[]>`
      INSERT INTO "StoreSetting" (
        "key",
        "storeName",
        "legalName",
        "supportEmail",
        "supportPhone",
        "defaultLocale",
        "defaultCurrency",
        "timezone",
        "storefrontBaseUrl",
        "isMaintenanceMode"
      )
      VALUES (
        'primary',
        ${normalized.storeName},
        ${normalized.legalName},
        ${normalized.supportEmail},
        ${normalized.supportPhone},
        ${normalized.defaultLocale},
        ${normalized.defaultCurrency},
        ${normalized.timezone},
        ${normalized.storefrontBaseUrl},
        ${normalized.isMaintenanceMode}
      )
      ON CONFLICT ("key") DO UPDATE SET
        "storeName" = EXCLUDED."storeName",
        "legalName" = EXCLUDED."legalName",
        "supportEmail" = EXCLUDED."supportEmail",
        "supportPhone" = EXCLUDED."supportPhone",
        "defaultLocale" = EXCLUDED."defaultLocale",
        "defaultCurrency" = EXCLUDED."defaultCurrency",
        "timezone" = EXCLUDED."timezone",
        "storefrontBaseUrl" = EXCLUDED."storefrontBaseUrl",
        "isMaintenanceMode" = EXCLUDED."isMaintenanceMode",
        "updatedAt" = CURRENT_TIMESTAMP
      RETURNING
        "id",
        "key",
        "storeName",
        "legalName",
        "supportEmail",
        "supportPhone",
        "defaultLocale",
        "defaultCurrency",
        "timezone",
        "storefrontBaseUrl",
        "isMaintenanceMode",
        "updatedAt"
    `;
    const setting = mapStoreSetting(rows[0]);

    await recordAdminAuditLog({
      action: 'settings.store.update',
      entity: 'storeSetting',
      entityId: setting.id,
      summary: `Updated store settings: ${setting.storeName}`,
      metadata: {
        defaultLocale: setting.defaultLocale,
        defaultCurrency: setting.defaultCurrency,
        timezone: setting.timezone,
        isMaintenanceMode: setting.isMaintenanceMode
      }
    });

    return setting;
  }
};
