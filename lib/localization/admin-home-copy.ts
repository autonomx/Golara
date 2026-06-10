import { adminLocaleKey } from '@/lib/localization/admin-copy';

const en = {
  occasionsLabel: 'Displayed occasions',
  occasionsTitle: 'Homepage occasion tiles',
  showing: 'Showing',
  of: 'of',
  occasionsHelp: 'Edit, remove, or add categories shown in the homepage occasion section.',
  featuredLabel: 'Featured picks',
  featuredTitle: 'Homepage featured products',
  featuredHelp: 'Add, remove, or reorder products shown in the homepage featured picks carousel.',
  page: 'Page',
  previous: 'Previous',
  next: 'Next',
  addOccasionLabel: 'Add another category to homepage',
  chooseCategory: 'Choose category...',
  sortOrder: 'Sort order',
  addOccasionButton: 'Add to homepage',
  emptyOccasionState: 'No homepage occasion tiles are currently selected. Add one above.'
} as const;

const fa: Record<keyof typeof en, string> = {
  occasionsLabel: '\u0645\u0646\u0627\u0633\u0628\u062a\u200c\u0647\u0627\u06cc \u0646\u0645\u0627\u06cc\u0634\u200c\u062f\u0627\u062f\u0647\u200c\u0634\u062f\u0647',
  occasionsTitle: '\u06a9\u0627\u0634\u06cc\u200c\u0647\u0627\u06cc \u0645\u0646\u0627\u0633\u0628\u062a \u0635\u0641\u062d\u0647 \u0627\u0635\u0644\u06cc',
  showing: '\u0646\u0645\u0627\u06cc\u0634',
  of: '\u0627\u0632',
  occasionsHelp: '\u062f\u0633\u062a\u0647\u200c\u0647\u0627\u06cc \u0646\u0645\u0627\u06cc\u0634\u200c\u062f\u0627\u062f\u0647\u200c\u0634\u062f\u0647 \u062f\u0631 \u0628\u062e\u0634 \u0645\u0646\u0627\u0633\u0628\u062a\u200c\u0647\u0627\u06cc \u0635\u0641\u062d\u0647 \u0627\u0635\u0644\u06cc \u0631\u0627 \u0648\u06cc\u0631\u0627\u06cc\u0634 \u06cc\u0627 \u0627\u0636\u0627\u0641\u0647 \u06a9\u0646\u06cc\u062f.',
  featuredLabel: '\u0627\u0646\u062a\u062e\u0627\u0628\u200c\u0647\u0627\u06cc \u0648\u06cc\u0698\u0647',
  featuredTitle: '\u0645\u062d\u0635\u0648\u0644\u0627\u062a \u0648\u06cc\u0698\u0647 \u0635\u0641\u062d\u0647 \u0627\u0635\u0644\u06cc',
  featuredHelp: '\u0645\u062d\u0635\u0648\u0644\u0627\u062a \u06a9\u0627\u0631\u0648\u0633\u0644 \u0627\u0646\u062a\u062e\u0627\u0628\u200c\u0647\u0627\u06cc \u0648\u06cc\u0698\u0647 \u0635\u0641\u062d\u0647 \u0627\u0635\u0644\u06cc \u0631\u0627 \u0627\u0636\u0627\u0641\u0647 \u06cc\u0627 \u0645\u0631\u062a\u0628 \u06a9\u0646\u06cc\u062f.',
  page: '\u0635\u0641\u062d\u0647',
  previous: '\u0642\u0628\u0644\u06cc',
  next: '\u0628\u0639\u062f\u06cc',
  addOccasionLabel: '\u0627\u0641\u0632\u0648\u062f\u0646 \u062f\u0633\u062a\u0647 \u062f\u06cc\u06af\u0631 \u0628\u0647 \u0635\u0641\u062d\u0647 \u0627\u0635\u0644\u06cc',
  chooseCategory: '\u062f\u0633\u062a\u0647 \u0631\u0627 \u0627\u0646\u062a\u062e\u0627\u0628 \u06a9\u0646\u06cc\u062f...',
  sortOrder: '\u062a\u0631\u062a\u06cc\u0628 \u0646\u0645\u0627\u06cc\u0634',
  addOccasionButton: '\u0627\u0641\u0632\u0648\u062f\u0646 \u0628\u0647 \u0635\u0641\u062d\u0647 \u0627\u0635\u0644\u06cc',
  emptyOccasionState: '\u062f\u0631 \u062d\u0627\u0644 \u062d\u0627\u0636\u0631 \u0647\u06cc\u0686 \u06a9\u0627\u0634\u06cc \u0645\u0646\u0627\u0633\u0628\u062a\u06cc \u0628\u0631\u0627\u06cc \u0635\u0641\u062d\u0647 \u0627\u0635\u0644\u06cc \u0627\u0646\u062a\u062e\u0627\u0628 \u0646\u0634\u062f\u0647 \u0627\u0633\u062a. \u06cc\u06a9\u06cc \u0631\u0627 \u0627\u0632 \u0628\u0627\u0644\u0627 \u0627\u0636\u0627\u0641\u0647 \u06a9\u0646\u06cc\u062f.'
};

export type AdminHomeCopyKey = keyof typeof en;

export function getAdminHomeCopy(key: AdminHomeCopyKey, locale?: string | null) {
  if (adminLocaleKey(locale) === 'fa') return fa[key];
  return en[key];
}

export function createAdminHomeTranslator(locale?: string | null) {
  return (key: AdminHomeCopyKey) => getAdminHomeCopy(key, locale);
}
