import type { CatalogTranslation, Category, Product } from '@/lib/catalog';
import { upsertCategoryTranslationAction, upsertProductTranslationAction } from '@/app/admin/actions';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@/lib/i18n/locales';

const inputClass = 'rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';
const textAreaClass = 'min-h-24 rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';
const buttonClass = 'rounded-full bg-rosewood px-5 py-2 text-sm font-semibold text-white outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30 disabled:cursor-not-allowed disabled:bg-stone-300';

function translationFor(translations: CatalogTranslation[] | undefined, locale: SupportedLocale) {
  return translations?.find((translation) => translation.locale === locale);
}

function requiredFieldsComplete(translation: CatalogTranslation | undefined, requiredFields: Array<keyof CatalogTranslation>) {
  if (!translation) return false;
  return requiredFields.every((field) => {
    const value = translation[field];
    return typeof value === 'string' ? Boolean(value.trim()) : Boolean(value);
  });
}

function completionLabel(translation: CatalogTranslation | undefined, requiredFields: Array<keyof CatalogTranslation>) {
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

function LocaleBadge({ translation, requiredFields }: { translation?: CatalogTranslation; requiredFields: Array<keyof CatalogTranslation> }) {
  const label = completionLabel(translation, requiredFields);
  return <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${completionClass(label)}`}>{label}</span>;
}

function SummaryPill({ label, count }: { label: string; count: number }) {
  return <span className="rounded-full border border-rosewood/10 bg-cream px-3 py-1 text-xs font-semibold text-rosewood">{label}: {count}</span>;
}

function TranslationPublishedToggle({ translation }: { translation?: CatalogTranslation }) {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-rosewood/10 bg-white px-4 py-3 text-sm font-semibold text-rosewood">
      <input name="translationIsPublished" type="checkbox" defaultChecked={translation?.isPublished !== false} />
      Published
    </label>
  );
}

function CategoryTranslationForm({ category, locale, disabled }: { category: Category; locale: SupportedLocale; disabled: boolean }) {
  if (!category.id) return null;
  const action = upsertCategoryTranslationAction.bind(null, category.id);
  const translation = translationFor(category.translations, locale);
  const requiredFields: Array<keyof CatalogTranslation> = ['title', 'description'];

  return (
    <form action={action} className="grid gap-3 rounded-3xl border border-rosewood/10 bg-cream p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Category · {locale}</p>
          <h4 className="font-display text-2xl text-rosewood">{category.title}</h4>
        </div>
        <LocaleBadge translation={translation} requiredFields={requiredFields} />
      </div>
      <input type="hidden" name="locale" value={locale} />
      <label className="grid gap-2 text-sm font-semibold text-rosewood">Translated title<input name="translationTitle" className={inputClass} defaultValue={translation?.title ?? ''} placeholder={category.title} required disabled={disabled} /></label>
      <label className="grid gap-2 text-sm font-semibold text-rosewood">Translated eyebrow<input name="translationEyebrow" className={inputClass} defaultValue={translation?.eyebrow ?? ''} placeholder={category.eyebrow} disabled={disabled} /></label>
      <label className="grid gap-2 text-sm font-semibold text-rosewood">Translated image alt<input name="translationImageAlt" className={inputClass} defaultValue={translation?.imageAlt ?? ''} placeholder={category.title} disabled={disabled} /></label>
      <label className="grid gap-2 text-sm font-semibold text-rosewood">Translated description<textarea name="translationDescription" className={textAreaClass} defaultValue={translation?.description ?? ''} placeholder={category.description} disabled={disabled} /></label>
      <div className="flex flex-wrap items-center gap-3"><TranslationPublishedToggle translation={translation} /><button className={buttonClass} type="submit" disabled={disabled}>Save {locale}</button></div>
    </form>
  );
}

function ProductTranslationForm({ product, locale, disabled }: { product: Product; locale: SupportedLocale; disabled: boolean }) {
  if (!product.id) return null;
  const action = upsertProductTranslationAction.bind(null, product.id);
  const translation = translationFor(product.translations, locale);
  const requiredFields: Array<keyof CatalogTranslation> = ['title', 'description'];

  return (
    <form action={action} className="grid gap-3 rounded-3xl border border-rosewood/10 bg-cream p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Product · {locale}</p>
          <h4 className="font-display text-2xl text-rosewood">{product.title}</h4>
        </div>
        <LocaleBadge translation={translation} requiredFields={requiredFields} />
      </div>
      <input type="hidden" name="locale" value={locale} />
      <label className="grid gap-2 text-sm font-semibold text-rosewood">Translated title<input name="translationTitle" className={inputClass} defaultValue={translation?.title ?? ''} placeholder={product.title} required disabled={disabled} /></label>
      <label className="grid gap-2 text-sm font-semibold text-rosewood">Translated image alt<input name="translationImageAlt" className={inputClass} defaultValue={translation?.imageAlt ?? ''} placeholder={product.title} disabled={disabled} /></label>
      <label className="grid gap-2 text-sm font-semibold text-rosewood">Translated description<textarea name="translationDescription" className={textAreaClass} defaultValue={translation?.description ?? ''} placeholder={product.description} disabled={disabled} /></label>
      <div className="flex flex-wrap items-center gap-3"><TranslationPublishedToggle translation={translation} /><button className={buttonClass} type="submit" disabled={disabled}>Save {locale}</button></div>
    </form>
  );
}

function entityCompletionCount(items: Array<Category | Product>) {
  return items.reduce((total, item) => total + SUPPORTED_LOCALES.filter((locale) => requiredFieldsComplete(translationFor(item.translations, locale), ['title', 'description'])).length, 0);
}

export function AdminTranslationPanel({ categories, products, disabled }: { categories: Category[]; products: Product[]; disabled: boolean }) {
  const visibleCategories = categories.filter((category) => category.id).slice(0, 6);
  const visibleProducts = products.filter((product) => product.id).slice(0, 6);
  const categoryComplete = entityCompletionCount(visibleCategories);
  const productComplete = entityCompletionCount(visibleProducts);
  const localeSlots = SUPPORTED_LOCALES.length;

  return (
    <section id="translations" className="scroll-mt-8 rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">Localization</p>
          <h2 className="mt-2 font-display text-4xl text-rosewood">Translation editor</h2>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">Edit existing Persian and English product/category translations, see publish state, and spot missing required copy. Existing base CMS fields remain the legacy fallback.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SummaryPill label="Category slots complete" count={categoryComplete} />
          <SummaryPill label="Product slots complete" count={productComplete} />
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div>
          <h3 className="mb-4 font-display text-3xl text-rosewood">Category translations</h3>
          <div className="grid gap-6">{visibleCategories.map((category) => <div key={category.id} className="grid gap-3"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">{category.slug} · {SUPPORTED_LOCALES.filter((locale) => requiredFieldsComplete(translationFor(category.translations, locale), ['title', 'description'])).length}/{localeSlots} complete</p>{SUPPORTED_LOCALES.map((locale) => <CategoryTranslationForm key={`${category.id}-${locale}`} category={category} locale={locale} disabled={disabled} />)}</div>)}</div>
        </div>
        <div>
          <h3 className="mb-4 font-display text-3xl text-rosewood">Product translations</h3>
          <div className="grid gap-6">{visibleProducts.map((product) => <div key={product.id} className="grid gap-3"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">{product.code} · {SUPPORTED_LOCALES.filter((locale) => requiredFieldsComplete(translationFor(product.translations, locale), ['title', 'description'])).length}/{localeSlots} complete</p>{SUPPORTED_LOCALES.map((locale) => <ProductTranslationForm key={`${product.id}-${locale}`} product={product} locale={locale} disabled={disabled} />)}</div>)}</div>
        </div>
      </div>
    </section>
  );
}
