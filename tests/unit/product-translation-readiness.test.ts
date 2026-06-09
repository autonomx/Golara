import assert from 'node:assert/strict';
import { productTranslationReadinessIssues } from '../../lib/catalog/product-translation-readiness';

export async function runProductTranslationReadinessTests() {
  const issues = productTranslationReadinessIssues([
    {
      id: 'product-1',
      slug: 'complete-product',
      title: 'Complete product',
      translations: [
        { locale: 'fa-IR', title: 'محصول کامل', description: 'توضیح کامل', isPublished: true },
        { locale: 'en-CA', title: 'Complete product', description: 'Complete description', isPublished: true }
      ]
    },
    {
      id: 'product-2',
      slug: 'missing-persian',
      title: 'Missing Persian',
      translations: [{ locale: 'en-CA', title: 'Missing Persian', description: 'English copy', isPublished: true }]
    },
    {
      id: 'product-3',
      slug: 'draft-english',
      title: 'Draft English',
      translations: [
        { locale: 'fa-IR', title: 'انگلیسی پیش‌نویس', description: 'کپی فارسی', isPublished: true },
        { locale: 'en-CA', title: 'Draft English', description: 'Draft copy', isPublished: false }
      ]
    },
    {
      id: 'product-4',
      slug: 'incomplete-persian',
      title: 'Incomplete Persian',
      translations: [
        { locale: 'fa-IR', title: 'فارسی ناقص', description: '', isPublished: true },
        { locale: 'en-CA', title: 'Incomplete Persian', description: 'English copy', isPublished: true }
      ]
    },
    {
      id: 'product-5',
      slug: 'inactive-product',
      title: 'Inactive product',
      isActive: false,
      translations: []
    }
  ]);

  assert.deepEqual(
    issues.map((issue) => ({ slug: issue.slug, locale: issue.locale, status: issue.status, missingFields: issue.missingFields })),
    [
      { slug: 'missing-persian', locale: 'fa-IR', status: 'missing', missingFields: ['title', 'description'] },
      { slug: 'draft-english', locale: 'en-CA', status: 'draft', missingFields: [] },
      { slug: 'incomplete-persian', locale: 'fa-IR', status: 'incomplete', missingFields: ['description'] }
    ]
  );

  console.log('product-translation-readiness.test.ts passed');
}
