import 'server-only';

import { recordAdminAuditLog } from '@/lib/admin-audit-log';
import type { FulfillmentMethodSetting } from '@/lib/catalog';
import { hasDatabase, prisma } from '@/lib/prisma';

export const DEFAULT_FULFILLMENT_METHOD_SETTINGS: FulfillmentMethodSetting[] = [
  { id: 'fulfillment-method-delivery', key: 'delivery', label: 'Delivery', description: 'Local delivery handled by staff or a delivery partner.', isActive: true, isDefault: true, requiresAddress: true, requiresScheduling: true, sortOrder: 10 },
  { id: 'fulfillment-method-pickup', key: 'pickup', label: 'Pickup', description: 'Customer pickup from a configured shop or studio location.', isActive: true, isDefault: false, requiresAddress: false, requiresScheduling: true, sortOrder: 20 },
  { id: 'fulfillment-method-courier', key: 'courier', label: 'Courier', description: 'Courier or distance delivery coordinated manually.', isActive: false, isDefault: false, requiresAddress: true, requiresScheduling: true, sortOrder: 30 },
  { id: 'fulfillment-method-manual', key: 'manual', label: 'Manual', description: 'Staff-confirmed fulfillment for quote-only or custom orders.', isActive: true, isDefault: false, requiresAddress: false, requiresScheduling: false, sortOrder: 40 }
];

const allowedKeys = new Set(DEFAULT_FULFILLMENT_METHOD_SETTINGS.map((method) => method.key));

export type FulfillmentMethodSettingInput = {
  key: string;
  label: string;
  description?: string | null;
  isActive: boolean;
  isDefault: boolean;
  requiresAddress: boolean;
  requiresScheduling: boolean;
  sortOrder: number;
};

export function assertFulfillmentMethodKey(key: string) {
  if (!allowedKeys.has(key)) throw new Error(`Unknown fulfillment method: ${key}`);
  return key;
}

export const fulfillmentMethodSettingsService = {
  async update(input: FulfillmentMethodSettingInput) {
    if (!hasDatabase()) throw new Error('DATABASE_URL is not configured.');
    const key = assertFulfillmentMethodKey(input.key);
    if (input.isDefault) {
      await prisma.fulfillmentMethodSetting.updateMany({ where: { key: { not: key } }, data: { isDefault: false } });
    }

    const method = await prisma.fulfillmentMethodSetting.upsert({
      where: { key },
      create: input,
      update: {
        label: input.label,
        description: input.description,
        isActive: input.isActive,
        isDefault: input.isDefault,
        requiresAddress: input.requiresAddress,
        requiresScheduling: input.requiresScheduling,
        sortOrder: input.sortOrder
      }
    });

    await recordAdminAuditLog({
      action: 'settings.fulfillment_method.update',
      entity: 'fulfillmentMethodSetting',
      entityId: method.id,
      summary: `Updated fulfillment method: ${method.label}`,
      metadata: {
        key: method.key,
        isActive: method.isActive,
        isDefault: method.isDefault,
        requiresAddress: method.requiresAddress,
        requiresScheduling: method.requiresScheduling,
        sortOrder: method.sortOrder
      }
    });

    return method;
  }
};
