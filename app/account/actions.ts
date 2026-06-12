'use server';

import { redirect } from 'next/navigation';
import { clearCustomerSessionCookie, getCustomerSessionCookie } from '@/lib/customers/customer-session-cookie';
import { revokeCustomerSession } from '@/lib/customers/customer-account-repository';
import { assertSameOriginServerAction } from '@/lib/server-action-origin';

export async function logoutCustomerAction() {
  // Enforce same-origin to prevent CSRF logout attacks
  await assertSameOriginServerAction();
  const token = await getCustomerSessionCookie();
  if (token) await revokeCustomerSession(token);
  await clearCustomerSessionCookie();
  redirect('/account?status=signed-out');
}
