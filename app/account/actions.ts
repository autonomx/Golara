'use server';

import { redirect } from 'next/navigation';
import { clearCustomerSessionCookie, getCustomerSessionCookie } from '@/lib/customers/customer-session-cookie';
import { revokeCustomerSession } from '@/lib/customers/customer-account-repository';

export async function logoutCustomerAction() {
  const token = await getCustomerSessionCookie();
  if (token) await revokeCustomerSession(token);
  await clearCustomerSessionCookie();
  redirect('/account?status=signed-out');
}
