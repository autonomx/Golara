import { normalizeLocale, type SupportedLocale } from '@/lib/i18n/locales';
import { getLocalizedCategorySeedCopy } from '@/lib/localization/catalog-seed-fallback';

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

export function selectPublishedTranslationForExactLocale<TTranslation extends TranslationLike>(translations: TTranslation[], requestedLocale: string | undefined | null) {
  const locale = normalizeLocale(requestedLocale);
  const translation = translations.find((item) => item.locale === locale && item.isPublished !== false);
  return translation ? { locale, translation } : null;
}

export function selectTranslatedContent<TTranslation extends TranslationLike, TBase>(input: {
  translations?: TTranslation[] | null;
  base: TBase;
  requestedLocale?: string | null;
}): TranslationSelection<TTranslation, TBase> {
  const requestedLocale = normalizeLocale(input.requestedLocale);
  const selected = selectPublishedTranslationForExactLocale(input.translations ?? [], requestedLocale);

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

function localizedLegacyCategoryField<TBase extends Record<string, unknown>>(selection: TranslationSelection<TranslationLike, TBase>, field: string) {
  if (selection.source !== 'legacy-base') return '';
  if (field !== 'title' && field !== 'eyebrow' && field !== 'description') return '';
  const slug = selection.base.slug;
  if (typeof slug !== 'string') return '';
  return getLocalizedCategorySeedCopy(slug, selection.requestedLocale)?.[field as 'title' | 'eyebrow' | 'description'] ?? '';
}

export function localizedField<TTranslation extends Record<string, unknown>, TBase extends Record<string, unknown>>(input: {
  selection: TranslationSelection<TTranslation & TranslationLike, TBase>;
  field: keyof TTranslation & keyof TBase & string;
}) {
  const translatedValue = input.selection.translation?.[input.field];
  if (typeof translatedValue === 'string' && translatedValue.trim()) return translatedValue;

  const localeSeedValue = localizedLegacyCategoryField(input.selection, input.field);
  if (localeSeedValue.trim()) return localeSeedValue;

  const baseValue = input.selection.base[input.field];
  return typeof baseValue === 'string' ? baseValue : '';
}
