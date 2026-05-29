import 'server-only';

import { cookies, headers } from 'next/headers';
import { STOREFRONT_LOCALE_COOKIE } from '@/app/locale/actions';
import { DEFAULT_LOCALE, normalizeLocale, type SupportedLocale } from '@/lib/i18n/locales';

function localeFromAcceptLanguage(value: string | null) {
  if (!value) return undefined;
  const candidates = value.split(',').map((entry) => entry.split(';')[0]?.trim()).filter(Boolean);
  return candidates.find((candidate) => candidate.toLowerCase().startsWith('fa') || candidate.toLowerCase().startsWith('en'));
}

export async function resolveStorefrontLocale(): Promise<SupportedLocale> {
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(STOREFRONT_LOCALE_COOKIE)?.value;
  if (cookieLocale) return normalizeLocale(cookieLocale);

  const headerStore = await headers();
  const acceptedLocale = localeFromAcceptLanguage(headerStore.get('accept-language'));
  if (acceptedLocale) return normalizeLocale(acceptedLocale);

  return DEFAULT_LOCALE;
}
