export function formatMinorUnitAmount(amount: number, currency: string, locale = 'en-CA') {
  const normalizedCurrency = currency?.trim().toUpperCase() || 'CAD';
  const zeroDecimalCurrencies = new Set(['IRR', 'JPY', 'KRW', 'VND']);
  const divisor = zeroDecimalCurrencies.has(normalizedCurrency) ? 1 : 100;
  const value = Number.isFinite(amount) ? amount / divisor : 0;

  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: normalizedCurrency,
      maximumFractionDigits: zeroDecimalCurrencies.has(normalizedCurrency) ? 0 : 2
    }).format(value);
  } catch {
    return `${value.toFixed(zeroDecimalCurrencies.has(normalizedCurrency) ? 0 : 2)} ${normalizedCurrency}`;
  }
}

export type CatalogTranslation = {
  locale: string;
  title: string;
  eyebrow?: string;
  description?: string;
  imageAlt?: string;
  isPublished: boolean;
  updatedAt?: Date;
};

export type HomepageTranslation = {
  locale: string;
  eyebrow?: string;
  title?: string;
  body?: string;
  primaryCtaLabel?: string;
  primaryCtaHref?: string;
  secondaryCtaLabel?: string;
  secondaryCtaHref?: string;
  panelEyebrow?: string;
  panelTitle?: string;
  panelBody?: string;
  isPublished: boolean;
  updatedAt?: Date;
};

export type HomepageContent = {
  eyebrow: string;
  title: string;
  body: string;
  primaryCtaLabel: string;
  primaryCtaHref: string;
  secondaryCtaLabel: string;
  secondaryCtaHref: string;
  /** Legacy admin form aliases retained while the shared admin shell is being split. */
  primaryLabel?: string;
  primaryUrl?: string;
  secondaryLabel?: string;
  secondaryUrl?: string;
  panelEyebrow: string;
  panelTitle: string;
  panelBody: string;
  heroImage?: string;
  heroImageAlt?: string;
  tertiaryCtaLabel?: string;
  tertiaryCtaHref?: string;
  trustItemOne?: string;
  trustItemTwo?: string;
  trustItemThree?: string;
  studioBadge?: string;
  collectionsEyebrow?: string;
  collectionsTitle?: string;
  collectionsBody?: string;
  collectionsCtaLabel?: string;
  collectionsCtaHref?: string;
  footerBody?: string;
  footerServiceBody?: string;
};

export type Category = {
  id?: string;
  slug: string;
  title: string;
  eyebrow: string;
  description: string;
  image?: string;
  parentId?: string;
  parentSlug?: string;
};
