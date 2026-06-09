import { SUPPORTED_LOCALES, type SupportedLocale } from '@/lib/i18n/locales';

export type ProductTranslationReadinessTranslation = {
  locale?: string | null;
  title?: string | null;
  description?: string | null;
  isPublished?: boolean | null;
};

export type ProductTranslationReadinessProduct = {
  id?: string | null;
  slug: string;
  title: string;
  isActive?: boolean | null;
  translations?: ProductTranslationReadinessTranslation[] | null;
};

export type ProductTranslationReadinessIssue = {
  productId: string | null;
  slug: string;
  title: string;
  locale: SupportedLocale;
  status: 'missing' | 'draft' | 'incomplete';
  missingFields: string[];
};

function hasText(value?: string | null) {
  return Boolean(value?.trim());
}

function translationForLocale(product: ProductTranslationReadinessProduct, locale: SupportedLocale) {
  return product.translations?.find((translation) => translation.locale === locale);
}

export function productTranslationReadinessIssues(
  products: ProductTranslationReadinessProduct[],
  locales: readonly SupportedLocale[] = SUPPORTED_LOCALES
): ProductTranslationReadinessIssue[] {
  return products
    .filter((product) => product.isActive !== false)
    .flatMap((product) =>
      locales.flatMap((locale) => {
        const translation = translationForLocale(product, locale);
        if (!translation) {
          return [{ productId: product.id ?? null, slug: product.slug, title: product.title, locale, status: 'missing' as const, missingFields: ['title', 'description'] }];
        }
        const missingFields = [
          hasText(translation.title) ? null : 'title',
          hasText(translation.description) ? null : 'description'
        ].filter((field): field is string => Boolean(field));
        if (translation.isPublished === false) {
          return [{ productId: product.id ?? null, slug: product.slug, title: product.title, locale, status: 'draft' as const, missingFields }];
        }
        if (missingFields.length > 0) {
          return [{ productId: product.id ?? null, slug: product.slug, title: product.title, locale, status: 'incomplete' as const, missingFields }];
        }
        return [];
      })
    );
}
