'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { STOREFRONT_LOCALE_COOKIE } from '@/lib/i18n/locale-cookie';
import { normalizeLocale } from '@/lib/i18n/locales';
import { assertSameOriginServerAction } from '@/lib/server-action-origin';
import { safeReturnPath } from '@/lib/security/safe-return-path';

export async function setStorefrontLocaleAction(formData: FormData) {
  // Enforce same-origin policy before modifying cookies to prevent CSRF attacks
  await assertSameOriginServerAction();
  const localeValue = formData.get('locale');
  const returnToValue = formData.get('returnTo');
  const locale = normalizeLocale(typeof localeValue === 'string' ? localeValue : undefined);
  const returnTo = safeReturnPath(typeof returnToValue === 'string' ? returnToValue : null, '/');
  const cookieStore = await cookies();

  cookieStore.set(STOREFRONT_LOCALE_COOKIE, locale, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365
  });

  redirect(returnTo);
}
