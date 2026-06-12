'use server';

import { redirect } from 'next/navigation';
import { clearAdminSession, assertAdminAuthenticated } from '@/lib/admin-auth';
import { assertSameOriginServerAction } from '@/lib/server-action-origin';

export async function logoutAction() {
  // Ensure only authenticated admin from same-origin can log out
  await assertSameOriginServerAction();
  await assertAdminAuthenticated();
  await clearAdminSession();
  redirect('/admin/login');
}
