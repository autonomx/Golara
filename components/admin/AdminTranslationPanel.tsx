import type { CatalogTranslation, Category, HomepageContent, HomepageTranslation, Product } from '@/lib/catalog';
import { upsertCategoryTranslationAction, upsertHomepageTranslationAction, upsertProductTranslationAction } from '@/app/admin/actions';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@/lib/i18n/locales';
import { createAdminTranslator } from '@/lib/localization/admin-copy';

const inputClass = 'rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';
const textAreaClass = 'min-h-24 rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';
const buttonClass = 'rounded-full bg-rosewood px-5 py-2 text-sm font-semibold text-white outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30 disabled:cursor-not-allowed disabled:bg-stone-300';

type AdminTranslator = (key: string) => string;

type CompletenessTranslation = {
  locale: string;
  title?: string;
  description?: string;
  body?: string;
  isPublished: boolean;
};

function translationFor(translations: CatalogTranslation[] | undefined, locale: SupportedLocale) {
  return translations?.find((translation) => translation.locale === locale);
}

function homepageTranslationFor(translations: HomepageTranslation[] | undefined, locale: SupportedLocale) {
  return translations?.find((translation) => translation.locale === locale);
}

function requiredFieldsComplete<TTranslation extends CompletenessTranslation>(translation: TTranslation | undefined, requiredFields: Array<keyof TTranslation>) {
  if (!translation) return false;
  return requiredFields.every((field) => {
    const value = translation[field];
    return typeof value === 'string' ? Boolean(value.trim()) : Boolean(value);
  });
}

function completionLabel<TTranslation extends CompletenessTranslation>(translation: TTranslation | undefined, requiredFields: Array<keyof TTranslation>) {
  if (!translation) return 'Missing';
  if (!translation.isPublished) return 'Draft';
  return requiredFieldsComplete(translation, requiredFields) ? 'Complete' : 'Needs copy';
}

function completionClass(label: string) {
  if (label === 'Complete') return 'border-emerald-200 bg-emerald-50 text-emerald-900';
  if (label === 'Draft') return 'border-amber-300 bg-amber-50 text-amber-900';
  if (label === 'Needs copy') return 'border-orange-300 bg-orange-50 text-orange-900';
  return 'border-stone-200 bg-white text-stone-600';
}

function LocaleBadge<TTranslation extends CompletenessTranslation>({ translation, requiredFields, t }: { translation?: TTranslation; requiredFields: Array<keyof TTranslation>; t: AdminTranslator }) {
  const label = completionLabel(translation, requiredFields);
  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${completionClass(label)}`}>{t(label)}</span>;
}

function SummaryPill({ label, count }: { label: string; count: number }) {
  return <span className="rounded-full border border-rosewood/10 bg-cream px-3 py-1 text-xs font-semibold text-rosewood">{label}: {count}</span>;
}

function TranslationPublishedToggle({ translation, t }: { translation?: CompletenessTranslation; t: AdminTranslator }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-rosewood/10 bg-white px-4 py-3 text-sm font-semibold text-rosewood">
      <input name="translationIsPublished" type="checkbox" defaultChecked={translation?.isPublished !== false} />
      {t('Active')}
    </label>
  );
}

function LocaleSelect({ defaultValue, label }: { defaultValue: SupportedLocale; label: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-rosewood">
      {label}
      <select name="locale" className={inputClass} defaultValue={defaultValue}>
        {SUPPORTED_LOCALES.map((locale) => (
          <option key={locale} value={locale}>{locale}</option>
        ))}
      </select>
    </label>
  );
}

function HomepageTranslationForm({ homepage, translation, locale, disabled, t }: { homepage: HomepageContent; translation?: HomepageTranslation; locale: SupportedLocale; disabled: boolean; t: AdminTranslator }) {
  const requiredFields: Array<keyof HomepageTranslation> = ['title', 'body'];

  return (
    <form action={upsertHomepageTranslationAction} className="grid gap-3 rounded-3xl border border-rosewood/10 bg-cream p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">{t('Homepage hero')} · {locale}</p>
          <h4 className="font-display text-2xl text-rosewood">{homepage.title}</h4>
        </div>
        <LocaleBadge translation={translation} requiredFields={requiredFields} t={t} />
      </div>
      <input type="hidden" name="locale" value={locale} />
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-rosewood">{t('Translated eyebrow')}<input name="translationEyebrow" className={inputClass} defaultValue={translation?.eyebrow ?? ''} placeholder={homepage.eyebrow} disabled={disabled} /></label>
        <label className="grid gap-2 text-sm font-semibold text-rosewood">{t('Translated title')}<input name="translationTitle" className={inputClass} defaultValue={translation?.title ?? ''} placeholder={homepage.title} required disabled={disabled} /></label>
      </div>
      <label className="grid gap-2 text-sm font-semibold text-rosewood">{t('Translated body')}<textarea name="translationBody" className={textAreaClass} defaultValue={translation?.body ?? ''} placeholder={homepage.body} required disabled={disabled} /></label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-rosewood">{t('Primary CTA label')}<input name="translationPrimaryCtaLabel" className={inputClass} defaultValue={translation?.primaryCtaLabel ?? ''} placeholder={homepage.primaryCtaLabel} disabled={disabled} /></label>
        <label className="grid gap-2 text-sm font-semibold text-rosewood">{t('Primary CTA URL')}<input name="translationPrimaryCtaHref" className={inputClass} defaultValue={translation?.primaryCtaHref ?? ''} placeholder={homepage.primaryCtaHref} disabled={disabled} /></label>
        <label className="grid gap-2 text-sm font-semibold text-rosewood">{t('Secondary CTA label')}<input name="translationSecondaryCtaLabel" className={inputClass} defaultValue={translation?.secondaryCtaLabel ?? ''} placeholder={homepage.secondaryCtaLabel} disabled={disabled} /></label>
        <label className="grid gap-2 text-sm font-semibold text-rosewood">{t('Secondary CTA URL')}<input name="translationSecondaryCtaHref" className={inputClass} defaultValue={translation?.secondaryCtaHref ?? ''} placeholder={homepage.secondaryCtaHref} disabled={disabled} /></label>
        <label className="grid gap-2 text-sm font-semibold text-rosewood">{t('Panel eyebrow')}<input name="translationPanelEyebrow" className={inputClass} defaultValue={translation?.panelEyebrow ?? ''} placeholder={homepage.panelEyebrow} disabled={disabled} /></label>
        <label className="grid gap-2 text-sm font-semibold text-rosewood">{t('Panel title')}<input name="translationPanelTitle" className={inputClass} defaultValue={translation?.panelTitle ?? ''} placeholder={homepage.panelTitle} disabled={disabled} /></label>
      </div>
      <label className="grid gap-2 text-sm font-semibold text-rosewood">{t('Panel body')}<textarea name="translationPanelBody" className={textAreaClass} defaultValue={translation?.panelBody ?? ''} placeholder={homepage.panelBody} disabled={disabled} /></label>
      <div className="flex flex-wrap items-center gap-3"><TranslationPublishedToggle translation={translation} t={t} /><button className={buttonClass} type="submit" disabled={disabled}>{t('Save homepage')} {locale}</button></div>
    </form>
  );
}

function CategoryTranslationForm({ category, locale, disabled, t }: { category: Category; locale: SupportedLocale; disabled: boolean; t: AdminTranslator }) {
  if (!category.id) return null;
  const action = upsertCategoryTranslationAction.bind(null, category.id);
  const translation = translationFor(category.translations, locale);
  const requiredFields: Array<keyof CatalogTranslation> = ['title', 'description'];

  return (
    <form action={action} className="grid gap-3 rounded-3xl border border-rosewood/10 bg-cream p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">{t('Category')} · {locale}</p>
          <h4 className="font-display text-2xl text-rosewood">{category.title}</h4>
        </div>
        <LocaleBadge translation={translation} requiredFields={requiredFields} t={t} />
      </div>
      <input type="hidden" name="locale" value={locale} />
      <label className="grid gap-2 text-sm font-semibold text-rosewood">{t('Translated title')}<input name="translationTitle" className={inputClass} defaultValue={translation?.title ?? ''} placeholder={category.title} required disabled={disabled} /></label>
      <label className="grid gap-2 text-sm font-semibold text-rosewood">{t('Translated eyebrow')}<input name="translationEyebrow" className={inputClass} defaultValue={translation?.eyebrow ?? ''} placeholder={category.eyebrow} disabled={disabled} /></label>
      <label className="grid gap-2 text-sm font-semibold text-rosewood">{t('Translated image alt')}<input name="translationImageAlt" className={inputClass} defaultValue={translation?.imageAlt ?? ''} placeholder={category.title} disabled={disabled} /></label>
      <label className="grid gap-2 text-sm font-semibold text-rosewood">{t('Translated description')}<textarea name="translationDescription" className={textAreaClass} defaultValue={translation?.description ?? ''} placeholder={category.description} disabled={disabled} /></label>
      <div className="flex flex-wrap items-center gap-3"><TranslationPublishedToggle translation={translation} t={t} /><button className={buttonClass} type="submit" disabled={disabled}>{t('Save category')} {locale}</button></div>
    </form>
  );
}

function ProductTranslationForm({ product, locale, disabled, t }: { product: Product; locale: SupportedLocale; disabled: boolean; t: AdminTranslator }) {
  if (!product.id) return null;
  const action = upsertProductTranslationAction.bind(null, product.id);
  const translation = translationFor(product.translations, locale);
  const requiredFields: Array<keyof CatalogTranslation> = ['title', 'description'];

  return (
    <form action={action} className="grid gap-3 rounded-3xl border border-rosewood/10 bg-cream p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">{t('Product')} · {t('Translations')}</p>
          <h4 className="font-display text-2xl text-rosewood">{product.title}</h4>
        </div>
        <LocaleBadge translation={translation} requiredFields={requiredFields} t={t} />
      </div>
      <LocaleSelect defaultValue={locale} label={t('Localization')} />
      <label className="grid gap-2 text-sm font-semibold text-rosewood">{t('Translated title')}<input name="translationTitle" className={inputClass} defaultValue={translation?.title ?? ''} placeholder={product.title} required disabled={disabled} /></label>
      <label className="grid gap-2 text-sm font-semibold text-rosewood">{t('Translated image alt')}<input name="translationImageAlt" className={inputClass} defaultValue={translation?.imageAlt ?? ''} placeholder={product.title} disabled={disabled} /></label>
      <label className="grid gap-2 text-sm font-semibold text-rosewood">{t('Translated description')}<textarea name="translationDescription" className={textAreaClass} defaultValue={translation?.description ?? ''} placeholder={product.description} disabled={disabled} /></label>
      <div className="flex flex-wrap items-center gap-3"><TranslationPublishedToggle translation={translation} t={t} /><button className={buttonClass} type="submit" disabled={disabled}>{t('Save')} {t('Product')}</button></div>
    </form>
  );
}

function entityCompletionCount(items: Array<Category | Product>) {
  return items.reduce((total, item) => total + SUPPORTED_LOCALES.filter((locale) => requiredFieldsComplete(translationFor(item.translations, locale), ['title', 'description'])).length, 0);
}

function homepageCompletionCount(translations: HomepageTranslation[]) {
  return SUPPORTED_LOCALES.filter((locale) => requiredFieldsComplete(homepageTranslationFor(translations, locale), ['title', 'body'])).length;
}

export function AdminTranslationPanel({ homepage, homepageTranslations, categories, products, disabled, locale }: { homepage: HomepageContent; homepageTranslations: HomepageTranslation[]; categories: Category[]; products: Product[]; disabled: boolean; locale?: SupportedLocale | string | null }) {
  const t = createAdminTranslator(locale);
  const visibleCategories = categories.filter((category) => category.id).slice(0, 6);
  const visibleProducts = products.filter((product) => product.id).slice(0, 6);
  const categoryComplete = entityCompletionCount(visibleCategories);
  const productComplete = entityCompletionCount(visibleProducts);
  const homepageComplete = homepageCompletionCount(homepageTranslations);
  const localeSlots = SUPPORTED_LOCALES.length;

  return (
    <section id="translations" className="scroll-mt-8 rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">{t('Localization')}</p>
          <h2 className="mt-2 font-display text-4xl text-rosewood">{t('Translation editor')}</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">{t('Edit Persian and English homepage, product, and category translations, see publish state, and spot missing required copy. Existing base CMS fields remain the legacy fallback.')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SummaryPill label={t('Homepage slots complete')} count={homepageComplete} />
          <SummaryPill label={t('Category slots complete')} count={categoryComplete} />
          <SummaryPill label={t('Product slots complete')} count={productComplete} />
        </div>
      </div>
      <div className="mb-8 grid gap-3">
        <h3 className="font-display text-3xl text-rosewood">{t('Homepage translations')}</h3>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">home.hero · {homepageComplete}/{localeSlots} {t('Complete')}</p>
        <div className="grid gap-4 lg:grid-cols-2">{SUPPORTED_LOCALES.map((locale) => <HomepageTranslationForm key={`homepage-${locale}`} homepage={homepage} translation={homepageTranslationFor(homepageTranslations, locale)} locale={locale} disabled={disabled} t={t} />)}</div>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div>
          <h3 className="mb-4 font-display text-3xl text-rosewood">{t('Category translations')}</h3>
          <div className="grid gap-6">{visibleCategories.map((category) => <div key={category.id} className="grid gap-3"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">{category.slug} · {SUPPORTED_LOCALES.filter((locale) => requiredFieldsComplete(translationFor(category.translations, locale), ['title', 'description'])).length}/{localeSlots} {t('Complete')}</p>{SUPPORTED_LOCALES.map((locale) => <CategoryTranslationForm key={`${category.id}-${locale}`} category={category} locale={locale} disabled={disabled} t={t} />)}</div>)}</div>
        </div>
        <div>
          <h3 className="mb-4 font-display text-3xl text-rosewood">{t('Product translations')}</h3>
          <div className="grid gap-6">{visibleProducts.map((product) => <div key={product.id} className="grid gap-3"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">{product.code} · {SUPPORTED_LOCALES.filter((locale) => requiredFieldsComplete(translationFor(product.translations, locale), ['title', 'description'])).length}/{localeSlots} {t('Complete')}</p>{SUPPORTED_LOCALES.map((locale) => <ProductTranslationForm key={`${product.id}-${locale}`} product={product} locale={locale} disabled={disabled} t={t} />)}</div>)}</div>
        </div>
      </div>
    </section>
  );
}
