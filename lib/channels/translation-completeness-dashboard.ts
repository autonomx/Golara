export type TranslationCompletenessEntityType =
  | 'ProductTranslation'
  | 'CategoryTranslation'
  | 'HomepageSectionTranslation';

export type TranslationCompletenessRecord = {
  locale?: string | null;
  [field: string]: unknown;
};

export type TranslationCompletenessEntity = {
  entityType: TranslationCompletenessEntityType;
  entityId: string;
  entityLabel?: string | null;
  translations?: TranslationCompletenessRecord[] | null;
};

export type TranslationCompletenessRequiredFields = Record<TranslationCompletenessEntityType, string[]>;

export type TranslationCompletenessRowStatus = 'complete' | 'partial' | 'missing_translation';

export type TranslationCompletenessDashboardRow = {
  entityType: TranslationCompletenessEntityType;
  entityId: string;
  entityLabel: string | null;
  locale: string;
  requiredFields: string[];
  presentFields: string[];
  missingFields: string[];
  presentCount: number;
  requiredCount: number;
  completenessPercent: number;
  status: TranslationCompletenessRowStatus;
};

export type TranslationCompletenessDashboardSummary = {
  entityType: TranslationCompletenessEntityType;
  locale: string;
  totalEntities: number;
  completeEntities: number;
  partialEntities: number;
  missingTranslationEntities: number;
  averageCompletenessPercent: number;
  missingFieldCounts: Record<string, number>;
};

export type TranslationCompletenessDashboard = {
  locales: string[];
  rows: TranslationCompletenessDashboardRow[];
  summary: TranslationCompletenessDashboardSummary[];
};

export const DEFAULT_TRANSLATION_COMPLETENESS_LOCALES = ['fa-IR', 'en-US'];

export const DEFAULT_TRANSLATION_COMPLETENESS_REQUIRED_FIELDS: TranslationCompletenessRequiredFields = {
  ProductTranslation: ['title', 'description', 'seoTitle', 'seoDescription'],
  CategoryTranslation: ['title', 'eyebrow', 'description', 'seoTitle', 'seoDescription'],
  HomepageSectionTranslation: ['title', 'body', 'seoTitle', 'seoDescription']
};

function normalizeText(value?: string | null) {
  const normalized = value?.trim().replace(/\s+/g, ' ');
  return normalized || null;
}

export function normalizeTranslationCompletenessLocale(value?: string | null) {
  const locale = normalizeText(value);
  return locale ? locale.replace('_', '-') : null;
}

export function normalizeTranslationCompletenessLocales(locales?: Array<string | null | undefined> | null) {
  const normalized = (locales ?? DEFAULT_TRANSLATION_COMPLETENESS_LOCALES)
    .map((locale) => normalizeTranslationCompletenessLocale(locale))
    .filter((locale): locale is string => Boolean(locale));

  return Array.from(new Set(normalized));
}

export function normalizeTranslationCompletenessRequiredFields(
  requiredFields?: Partial<TranslationCompletenessRequiredFields> | null
): TranslationCompletenessRequiredFields {
  return {
    ...DEFAULT_TRANSLATION_COMPLETENESS_REQUIRED_FIELDS,
    ...(requiredFields ?? {})
  };
}

function hasTranslationCompletenessValue(value: unknown) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return Boolean(normalizeText(value));
  if (Array.isArray(value)) return value.length > 0;
  if (typeof value === 'object') return Object.keys(value).length > 0;
  return true;
}

function findTranslationForLocale(translations: TranslationCompletenessRecord[] | null | undefined, locale: string) {
  return (translations ?? []).find(
    (translation) => normalizeTranslationCompletenessLocale(translation.locale) === locale
  );
}

export function buildTranslationCompletenessRow(
  entity: TranslationCompletenessEntity,
  locale: string,
  requiredFieldsByEntityType: TranslationCompletenessRequiredFields = DEFAULT_TRANSLATION_COMPLETENESS_REQUIRED_FIELDS
): TranslationCompletenessDashboardRow {
  const requiredFields = requiredFieldsByEntityType[entity.entityType] ?? [];
  const translation = findTranslationForLocale(entity.translations, locale);
  const presentFields = translation
    ? requiredFields.filter((field) => hasTranslationCompletenessValue(translation[field]))
    : [];
  const missingFields = requiredFields.filter((field) => !presentFields.includes(field));
  const requiredCount = requiredFields.length;
  const presentCount = presentFields.length;
  const completenessPercent = requiredCount === 0 ? 100 : Math.round((presentCount / requiredCount) * 100);
  const status: TranslationCompletenessRowStatus = !translation
    ? 'missing_translation'
    : missingFields.length === 0
      ? 'complete'
      : 'partial';

  return {
    entityType: entity.entityType,
    entityId: entity.entityId,
    entityLabel: normalizeText(entity.entityLabel),
    locale,
    requiredFields,
    presentFields,
    missingFields,
    presentCount,
    requiredCount,
    completenessPercent,
    status
  };
}

export function buildTranslationCompletenessDashboardRows(
  entities: TranslationCompletenessEntity[],
  locales?: Array<string | null | undefined> | null,
  requiredFields?: Partial<TranslationCompletenessRequiredFields> | null
) {
  const normalizedLocales = normalizeTranslationCompletenessLocales(locales);
  const normalizedRequiredFields = normalizeTranslationCompletenessRequiredFields(requiredFields);

  return entities.flatMap((entity) =>
    normalizedLocales.map((locale) => buildTranslationCompletenessRow(entity, locale, normalizedRequiredFields))
  );
}

export function summarizeTranslationCompletenessRows(rows: TranslationCompletenessDashboardRow[]) {
  const grouped = new Map<string, TranslationCompletenessDashboardRow[]>();

  for (const row of rows) {
    const key = `${row.entityType}:${row.locale}`;
    grouped.set(key, [...(grouped.get(key) ?? []), row]);
  }

  return Array.from(grouped.values()).map((groupRows) => {
    const [firstRow] = groupRows;
    const missingFieldCounts: Record<string, number> = {};

    for (const row of groupRows) {
      for (const field of row.missingFields) {
        missingFieldCounts[field] = (missingFieldCounts[field] ?? 0) + 1;
      }
    }

    return {
      entityType: firstRow.entityType,
      locale: firstRow.locale,
      totalEntities: groupRows.length,
      completeEntities: groupRows.filter((row) => row.status === 'complete').length,
      partialEntities: groupRows.filter((row) => row.status === 'partial').length,
      missingTranslationEntities: groupRows.filter((row) => row.status === 'missing_translation').length,
      averageCompletenessPercent: Math.round(
        groupRows.reduce((sum, row) => sum + row.completenessPercent, 0) / groupRows.length
      ),
      missingFieldCounts
    };
  });
}

export function buildTranslationCompletenessDashboard(
  entities: TranslationCompletenessEntity[],
  locales?: Array<string | null | undefined> | null,
  requiredFields?: Partial<TranslationCompletenessRequiredFields> | null
): TranslationCompletenessDashboard {
  const normalizedLocales = normalizeTranslationCompletenessLocales(locales);
  const rows = buildTranslationCompletenessDashboardRows(entities, normalizedLocales, requiredFields);

  return {
    locales: normalizedLocales,
    rows,
    summary: summarizeTranslationCompletenessRows(rows)
  };
}
