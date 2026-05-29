import { fallbackLocaleOrder, type SupportedLocale } from '@/lib/i18n/locales';

export type TranslationLike = {
  locale: string;
  isPublished?: boolean | null;
};

export type TranslationSelection<TTranslation extends TranslationLike, TBase> = {
  locale: SupportedLocale;
  source: 'translation' | 'legacy-base';
  translation?: TTranslation;
  base: TBase;
  requestedLocale: SupportedLocale;
};

export function selectPublishedTranslation<TTranslation extends TranslationLike>(translations: TTranslation[], requestedLocale: string | undefined | null) {
  const order = fallbackLocaleOrder(requestedLocale);

  for (const locale of order) {
    const translation = translations.find((item) => item.locale === locale && item.isPublished !== false);
    if (translation) return { locale, translation };
  }

  return null;
}

export function selectTranslatedContent<TTranslation extends TranslationLike, TBase>(input: {
  translations?: TTranslation[] | null;
  base: TBase;
  requestedLocale?: string | null;
}): TranslationSelection<TTranslation, TBase> {
  const requestedLocale = fallbackLocaleOrder(input.requestedLocale)[0];
  const selected = selectPublishedTranslation(input.translations ?? [], requestedLocale);

  if (selected) {
    return {
      locale: selected.locale,
      source: 'translation',
      translation: selected.translation,
      base: input.base,
      requestedLocale
    };
  }

  return {
    locale: requestedLocale,
    source: 'legacy-base',
    base: input.base,
    requestedLocale
  };
}

export function localizedField<TTranslation extends Record<string, unknown>, TBase extends Record<string, unknown>>(input: {
  selection: TranslationSelection<TTranslation & TranslationLike, TBase>;
  field: keyof TTranslation & keyof TBase & string;
}) {
  const translatedValue = input.selection.translation?.[input.field];
  if (typeof translatedValue === 'string' && translatedValue.trim()) return translatedValue;

  const baseValue = input.selection.base[input.field];
  return typeof baseValue === 'string' ? baseValue : '';
}
