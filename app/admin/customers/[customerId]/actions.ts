'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertAdminRole } from '@/lib/admin-auth';
import { addAdminCustomerTimelineNote, updateAdminCustomerProfile } from '@/lib/customers/customer-repository';

function stringField(formData: FormData, name: string, fallback = '') {
  const value = formData.get(name);
  if (typeof value !== 'string') return fallback;
  return value.trim();
}

function customerPath(customerId: string, status: string) {
  return `/admin/customers/${customerId}?status=${encodeURIComponent(status)}`;
}

export async function updateAdminCustomerProfileAction(customerId: string, formData: FormData) {
  await assertAdminRole('staff');

  await updateAdminCustomerProfile(customerId, {
    displayName: stringField(formData, 'displayName'),
    email: stringField(formData, 'email'),
    locale: stringField(formData, 'locale', 'fa-IR')
  });

  revalidatePath('/admin/customers');
  revalidatePath(`/admin/customers/${customerId}`);
  redirect(customerPath(customerId, 'customer-profile-updated'));
}

export async function addAdminCustomerTimelineNoteAction(customerId: string, formData: FormData) {
  const actor = await assertAdminRole('staff');
  await addAdminCustomerTimelineNote(customerId, stringField(formData, 'note'), actor);

  revalidatePath('/admin/customers');
  revalidatePath(`/admin/customers/${customerId}`);
  redirect(customerPath(customerId, 'customer-note-added'));
}
