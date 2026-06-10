import type { ReactNode } from 'react';
import type { Category, HomepageContent, HomepageTranslation, Product } from '@/lib/catalog';
import type { SupportedLocale } from '@/lib/i18n/locales';
import { updateHomepageAction } from '@/app/admin/actions';
import { AdminTranslationPanel } from '@/components/admin/AdminTranslationPanel';

type AdminHomepageSectionProps = {
  homepage: HomepageContent;
  homepageTranslations: HomepageTranslation[];
  categories: Category[];
  products: Product[];
  disabled: boolean;
  authenticated: boolean;
  locale?: SupportedLocale | string | null;
  t?: (key: string) => string;
};

const inputClass = 'rounded-lg border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';
const textAreaClass = 'min-h-28 rounded-lg border border-rosewood/15 bg-white px-4 py-3 text-stone-800 outline-none transition focus:border-rosewood focus-visible:ring-4 focus-visible:ring-olive/20 disabled:cursor-not-allowed disabled:bg-stone-100';
const primaryButtonClass = 'w-fit rounded-full bg-rosewood px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-rosewood/20 outline-none transition focus-visible:ring-4 focus-visible:ring-olive/30 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:shadow-none';
const panelClass = 'scroll-mt-24 rounded-lg border border-rosewood/10 bg-white p-6 shadow-sm';

function Field({ label, name, defaultValue, placeholder, type = 'text', disabled = false, required = true }: { label: string; name: string; defaultValue?: string | number; placeholder?: string; type?: string; disabled?: boolean; required?: boolean }) {
  return <label className="grid gap-2 text-sm font-semibold text-rosewood">{label}<input className={inputClass} name={name} type={type} defaultValue={defaultValue} placeholder={placeholder} disabled={disabled} required={required} /></label>;
}

function TextArea({ label, name, defaultValue, disabled = false }: { label: string; name: string; defaultValue?: string; disabled?: boolean }) {
  return <label className="grid gap-2 text-sm font-semibold text-rosewood">{label}<textarea className={textAreaClass} name={name} defaultValue={defaultValue} disabled={disabled} required /></label>;
}

function SubmitButton({ children, disabled }: { children: ReactNode; disabled: boolean }) {
  return <button className={primaryButtonClass} type="submit" disabled={disabled}>{children}</button>;
}

function AdminHomepageForm({ homepage, disabled, t = (key: string) => key }: { homepage: HomepageContent; disabled: boolean; t?: (key: string) => string }) {
  return (
    <section id="homepage" className={panelClass}>
      <div className="mb-6">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-olive">{t('Homepage')}</p>
        <h2 className="mt-2 font-display text-4xl text-rosewood">{t('Hero content')}</h2>
      </div>
      <form action={updateHomepageAction} className="grid gap-4">
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t('Eyebrow')} name="eyebrow" defaultValue={homepage.eyebrow} disabled={disabled} />
          <Field label={t('Title')} name="title" defaultValue={homepage.title} disabled={disabled} />
        </div>
        <TextArea label={t('Body')} name="body" defaultValue={homepage.body} disabled={disabled} />
        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t('Primary CTA label')} name="primaryCtaLabel" defaultValue={homepage.primaryCtaLabel} disabled={disabled} />
          <Field label={t('Primary CTA URL')} name="primaryCtaHref" defaultValue={homepage.primaryCtaHref} disabled={disabled} />
          <Field label={t('Secondary CTA label')} name="secondaryCtaLabel" defaultValue={homepage.secondaryCtaLabel} disabled={disabled} />
          <Field label={t('Secondary CTA URL')} name="secondaryCtaHref" defaultValue={homepage.secondaryCtaHref} disabled={disabled} />
          <Field label={t('Panel eyebrow')} name="panelEyebrow" defaultValue={homepage.panelEyebrow} disabled={disabled} />
          <Field label={t('Panel title')} name="panelTitle" defaultValue={homepage.panelTitle} disabled={disabled} />
        </div>
        <TextArea label={t('Panel body')} name="panelBody" defaultValue={homepage.panelBody} disabled={disabled} />
        <SubmitButton disabled={disabled}>{t('Save homepage')}</SubmitButton>
      </form>
    </section>
  );
}

export function AdminHomepageSection({ homepage, homepageTranslations, categories, products, disabled, authenticated, locale, t = (key: string) => key }: AdminHomepageSectionProps) {
  return (
    <>
      <AdminHomepageForm homepage={homepage} disabled={disabled} t={t} />
      {authenticated ? <AdminTranslationPanel homepage={homepage} homepageTranslations={homepageTranslations} categories={categories} products={products} disabled={disabled} locale={locale} /> : null}
    </>
  );
}
