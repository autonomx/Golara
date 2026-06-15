export const DEFAULT_LOCALE = 'fa-IR';
export const FALLBACK_LOCALE = 'en-CA';
export const SUPPORTED_LOCALES = [DEFAULT_LOCALE, FALLBACK_LOCALE] as const;

export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

const LOCALE_ALIASES: Record<string, SupportedLocale> = {
  fa: 'fa-IR',
  'fa-ir': 'fa-IR',
  persian: 'fa-IR',
  farsi: 'fa-IR',
  en: 'en-CA',
  'en-ca': 'en-CA',
  english: 'en-CA'
};

export function isSupportedLocale(value: string): value is SupportedLocale {
  return SUPPORTED_LOCALES.includes(value as SupportedLocale);
}

export function normalizeLocale(value: string | undefined | null): SupportedLocale {
  const normalized = value?.trim().toLowerCase();
  if (!normalized) return DEFAULT_LOCALE;
  return LOCALE_ALIASES[normalized] ?? DEFAULT_LOCALE;
}

export function localeDirection(locale: SupportedLocale) {
  return locale === 'fa-IR' ? 'rtl' : 'ltr';
}

export function fallbackLocaleOrder(requestedLocale: string | undefined | null): SupportedLocale[] {
  return [normalizeLocale(requestedLocale)];
}
