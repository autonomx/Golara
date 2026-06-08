import assert from 'node:assert/strict';
import { DEFAULT_LOCALE, FALLBACK_LOCALE, SUPPORTED_LOCALES, fallbackLocaleOrder, isSupportedLocale, localeDirection, normalizeLocale } from '../../lib/i18n/locales';
import { localizedField, selectPublishedTranslation, selectTranslatedContent } from '../../lib/i18n/translated-content';
import { storefrontCopy } from '../../lib/localization/storefront-copy';

export async function runI18nLocalizationTests() {
  assert.equal(DEFAULT_LOCALE, 'fa-IR');
  assert.equal(FALLBACK_LOCALE, 'en-CA');
  assert.deepEqual([...SUPPORTED_LOCALES], ['fa-IR', 'en-CA']);
  assert.equal(isSupportedLocale('fa-IR'), true);
  assert.equal(isSupportedLocale('en-CA'), true);
  assert.equal(isSupportedLocale('fa'), false);
  assert.equal(isSupportedLocale('english'), false);

  assert.equal(normalizeLocale(undefined), 'fa-IR');
  assert.equal(normalizeLocale(null), 'fa-IR');
  assert.equal(normalizeLocale('  '), 'fa-IR');
  assert.equal(normalizeLocale('fa'), 'fa-IR');
  assert.equal(normalizeLocale('FA-ir'), 'fa-IR');
  assert.equal(normalizeLocale('persian'), 'fa-IR');
  assert.equal(normalizeLocale('farsi'), 'fa-IR');
  assert.equal(normalizeLocale('en'), 'en-CA');
  assert.equal(normalizeLocale('EN-ca'), 'en-CA');
  assert.equal(normalizeLocale('english'), 'en-CA');
  assert.equal(normalizeLocale('unknown'), 'fa-IR');

  assert.equal(localeDirection('fa-IR'), 'rtl');
  assert.equal(localeDirection('en-CA'), 'ltr');

  assert.deepEqual(fallbackLocaleOrder('fa-IR'), ['fa-IR', 'en-CA']);
  assert.deepEqual(fallbackLocaleOrder('en-CA'), ['en-CA', 'fa-IR']);
  assert.deepEqual(fallbackLocaleOrder('english'), ['en-CA', 'fa-IR']);
  assert.deepEqual(fallbackLocaleOrder(undefined), ['fa-IR', 'en-CA']);
  assert.deepEqual(fallbackLocaleOrder('bad'), ['fa-IR', 'en-CA']);

  assert.deepEqual(Object.keys(storefrontCopy.fa).sort(), Object.keys(storefrontCopy.en).sort());
  for (const [locale, copy] of Object.entries(storefrontCopy)) {
    for (const [key, value] of Object.entries(copy)) {
      assert.equal(typeof value, 'string', `${locale}.${key} should be a string`);
      assert.notEqual(value.trim(), '', `${locale}.${key} should not be blank`);
    }
  }

  const translations = [
    { locale: 'fa-IR', title: 'رز', description: 'فارسی', isPublished: true },
    { locale: 'en-CA', title: 'Rose', description: 'English', isPublished: true },
    { locale: 'fr-CA', title: 'Rose FR', description: 'French', isPublished: true }
  ];

  assert.deepEqual(selectPublishedTranslation(translations, 'en-CA'), { locale: 'en-CA', translation: translations[1] });
  assert.deepEqual(selectPublishedTranslation(translations, 'fa-IR'), { locale: 'fa-IR', translation: translations[0] });

  const unpublishedEnglish = [
    { locale: 'en-CA', title: 'Draft English', isPublished: false },
    { locale: 'fa-IR', title: 'منتشر شده', isPublished: true }
  ];
  assert.deepEqual(selectPublishedTranslation(unpublishedEnglish, 'en-CA'), { locale: 'fa-IR', translation: unpublishedEnglish[1] });

  const base = { title: 'Legacy title', description: 'Legacy description' };
  const selected = selectTranslatedContent({ translations, base, requestedLocale: 'en' });
  assert.equal(selected.source, 'translation');
  assert.equal(selected.locale, 'en-CA');
  assert.equal(localizedField({ selection: selected, field: 'title' }), 'Rose');

  const missing = selectTranslatedContent({ translations: [], base, requestedLocale: 'en-CA' });
  assert.equal(missing.source, 'legacy-base');
  assert.equal(missing.locale, 'en-CA');
  assert.equal(localizedField({ selection: missing, field: 'title' }), 'Legacy title');

  const blankTranslation = selectTranslatedContent({
    translations: [{ locale: 'en-CA', title: ' ', description: 'Translated description', isPublished: true }],
    base,
    requestedLocale: 'en-CA'
  });
  assert.equal(localizedField({ selection: blankTranslation, field: 'title' }), 'Legacy title');
  assert.equal(localizedField({ selection: blankTranslation, field: 'description' }), 'Translated description');

  console.log('i18n-localization.test.ts passed');
}
