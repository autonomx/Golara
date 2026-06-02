'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertAdminRole } from '@/lib/admin-auth';
import { fulfillmentMethodSettingsService } from '@/lib/settings/fulfillment-method-settings';
import { storeSettingsService } from '@/lib/settings/store-settings';

function stringField(formData: FormData, name: string, fallback = '') {
  const value = formData.get(name);
  if (typeof value !== 'string') return fallback;
  return value.trim();
}

function requiredString(formData: FormData, name: string) {
  const value = stringField(formData, name);
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function boolField(formData: FormData, name: string) {
  return formData.getAll(name).includes('on');
}

function intField(formData: FormData, name: string, fallback = 0) {
  const value = Number.parseInt(stringField(formData, name, String(fallback)), 10);
  return Number.isFinite(value) ? value : fallback;
}

export async function updateStoreSettingAction(formData: FormData) {
  await assertAdminRole('owner');

  await storeSettingsService.update({
    storeName: requiredString(formData, 'storeName'),
    legalName: stringField(formData, 'legalName') || null,
    supportEmail: stringField(formData, 'supportEmail') || null,
    supportPhone: stringField(formData, 'supportPhone') || null,
    defaultLocale: requiredString(formData, 'defaultLocale'),
    defaultCurrency: requiredString(formData, 'defaultCurrency'),
    timezone: requiredString(formData, 'timezone'),
    storefrontBaseUrl: stringField(formData, 'storefrontBaseUrl') || null,
    isMaintenanceMode: boolField(formData, 'isMaintenanceMode')
  });

  revalidatePath('/admin');
  revalidatePath('/admin/settings');
  redirect('/admin/settings?status=store-settings-updated');
}

export async function updateFulfillmentMethodSettingAction(formData: FormData) {
  await assertAdminRole('owner');

  await fulfillmentMethodSettingsService.update({
    key: requiredString(formData, 'key'),
    label: requiredString(formData, 'label'),
    description: stringField(formData, 'description') || null,
    isActive: boolField(formData, 'isActive'),
    isDefault: boolField(formData, 'isDefault'),
    requiresAddress: boolField(formData, 'requiresAddress'),
    requiresScheduling: boolField(formData, 'requiresScheduling'),
    sortOrder: intField(formData, 'sortOrder', 0)
  });

  revalidatePath('/admin');
  revalidatePath('/admin/settings');
  redirect('/admin/settings?status=fulfillment-method-updated');
}
