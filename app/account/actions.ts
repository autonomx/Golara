'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { clearCustomerSessionCookie, getCustomerSessionCookie } from '@/lib/customers/customer-session-cookie';
import { getCustomerSession, revokeCustomerSession } from '@/lib/customers/customer-account-repository';
import { updateCustomerProfile } from '@/lib/customers/customer-repository';
import { hasDatabase } from '@/lib/prisma';

function stringField(formData: FormData, name: string, fallback = '') {
  const value = formData.get(name);
  if (typeof value !== 'string') return fallback;
  return value.trim();
}

export async function updateCustomerProfileAction(formData: FormData) {
  if (!hasDatabase()) redirect('/account?status=database-required');
  const token = await getCustomerSessionCookie();
  const session = await getCustomerSession(token);
  if (!session) redirect('/account?status=session-required');

  try {
    await updateCustomerProfile(session.customerId, {
      displayName: stringField(formData, 'displayName'),
      email: stringField(formData, 'email'),
      locale: stringField(formData, 'locale', 'fa-IR')
    });
    revalidatePath('/account');
    revalidatePath('/cart/checkout');
    redirect('/account?status=profile-updated');
  } catch (error) {
    console.warn('[account] failed to update customer profile', error);
    redirect('/account?status=profile-failed');
  }
}

export async function logoutCustomerAction() {
  const token = await getCustomerSessionCookie();
  if (token) await revokeCustomerSession(token);
  await clearCustomerSessionCookie();
  redirect('/account?status=signed-out');
}
