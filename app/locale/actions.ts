'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { normalizeLocale } from '@/lib/i18n/locales';

export const STOREFRONT_LOCALE_COOKIE = 'golara_locale';

function safeReturnPath(value: string | null) {
  const normalized = value?.trim();
  if (!normalized || !normalized.startsWith('/') || normalized.startsWith('//')) return '/';
  return normalized;
}

export async function setStorefrontLocaleAction(formData: FormData) {
  const localeValue = formData.get('locale');
  const returnToValue = formData.get('returnTo');
  const locale = normalizeLocale(typeof localeValue === 'string' ? localeValue : undefined);
  const returnTo = safeReturnPath(typeof returnToValue === 'string' ? returnToValue : null);
  const cookieStore = await cookies();

  cookieStore.set(STOREFRONT_LOCALE_COOKIE, locale, {
    path: '/',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365
  });

  redirect(returnTo);
}
