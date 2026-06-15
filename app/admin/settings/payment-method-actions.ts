'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertAdminRole } from '@/lib/admin-auth';
import { paymentMethodSettingsService } from '@/lib/settings/payment-method-settings';

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

export async function updatePaymentMethodSettingAction(formData: FormData) {
  await assertAdminRole('owner');

  await paymentMethodSettingsService.update({
    key: requiredString(formData, 'key'),
    label: requiredString(formData, 'label'),
    description: stringField(formData, 'description') || null,
    methodType: requiredString(formData, 'methodType'),
    providerKey: requiredString(formData, 'providerKey'),
    settlementMode: requiredString(formData, 'settlementMode'),
    captureMode: requiredString(formData, 'captureMode'),
    currency: requiredString(formData, 'currency'),
    isActive: boolField(formData, 'isActive'),
    isDefault: boolField(formData, 'isDefault'),
    requiresManualReview: boolField(formData, 'requiresManualReview'),
    sortOrder: intField(formData, 'sortOrder', 0)
  });

  revalidatePath('/admin');
  revalidatePath('/admin/settings');
  redirect('/admin/settings?status=payment-method-updated');
}
