import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  buildLocaleAwareMediaAltTextMap,
  normalizeLocaleAwareMediaAltLocale,
  normalizeLocaleAwareMediaAltText,
  resolveLocaleAwareMediaAltText
} from '../../lib/channels/locale-aware-media-alt-text';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runLocaleAwareMediaAltTextTests() {
  const helper = source('lib/channels/locale-aware-media-alt-text.ts');
  const schema = source('prisma/schema.prisma');

  assert.match(schema, /model ProductTranslation[\s\S]*imageAlt\s+String\?/);
  assert.match(schema, /model CategoryTranslation[\s\S]*imageAlt\s+String\?/);
  assert.match(schema, /model Media[\s\S]*alt\s+String/);

  assert.match(helper, /export type LocaleAwareMediaAltTranslation/);
  assert.match(helper, /export type LocaleAwareMediaAltInput/);
  assert.match(helper, /export type LocaleAwareMediaAltSource/);
  assert.match(helper, /'translation' \| 'fallback_translation' \| 'media' \| 'title' \| 'empty'/);
  assert.match(helper, /export const DEFAULT_MEDIA_ALT_FALLBACK_LOCALE = 'fa-IR'/);
  assert.match(helper, /export const MAX_MEDIA_ALT_TEXT_LENGTH = 160/);
  assert.match(helper, /export function normalizeLocaleAwareMediaAltLocale/);
  assert.match(helper, /locale\.replace\('_', '-'\)/);
  assert.match(helper, /export function normalizeLocaleAwareMediaAltText/);
  assert.match(helper, /alt\.slice\(0, MAX_MEDIA_ALT_TEXT_LENGTH\)/);
  assert.match(helper, /translation\.isPublished !== false/);
  assert.match(helper, /export function resolveLocaleAwareMediaAltText/);
  assert.match(helper, /source: 'empty'/);
  assert.match(helper, /export function buildLocaleAwareMediaAltTextMap/);

  assert.equal(normalizeLocaleAwareMediaAltLocale(' fa_IR '), 'fa-IR');
  assert.equal(normalizeLocaleAwareMediaAltText('  Fresh   rose bouquet  '), 'Fresh rose bouquet');
  assert.equal(normalizeLocaleAwareMediaAltText('x'.repeat(200))?.length, 160);

  const translated = resolveLocaleAwareMediaAltText({
    locale: 'en_US',
    mediaAlt: 'Base media alt',
    entityTitle: 'Base title',
    translations: [
      {
        locale: 'en-US',
        imageAlt: ' English rose bouquet image ',
        title: 'English title',
        isPublished: true
      },
      {
        locale: 'fa-IR',
        imageAlt: 'تصویر دسته گل رز',
        title: 'عنوان فارسی',
        isPublished: true
      }
    ]
  });

  assert.equal(translated.alt, 'English rose bouquet image');
  assert.equal(translated.locale, 'en-US');
  assert.equal(translated.source, 'translation');
  assert.equal(translated.translationLocale, 'en-US');

  const fallbackTranslated = resolveLocaleAwareMediaAltText({
    locale: 'fr-CA',
    fallbackLocale: 'fa_IR',
    mediaAlt: 'Base media alt',
    entityTitle: 'Base title',
    translations: [
      {
        locale: 'fa-IR',
        imageAlt: 'تصویر دسته گل رز',
        title: 'عنوان فارسی',
        isPublished: true
      }
    ]
  });

  assert.equal(fallbackTranslated.alt, 'تصویر دسته گل رز');
  assert.equal(fallbackTranslated.locale, 'fr-CA');
  assert.equal(fallbackTranslated.source, 'fallback_translation');
  assert.equal(fallbackTranslated.translationLocale, 'fa-IR');

  const baseMedia = resolveLocaleAwareMediaAltText({
    locale: 'en-US',
    mediaAlt: 'Base media alt',
    entityTitle: 'Base title',
    translations: [
      {
        locale: 'en-US',
        imageAlt: 'Ignored draft alt',
        title: 'Ignored draft title',
        isPublished: false
      }
    ]
  });

  assert.equal(baseMedia.alt, 'Base media alt');
  assert.equal(baseMedia.source, 'media');
  assert.equal(baseMedia.translationLocale, null);

  const titleFallback = resolveLocaleAwareMediaAltText({
    locale: 'en-US',
    entityTitle: 'Fallback title',
    translations: [
      {
        locale: 'en-US',
        title: 'Localized title',
        isPublished: true
      }
    ]
  });

  assert.equal(titleFallback.alt, 'Localized title');
  assert.equal(titleFallback.source, 'title');
  assert.equal(titleFallback.translationLocale, 'en-US');

  const empty = resolveLocaleAwareMediaAltText({
    locale: 'en-US',
    translations: []
  });

  assert.equal(empty.alt, '');
  assert.equal(empty.source, 'empty');

  const altMap = buildLocaleAwareMediaAltTextMap(
    {
      mediaAlt: 'Base media alt',
      translations: [
        {
          locale: 'fa-IR',
          imageAlt: 'تصویر فارسی',
          isPublished: true
        }
      ]
    },
    ['fa_IR', 'en-US', null]
  );

  assert.equal(altMap['fa-IR'].source, 'translation');
  assert.equal(altMap['en-US'].source, 'fallback_translation');
  assert.equal(altMap['en-US'].alt, 'تصویر فارسی');

  console.log('locale-aware-media-alt-text.test.ts passed');
}
