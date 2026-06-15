import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { localizedField, selectTranslatedContent } from '@/lib/i18n/translated-content';
import { getLocalizedCategorySeedCopy, localizeSeedCategories } from '@/lib/localization/catalog-seed-fallback';
import { seedCategories } from '@/lib/seed-data';

const mixedLegacyCategory = {
  slug: 'available-today',
  title: 'موجود برای امروز Available Today',
  eyebrow: 'Today',
  description: 'Today-ready Woshe-style collection for daily, cacao and rose, and VIP selections.'
};

const englishSelection = selectTranslatedContent({
  translations: [],
  base: mixedLegacyCategory,
  requestedLocale: 'en-CA'
});

assert.equal(localizedField({ selection: englishSelection, field: 'title' }), 'Available Today');
assert.equal(localizedField({ selection: englishSelection, field: 'eyebrow' }), 'Today');
assert.equal(
  localizedField({ selection: englishSelection, field: 'description' }),
  'Today-ready Woshe-style collection for daily, cacao and rose, and VIP selections.'
);

const persianSelection = selectTranslatedContent({
  translations: [],
  base: { ...mixedLegacyCategory, title: 'Available Today' },
  requestedLocale: 'fa-IR'
});

assert.equal(localizedField({ selection: persianSelection, field: 'title' }), 'آماده امروز');
assert.equal(localizedField({ selection: persianSelection, field: 'eyebrow' }), 'امروز');
assert.equal(localizedField({ selection: persianSelection, field: 'description' }), 'گل‌آرایی‌های آماده سفارش برای امروز.');

assert.equal(getLocalizedCategorySeedCopy('flower-boxes', 'en-CA')?.title, 'Flower Box');
assert.equal(getLocalizedCategorySeedCopy('flower-boxes', 'fa-IR')?.title, 'باکس گل');

const englishSeedCategories = localizeSeedCategories(seedCategories, 'en-CA');
assert.equal(englishSeedCategories.find((category) => category.slug === 'available-today')?.title, 'Available Today');
assert.equal(englishSeedCategories.find((category) => category.slug === 'flower-boxes')?.title, 'Flower Box');
assert.equal(englishSeedCategories.find((category) => category.slug === 'weddings')?.title, 'Weddings');

const persianSeedCategories = localizeSeedCategories(seedCategories, 'fa-IR');
assert.equal(persianSeedCategories.find((category) => category.slug === 'available-today')?.title, 'آماده امروز');
assert.equal(persianSeedCategories.find((category) => category.slug === 'flower-boxes')?.title, 'باکس گل');
assert.equal(persianSeedCategories.find((category) => category.slug === 'weddings')?.title, 'عروسی');

const source = readFileSync('lib/i18n/translated-content.ts', 'utf8');
assert.match(source, /getLocalizedCategorySeedCopy\(slug, selection\.requestedLocale\)/);
assert.match(source, /selection\.source !== 'legacy-base'/);

console.log('category locale seed fallback guard passed');
