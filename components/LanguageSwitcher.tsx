import { setStorefrontLocaleAction } from '@/app/locale/actions';
import { SUPPORTED_LOCALES, type SupportedLocale } from '@/lib/i18n/locales';
import { getStorefrontCopy } from '@/lib/localization/storefront-copy';

type LocaleLabelKey = 'fa' | 'en';

const localeLabelKeys: Record<SupportedLocale, LocaleLabelKey> = {
  'fa-IR': 'fa',
  'en-CA': 'en'
};

const localizedLocaleLabels: Record<SupportedLocale, Record<LocaleLabelKey, string>> = {
  'fa-IR': {
    fa: 'فارسی',
    en: 'انگلیسی'
  },
  'en-CA': {
    fa: 'Persian',
    en: 'English'
  }
};

export function LanguageSwitcher({ locale, returnTo = '/' }: { locale: SupportedLocale; returnTo?: string }) {
  return (
    <form action={setStorefrontLocaleAction} aria-label={getStorefrontCopy('language.switcherLabel', locale)} className="flex items-center gap-1 rounded-full border border-rosewood/10 bg-white/60 p-1 text-xs font-semibold text-rosewood shadow-sm">
      <input type="hidden" name="returnTo" value={returnTo} />
      {SUPPORTED_LOCALES.map((candidate) => (
        <button
          key={candidate}
          className={`rounded-full px-3 py-1.5 outline-none transition focus-visible:ring-4 focus-visible:ring-olive/20 ${candidate === locale ? 'bg-rosewood text-white' : 'hover:bg-cream'}`}
          type="submit"
          name="locale"
          value={candidate}
          aria-pressed={candidate === locale}
        >
          {localizedLocaleLabels[locale][localeLabelKeys[candidate]]}
        </button>
      ))}
    </form>
  );
}
