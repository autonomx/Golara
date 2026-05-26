'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCustomerSession } from '@/lib/customers/customer-account-repository';
import { getCustomerSessionCookie } from '@/lib/customers/customer-session-cookie';
import { updateCustomerProfile } from '@/lib/customers/customer-repository';
import { hasDatabase } from '@/lib/prisma';

function stringField(formData: FormData, name: string, fallback = '') {
  const value = formData.get(name);
  if (typeof value !== 'string') return fallback;
  return value.trim();
}

function profilePath(status: string) {
  return `/account/profile?status=${encodeURIComponent(status)}`;
}

async function requireCustomerId() {
  if (!hasDatabase()) redirect(profilePath('database-required'));
  const token = await getCustomerSessionCookie();
  const session = await getCustomerSession(token);
  if (!session) redirect('/account?status=session-required');
  return session.customerId;
}

export async function updateAccountProfileAction(formData: FormData) {
  const customerId = await requireCustomerId();
  try {
    await updateCustomerProfile(customerId, {
      displayName: stringField(formData, 'displayName'),
      email: stringField(formData, 'email'),
      locale: stringField(formData, 'locale', 'fa-IR')
    });
    revalidatePath('/account');
    revalidatePath('/account/profile');
    revalidatePath('/cart/checkout');
    redirect(profilePath('updated'));
  } catch (error) {
    console.warn('[account] failed to update profile', error);
    redirect(profilePath('failed'));
  }
}
