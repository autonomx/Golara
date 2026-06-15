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

  await paymentMethodSettingsService.updateControls({
    key: requiredString(formData, 'key'),
    isActive: boolField(formData, 'isActive'),
    isDefault: boolField(formData, 'isDefault'),
    requiresManualReview: boolField(formData, 'requiresManualReview'),
    sortOrder: intField(formData, 'sortOrder', 50)
  });

  revalidatePath('/cart/checkout');
  revalidatePath('/admin');
  revalidatePath('/admin/payment-methods');
  revalidatePath('/admin/orders');
  redirect('/admin/payment-methods?status=payment-method-updated');
}
