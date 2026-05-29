import type { Category, Product } from '@/lib/catalog';
import { upsertCategoryTranslationAction, upsertProductTranslationAction } from '@/app/admin/actions';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@/lib/i18n/locales';

const inputClass = 'rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';
const textAreaClass = 'min-h-24 rounded-2xl border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';
const buttonClass = 'rounded-full bg-rosewood px-5 py-2 text-sm font-semibold text-white outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30 disabled:cursor-not-allowed disabled:bg-stone-300';

function LocaleSelect({ defaultLocale }: { defaultLocale: SupportedLocale }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-rosewood">
      Locale
      <select name="locale" defaultValue={defaultLocale} className={inputClass}>
        {SUPPORTED_LOCALES.map((locale) => (
          <option key={locale} value={locale}>{locale}</option>
        ))}
      </select>
    </label>
  );
}

function TranslationPublishedToggle() {
  return (
    <label className="flex items-center gap-3 rounded-2xl border border-rosewood/10 bg-white px-4 py-3 text-sm font-semibold text-rosewood">
      <input name="translationIsPublished" type="checkbox" defaultChecked />
      Published
    </label>
  );
}

function CategoryTranslationForm({ category, locale, disabled }: { category: Category; locale: SupportedLocale; disabled: boolean }) {
  if (!category.id) return null;
  const action = upsertCategoryTranslationAction.bind(null, category.id);

  return (
    <form action={action} className="grid gap-3 rounded-3xl border border-rosewood/10 bg-cream p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Category</p>
          <h4 className="font-display text-2xl text-rosewood">{category.title}</h4>
        </div>
        <span className="rounded-full border border-rosewood/10 bg-white px-3 py-1 text-xs font-semibold text-rosewood">{category.slug}</span>
      </div>
      <LocaleSelect defaultLocale={locale} />
      <label className="grid gap-2 text-sm font-semibold text-rosewood">Translated title<input name="translationTitle" className={inputClass} placeholder={category.title} required disabled={disabled} /></label>
      <label className="grid gap-2 text-sm font-semibold text-rosewood">Translated eyebrow<input name="translationEyebrow" className={inputClass} placeholder={category.eyebrow} disabled={disabled} /></label>
      <label className="grid gap-2 text-sm font-semibold text-rosewood">Translated image alt<input name="translationImageAlt" className={inputClass} placeholder={category.title} disabled={disabled} /></label>
      <label className="grid gap-2 text-sm font-semibold text-rosewood">Translated description<textarea name="translationDescription" className={textAreaClass} placeholder={category.description} disabled={disabled} /></label>
      <div className="flex flex-wrap items-center gap-3"><TranslationPublishedToggle /><button className={buttonClass} type="submit" disabled={disabled}>Save category translation</button></div>
    </form>
  );
}

function ProductTranslationForm({ product, locale, disabled }: { product: Product; locale: SupportedLocale; disabled: boolean }) {
  if (!product.id) return null;
  const action = upsertProductTranslationAction.bind(null, product.id);

  return (
    <form action={action} className="grid gap-3 rounded-3xl border border-rosewood/10 bg-cream p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-stone-500">Product</p>
          <h4 className="font-display text-2xl text-rosewood">{product.title}</h4>
        </div>
        <span className="rounded-full border border-rosewood/10 bg-white px-3 py-1 text-xs font-semibold text-rosewood">{product.code}</span>
      </div>
      <LocaleSelect defaultLocale={locale} />
      <label className="grid gap-2 text-sm font-semibold text-rosewood">Translated title<input name="translationTitle" className={inputClass} placeholder={product.title} required disabled={disabled} /></label>
      <label className="grid gap-2 text-sm font-semibold text-rosewood">Translated image alt<input name="translationImageAlt" className={inputClass} placeholder={product.title} disabled={disabled} /></label>
      <label className="grid gap-2 text-sm font-semibold text-rosewood">Translated description<textarea name="translationDescription" className={textAreaClass} placeholder={product.description} disabled={disabled} /></label>
      <div className="flex flex-wrap items-center gap-3"><TranslationPublishedToggle /><button className={buttonClass} type="submit" disabled={disabled}>Save product translation</button></div>
    </form>
  );
}

export function AdminTranslationPanel({ categories, products, disabled }: { categories: Category[]; products: Product[]; disabled: boolean }) {
  const visibleCategories = categories.filter((category) => category.id).slice(0, 6);
  const visibleProducts = products.filter((product) => product.id).slice(0, 6);

  return (
    <section id="translations" className="scroll-mt-8 rounded-[2rem] border border-rosewood/10 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">Localization</p>
        <h2 className="mt-2 font-display text-4xl text-rosewood">Translation editor</h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-stone-600">Create or update Persian and English product/category translations. Existing base CMS fields remain the legacy fallback.</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div>
          <h3 className="mb-4 font-display text-3xl text-rosewood">Category translations</h3>
          <div className="grid gap-4">{visibleCategories.map((category) => <CategoryTranslationForm key={category.id} category={category} locale="fa-IR" disabled={disabled} />)}</div>
        </div>
        <div>
          <h3 className="mb-4 font-display text-3xl text-rosewood">Product translations</h3>
          <div className="grid gap-4">{visibleProducts.map((product) => <ProductTranslationForm key={product.id} product={product} locale="fa-IR" disabled={disabled} />)}</div>
        </div>
      </div>
    </section>
  );
}
