'use server';

import { redirect } from 'next/navigation';
import { createAdminSession } from '@/lib/admin-auth';
import { assertSameOriginServerAction } from '@/lib/server-action-origin';

export async function loginAction(formData: FormData) {
  await assertSameOriginServerAction();

  const password = formData.get('password');
  const result = await createAdminSession(typeof password === 'string' ? password : '');

  if (!result.ok) {
    redirect(`/admin/login?error=${encodeURIComponent(result.error ?? 'Unable to sign in')}`);
  }

  redirect('/admin');
}
