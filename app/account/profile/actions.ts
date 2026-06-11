'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCustomerSession } from '@/lib/customers/customer-account-repository';
import { getCustomerSessionCookie } from '@/lib/customers/customer-session-cookie';
import { safeCustomerProfileReturnTo } from '@/lib/customers/customer-profile-completion';
import { updateCustomerProfile } from '@/lib/customers/customer-repository';
import { hasDatabase } from '@/lib/prisma';
import { assertSameOriginServerAction } from '@/lib/server-action-origin';

function stringField(formData: FormData, name: string, fallback = '') {
  const value = formData.get(name);
  if (typeof value !== 'string') return fallback;
  return value.trim();
}

function profilePath(status: string, returnTo?: string) {
  const params = new URLSearchParams({ status });
  const safeReturnTo = returnTo ? safeCustomerProfileReturnTo(returnTo) : undefined;
  if (safeReturnTo) params.set('returnTo', safeReturnTo);
  return `/account/profile?${params.toString()}`;
}

async function requireCustomerId() {
  if (!hasDatabase()) redirect(profilePath('database-required'));
  const token = await getCustomerSessionCookie();
  const session = await getCustomerSession(token);
  if (!session) redirect('/account?status=session-required');
  return session.customerId;
}

export async function updateAccountProfileAction(formData: FormData) {
  await assertSameOriginServerAction();
  const customerId = await requireCustomerId();
  const returnTo = safeCustomerProfileReturnTo(stringField(formData, 'returnTo', ''), '');
  const displayName = stringField(formData, 'displayName');
  let redirectTarget = '';
  try {
    if (returnTo && !displayName) {
      redirectTarget = profilePath('missing-name', returnTo);
    } else {
      await updateCustomerProfile(customerId, {
        displayName,
        email: stringField(formData, 'email'),
        locale: stringField(formData, 'locale', 'fa-IR')
      });
      revalidatePath('/account');
      revalidatePath('/account/profile');
      revalidatePath('/cart/checkout');
      redirectTarget = returnTo || profilePath('updated');
    }
  } catch (error) {
    console.warn('[account] failed to update profile', error);
    redirectTarget = profilePath('failed', returnTo);
  }
  redirect(redirectTarget);
}
