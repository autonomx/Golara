export type LocaleAwareMediaAltTranslation = {
  locale?: string | null;
  imageAlt?: string | null;
  title?: string | null;
  isPublished?: boolean | null;
};

export type LocaleAwareMediaAltInput = {
  locale?: string | null;
  fallbackLocale?: string | null;
  mediaAlt?: string | null;
  entityTitle?: string | null;
  translations?: LocaleAwareMediaAltTranslation[] | null;
};

export type LocaleAwareMediaAltSource = 'translation' | 'fallback_translation' | 'media' | 'title' | 'empty';

export type LocaleAwareMediaAltText = {
  alt: string;
  locale: string | null;
  source: LocaleAwareMediaAltSource;
  translationLocale: string | null;
};

export const DEFAULT_MEDIA_ALT_FALLBACK_LOCALE = 'fa-IR';
export const MAX_MEDIA_ALT_TEXT_LENGTH = 160;

function optionalText(value?: string | null) {
  const normalized = value?.trim().replace(/\s+/g, ' ');
  return normalized || null;
}

export function normalizeLocaleAwareMediaAltLocale(value?: string | null) {
  const locale = optionalText(value);
  return locale ? locale.replace('_', '-') : null;
}

export function normalizeLocaleAwareMediaAltText(value?: string | null) {
  const alt = optionalText(value);
  if (!alt) return null;
  return alt.slice(0, MAX_MEDIA_ALT_TEXT_LENGTH);
}

function findPublishedTranslation(
  translations: LocaleAwareMediaAltTranslation[] | null | undefined,
  locale: string | null
) {
  if (!locale) return null;

  return (
    translations?.find(
      (translation) =>
        normalizeLocaleAwareMediaAltLocale(translation.locale) === locale && translation.isPublished !== false
    ) ?? null
  );
}

function buildLocaleAwareMediaAltResult(
  alt: string | null,
  locale: string | null,
  source: LocaleAwareMediaAltSource,
  translationLocale: string | null
): LocaleAwareMediaAltText | null {
  if (!alt && source !== 'empty') return null;

  return {
    alt: alt ?? '',
    locale,
    source,
    translationLocale
  };
}

export function resolveLocaleAwareMediaAltText(input: LocaleAwareMediaAltInput): LocaleAwareMediaAltText {
  const locale = normalizeLocaleAwareMediaAltLocale(input.locale);
  const fallbackLocale = normalizeLocaleAwareMediaAltLocale(input.fallbackLocale) ?? DEFAULT_MEDIA_ALT_FALLBACK_LOCALE;
  const translations = input.translations ?? [];
  const localeTranslation = findPublishedTranslation(translations, locale);
  const localeAlt = normalizeLocaleAwareMediaAltText(localeTranslation?.imageAlt);

  const translated = buildLocaleAwareMediaAltResult(
    localeAlt,
    locale,
    'translation',
    normalizeLocaleAwareMediaAltLocale(localeTranslation?.locale)
  );
  if (translated) return translated;

  const fallbackTranslation = findPublishedTranslation(translations, fallbackLocale);
  const fallbackAlt = normalizeLocaleAwareMediaAltText(fallbackTranslation?.imageAlt);
  const fallbackTranslated = buildLocaleAwareMediaAltResult(
    fallbackAlt,
    locale,
    'fallback_translation',
    normalizeLocaleAwareMediaAltLocale(fallbackTranslation?.locale)
  );
  if (fallbackTranslated) return fallbackTranslated;

  const mediaAlt = buildLocaleAwareMediaAltResult(
    normalizeLocaleAwareMediaAltText(input.mediaAlt),
    locale,
    'media',
    null
  );
  if (mediaAlt) return mediaAlt;

  const titleAlt = buildLocaleAwareMediaAltResult(
    normalizeLocaleAwareMediaAltText(localeTranslation?.title ?? fallbackTranslation?.title ?? input.entityTitle),
    locale,
    'title',
    normalizeLocaleAwareMediaAltLocale(localeTranslation?.locale ?? fallbackTranslation?.locale)
  );
  if (titleAlt) return titleAlt;

  return {
    alt: '',
    locale,
    source: 'empty',
    translationLocale: null
  };
}

export function buildLocaleAwareMediaAltTextMap(
  input: Omit<LocaleAwareMediaAltInput, 'locale'>,
  locales: Array<string | null | undefined>
) {
  return Object.fromEntries(
    locales
      .map((locale) => normalizeLocaleAwareMediaAltLocale(locale))
      .filter((locale): locale is string => Boolean(locale))
      .map((locale) => [locale, resolveLocaleAwareMediaAltText({ ...input, locale })])
  );
}
