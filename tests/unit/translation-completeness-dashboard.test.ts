import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  buildTranslationCompletenessDashboard,
  buildTranslationCompletenessDashboardRow,
  normalizeTranslationCompletenessLocales,
  summarizeTranslationCompletenessRows
} from '../../lib/channels/translation-completeness-dashboard';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runTranslationCompletenessDashboardTests() {
  const helper = source('lib/channels/translation-completeness-dashboard.ts');

  assert.match(helper, /export type TranslationCompletenessEntityType/);
  assert.match(helper, /'ProductTranslation'/);
  assert.match(helper, /'CategoryTranslation'/);
  assert.match(helper, /'HomepageSectionTranslation'/);
  assert.match(helper, /export const DEFAULT_TRANSLATION_COMPLETENESS_LOCALES = \['fa-IR', 'en-US'\]/);
  assert.match(helper, /ProductTranslation: \['title', 'description', 'seoTitle', 'seoDescription'\]/);
  assert.match(helper, /CategoryTranslation: \['title', 'eyebrow', 'description', 'seoTitle', 'seoDescription'\]/);
  assert.match(helper, /HomepageSectionTranslation: \['title', 'body', 'seoTitle', 'seoDescription'\]/);
  assert.match(helper, /export function normalizeTranslationCompletenessLocale/);
  assert.match(helper, /export function normalizeTranslationCompletenessLocales/);
  assert.match(helper, /export function buildTranslationCompletenessRow/);
  assert.match(helper, /export function buildTranslationCompletenessDashboardRows/);
  assert.match(helper, /export function summarizeTranslationCompletenessRows/);
  assert.match(helper, /export function buildTranslationCompletenessDashboard/);

  assert.deepEqual(normalizeTranslationCompletenessLocales([' fa_IR ', 'en-US', 'fa-IR', null]), ['fa-IR', 'en-US']);

  const completeProductFa = buildTranslationCompletenessDashboardRow(
    {
      entityType: 'ProductTranslation',
      entityId: 'product-1',
      entityLabel: ' Rose Bouquet ',
      translations: [
        {
          locale: 'fa_IR',
          title: 'دسته گل رز',
          description: 'رز تازه',
          seoTitle: 'رز',
          seoDescription: 'خرید رز'
        }
      ]
    },
    'fa-IR'
  );

  assert.equal(completeProductFa.status, 'complete');
  assert.equal(completeProductFa.completenessPercent, 100);
  assert.deepEqual(completeProductFa.missingFields, []);
  assert.equal(completeProductFa.entityLabel, 'Rose Bouquet');

  const partialCategoryEn = buildTranslationCompletenessDashboardRow(
    {
      entityType: 'CategoryTranslation',
      entityId: 'category-1',
      translations: [
        {
          locale: 'en-US',
          title: 'Wedding flowers',
          eyebrow: 'Events',
          description: '',
          seoTitle: null
        }
      ]
    },
    'en-US'
  );

  assert.equal(partialCategoryEn.status, 'partial');
  assert.equal(partialCategoryEn.completenessPercent, 40);
  assert.deepEqual(partialCategoryEn.presentFields, ['title', 'eyebrow']);
  assert.deepEqual(partialCategoryEn.missingFields, ['description', 'seoTitle', 'seoDescription']);

  const missingHomepageFa = buildTranslationCompletenessDashboardRow(
    {
      entityType: 'HomepageSectionTranslation',
      entityId: 'hero',
      translations: []
    },
    'fa-IR'
  );

  assert.equal(missingHomepageFa.status, 'missing_translation');
  assert.equal(missingHomepageFa.completenessPercent, 0);
  assert.deepEqual(missingHomepageFa.missingFields, ['title', 'body', 'seoTitle', 'seoDescription']);

  const dashboard = buildTranslationCompletenessDashboard(
    [
      {
        entityType: 'ProductTranslation',
        entityId: 'product-1',
        translations: [
          {
            locale: 'fa-IR',
            title: 'دسته گل رز',
            description: 'رز تازه',
            seoTitle: 'رز',
            seoDescription: 'خرید رز'
          },
          {
            locale: 'en-US',
            title: 'Rose bouquet',
            description: 'Fresh roses'
          }
        ]
      },
      {
        entityType: 'HomepageSectionTranslation',
        entityId: 'hero',
        translations: [
          {
            locale: 'en-US',
            title: 'Luxury flowers',
            body: 'Same-day delivery',
            seoTitle: 'Luxury flowers',
            seoDescription: 'Order luxury flowers'
          }
        ]
      }
    ],
    ['fa-IR', 'en-US']
  );

  assert.deepEqual(dashboard.locales, ['fa-IR', 'en-US']);
  assert.equal(dashboard.rows.length, 4);
  assert.ok(dashboard.summary.some((summary) => summary.entityType === 'ProductTranslation' && summary.locale === 'fa-IR'));
  assert.ok(
    dashboard.summary.some(
      (summary) =>
        summary.entityType === 'HomepageSectionTranslation' &&
        summary.locale === 'fa-IR' &&
        summary.missingTranslationEntities === 1 &&
        summary.missingFieldCounts.title === 1
    )
  );

  const productSummary = summarizeTranslationCompletenessRows(
    dashboard.rows.filter((row) => row.entityType === 'ProductTranslation')
  );
  const productEnSummary = productSummary.find((summary) => summary.locale === 'en-US');

  assert.equal(productEnSummary?.totalEntities, 1);
  assert.equal(productEnSummary?.partialEntities, 1);
  assert.equal(productEnSummary?.averageCompletenessPercent, 50);
  assert.equal(productEnSummary?.missingFieldCounts.seoTitle, 1);
  assert.equal(productEnSummary?.missingFieldCounts.seoDescription, 1);

  console.log('translation-completeness-dashboard.test.ts passed');
}
