import 'server-only';

import { recordAdminAuditLog } from '@/lib/admin-audit-log';
import { hasDatabase, prisma } from '@/lib/prisma';

export type ShippingDeliverySetting = {
  id: string;
  key: string;
  label: string;
  description?: string | null;
  deliveryFeeCents: number;
  freeDeliveryMinimumCents?: number | null;
  minimumOrderCents?: number | null;
  deliveryRadiusKm?: number | null;
  deliveryPostalCodes: string[];
  pickupAddress?: string | null;
  deliveryInstructions?: string | null;
  sameDayCutoffMinutes?: number | null;
  timezone: string;
  isActive: boolean;
  updatedAt?: Date;
};

export type ShippingDeliverySettingInput = {
  key: string;
  label: string;
  description?: string | null;
  deliveryFeeCents: number;
  freeDeliveryMinimumCents?: number | null;
  minimumOrderCents?: number | null;
  deliveryRadiusKm?: number | null;
  deliveryPostalCodes?: string[] | string | null;
  pickupAddress?: string | null;
  deliveryInstructions?: string | null;
  sameDayCutoffMinutes?: number | null;
  timezone: string;
  isActive: boolean;
};

export const DEFAULT_SHIPPING_DELIVERY_SETTING: ShippingDeliverySetting = {
  id: 'shipping-delivery-primary',
  key: 'primary',
  label: 'Local delivery settings',
  description: 'Default local shipping and delivery rules for checkout and staff workflows.',
  deliveryFeeCents: 1500,
  freeDeliveryMinimumCents: null,
  minimumOrderCents: null,
  deliveryRadiusKm: 25,
  deliveryPostalCodes: [],
  pickupAddress: null,
  deliveryInstructions: 'Delivery windows are confirmed by staff after checkout.',
  sameDayCutoffMinutes: 780,
  timezone: 'America/Vancouver',
  isActive: true
};

function optionalText(value?: string | null) {
  const normalized = value?.trim().replace(/\s+/g, ' ');
  return normalized || null;
}

function moneyCents(value: number | null | undefined, fallback = 0) {
  if (!Number.isFinite(value ?? Number.NaN)) return fallback;
  return Math.max(0, Math.round(value ?? fallback));
}

function optionalPositiveInt(value: number | null | undefined) {
  if (!Number.isFinite(value ?? Number.NaN)) return null;
  const rounded = Math.round(value ?? 0);
  return rounded > 0 ? rounded : null;
}

function isMissingShippingDeliveryTableError(error: unknown) {
  if (!error || typeof error !== 'object') return false;
  const meta = 'meta' in error ? (error as { meta?: { code?: string; message?: string } }).meta : undefined;
  const message = 'message' in error ? String((error as { message?: unknown }).message ?? '') : '';
  return meta?.code === '42P01' || meta?.message?.includes('ShippingDeliverySetting') || message.includes('ShippingDeliverySetting');
}

export function parseDeliveryPostalCodes(value?: string[] | string | null) {
  const raw = Array.isArray(value) ? value : String(value ?? '').split(/[\n,]/);
  return Array.from(
    new Set(
      raw
        .map((item) => item.trim().toUpperCase().replace(/\s+/g, ' '))
        .filter(Boolean)
    )
  ).sort();
}

export function formatSameDayCutoff(minutes?: number | null) {
  if (!Number.isFinite(minutes ?? Number.NaN)) return 'Not configured';
  const safeMinutes = Math.max(0, Math.min(1439, Math.round(minutes ?? 0)));
  const hour = Math.floor(safeMinutes / 60);
  const minute = safeMinutes % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function normalizeShippingDeliverySettingInput(input: ShippingDeliverySettingInput): ShippingDeliverySettingInput {
  return {
    key: optionalText(input.key) ?? DEFAULT_SHIPPING_DELIVERY_SETTING.key,
    label: optionalText(input.label) ?? DEFAULT_SHIPPING_DELIVERY_SETTING.label,
    description: optionalText(input.description),
    deliveryFeeCents: moneyCents(input.deliveryFeeCents, DEFAULT_SHIPPING_DELIVERY_SETTING.deliveryFeeCents),
    freeDeliveryMinimumCents: optionalPositiveInt(input.freeDeliveryMinimumCents),
    minimumOrderCents: optionalPositiveInt(input.minimumOrderCents),
    deliveryRadiusKm: optionalPositiveInt(input.deliveryRadiusKm),
    deliveryPostalCodes: parseDeliveryPostalCodes(input.deliveryPostalCodes),
    pickupAddress: optionalText(input.pickupAddress),
    deliveryInstructions: optionalText(input.deliveryInstructions),
    sameDayCutoffMinutes: optionalPositiveInt(input.sameDayCutoffMinutes),
    timezone: optionalText(input.timezone) ?? DEFAULT_SHIPPING_DELIVERY_SETTING.timezone,
    isActive: input.isActive
  };
}

function mapShippingDeliverySetting(row: ShippingDeliverySetting): ShippingDeliverySetting {
  return {
    id: row.id,
    key: row.key,
    label: row.label,
    description: row.description ?? null,
    deliveryFeeCents: row.deliveryFeeCents,
    freeDeliveryMinimumCents: row.freeDeliveryMinimumCents ?? null,
    minimumOrderCents: row.minimumOrderCents ?? null,
    deliveryRadiusKm: row.deliveryRadiusKm ?? null,
    deliveryPostalCodes: row.deliveryPostalCodes ?? [],
    pickupAddress: row.pickupAddress ?? null,
    deliveryInstructions: row.deliveryInstructions ?? null,
    sameDayCutoffMinutes: row.sameDayCutoffMinutes ?? null,
    timezone: row.timezone,
    isActive: row.isActive,
    updatedAt: row.updatedAt
  };
}

export const shippingDeliverySettingsService = {
  async get(key = 'primary'): Promise<ShippingDeliverySetting> {
    if (!hasDatabase()) return DEFAULT_SHIPPING_DELIVERY_SETTING;

    try {
      const rows = await prisma.$queryRaw<ShippingDeliverySetting[]>`
        SELECT "id", "key", "label", "description", "deliveryFeeCents", "freeDeliveryMinimumCents", "minimumOrderCents", "deliveryRadiusKm", "deliveryPostalCodes", "pickupAddress", "deliveryInstructions", "sameDayCutoffMinutes", "timezone", "isActive", "updatedAt"
        FROM "ShippingDeliverySetting"
        WHERE "key" = ${key}
        LIMIT 1
      `;

      return rows[0] ? mapShippingDeliverySetting(rows[0]) : DEFAULT_SHIPPING_DELIVERY_SETTING;
    } catch (error) {
      if (isMissingShippingDeliveryTableError(error)) return DEFAULT_SHIPPING_DELIVERY_SETTING;
      throw error;
    }
  },

  async update(input: ShippingDeliverySettingInput): Promise<ShippingDeliverySetting> {
    if (!hasDatabase()) throw new Error('DATABASE_URL is not configured.');

    const normalized = normalizeShippingDeliverySettingInput(input);
    try {
      const rows = await prisma.$queryRaw<ShippingDeliverySetting[]>`
        INSERT INTO "ShippingDeliverySetting" ("key", "label", "description", "deliveryFeeCents", "freeDeliveryMinimumCents", "minimumOrderCents", "deliveryRadiusKm", "deliveryPostalCodes", "pickupAddress", "deliveryInstructions", "sameDayCutoffMinutes", "timezone", "isActive")
        VALUES (${normalized.key}, ${normalized.label}, ${normalized.description}, ${normalized.deliveryFeeCents}, ${normalized.freeDeliveryMinimumCents}, ${normalized.minimumOrderCents}, ${normalized.deliveryRadiusKm}, ${normalized.deliveryPostalCodes}, ${normalized.pickupAddress}, ${normalized.deliveryInstructions}, ${normalized.sameDayCutoffMinutes}, ${normalized.timezone}, ${normalized.isActive})
        ON CONFLICT ("key") DO UPDATE SET
          "label" = EXCLUDED."label",
          "description" = EXCLUDED."description",
          "deliveryFeeCents" = EXCLUDED."deliveryFeeCents",
          "freeDeliveryMinimumCents" = EXCLUDED."freeDeliveryMinimumCents",
          "minimumOrderCents" = EXCLUDED."minimumOrderCents",
          "deliveryRadiusKm" = EXCLUDED."deliveryRadiusKm",
          "deliveryPostalCodes" = EXCLUDED."deliveryPostalCodes",
          "pickupAddress" = EXCLUDED."pickupAddress",
          "deliveryInstructions" = EXCLUDED."deliveryInstructions",
          "sameDayCutoffMinutes" = EXCLUDED."sameDayCutoffMinutes",
          "timezone" = EXCLUDED."timezone",
          "isActive" = EXCLUDED."isActive",
          "updatedAt" = CURRENT_TIMESTAMP
        RETURNING "id", "key", "label", "description", "deliveryFeeCents", "freeDeliveryMinimumCents", "minimumOrderCents", "deliveryRadiusKm", "deliveryPostalCodes", "pickupAddress", "deliveryInstructions", "sameDayCutoffMinutes", "timezone", "isActive", "updatedAt"
      `;
      const setting = mapShippingDeliverySetting(rows[0]);

      await recordAdminAuditLog({
        action: 'settings.shipping_delivery.update',
        entity: 'shippingDeliverySetting',
        entityId: setting.id,
        summary: `Updated shipping/delivery settings: ${setting.label}`,
        metadata: {
          key: setting.key,
          deliveryFeeCents: setting.deliveryFeeCents,
          deliveryRadiusKm: setting.deliveryRadiusKm,
          sameDayCutoffMinutes: setting.sameDayCutoffMinutes,
          isActive: setting.isActive
        }
      });

      return setting;
    } catch (error) {
      if (isMissingShippingDeliveryTableError(error)) throw new Error('Shipping delivery settings table is not available in this database.');
      throw error;
    }
  }
};
