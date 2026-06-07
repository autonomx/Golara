import assert from 'node:assert/strict';
import {
  getCategoryBySlug,
  getHomepageContent,
  getProductBySlug,
  listAdminAuditLogs,
  listAdminCategories,
  listAdminCollections,
  listAdminFulfillmentMethodSettings,
  listAdminProductAttributes,
  listAdminProductTypes,
  listAdminProducts,
  listAdminWarehouseLocations,
  listCategories,
  listHomepageCategories,
  listInquiries,
  listInquiryPage,
  listInquiryStatusCounts,
  listMedia,
  listProducts,
  listProductsByCategorySlug
} from '../../lib/cms/catalog-repository';
import { createCmsCategoryService, type CmsCategoryRecord, type CmsCategoryTranslationRecord } from '../../lib/cms/category-service-core';

type AuditRecord = {
  action: string;
  entity: string;
  entityId: string;
  summary: string;
  metadata?: unknown;
};

const categoryInput = {
  title: 'Roses',
  slug: 'roses',
  eyebrow: 'Fresh stems',
  description: 'Premium rose arrangements.',
  imageUrl: 'https://cdn.example.test/roses.webp',
  parentId: null,
  showOnHomepage: true,
  sortOrder: 10,
  isActive: true
};

async function withoutDatabaseUrl<T>(run: () => Promise<T>) {
  const originalDatabaseUrl = process.env.DATABASE_URL;
  delete process.env.DATABASE_URL;
  try {
    return await run();
  } finally {
    if (originalDatabaseUrl) process.env.DATABASE_URL = originalDatabaseUrl;
    else delete process.env.DATABASE_URL;
  }
}

export async function runCmsCategoryServiceTests() {
  const audits: AuditRecord[] = [];
  const creates: unknown[] = [];
  const updates: unknown[] = [];
  const translationUpserts: unknown[] = [];

  const service = createCmsCategoryService({
    categoryRepository: {
      async create(args) {
        creates.push(args);
        return {
          id: 'category-1',
          title: args.data.title,
          slug: args.data.slug,
          isActive: args.data.isActive,
          parentId: args.data.parentId,
          showOnHomepage: args.data.showOnHomepage
        } satisfies CmsCategoryRecord;
      },
      async update(args) {
        updates.push(args);
        return {
          id: args.where.id,
          title: args.data.title,
          slug: args.data.slug,
          isActive: args.data.isActive,
          parentId: args.data.parentId,
          showOnHomepage: args.data.showOnHomepage
        } satisfies CmsCategoryRecord;
      }
    },
    categoryTranslationRepository: {
      async upsert(args) {
        translationUpserts.push(args);
        return {
          id: 'translation-1',
          isPublished: args.create.isPublished
        } satisfies CmsCategoryTranslationRecord;
      }
    },
    async auditWriter(input) {
      audits.push(input);
    }
  });

  const created = await service.create(categoryInput);
  assert.equal(created.id, 'category-1');
  assert.deepEqual(creates[0], { data: categoryInput });
  assert.deepEqual(audits[0], {
    action: 'category.create',
    entity: 'category',
    entityId: 'category-1',
    summary: 'Created category: Roses',
    metadata: { slug: 'roses', isActive: true, parentId: null, showOnHomepage: true }
  });

  const updatedInput = { ...categoryInput, title: 'Garden Roses', slug: 'garden-roses', parentId: 'parent-1', showOnHomepage: false };
  const updated = await service.update('category-1', updatedInput);
  assert.equal(updated.title, 'Garden Roses');
  assert.deepEqual(updates[0], { where: { id: 'category-1' }, data: updatedInput });
  assert.deepEqual(audits[1], {
    action: 'category.update',
    entity: 'category',
    entityId: 'category-1',
    summary: 'Updated category: Garden Roses',
    metadata: { slug: 'garden-roses', isActive: true, parentId: 'parent-1', showOnHomepage: false }
  });

  const translation = await service.upsertTranslation({
    categoryId: 'category-1',
    locale: 'fa-IR',
    title: 'رزها',
    eyebrow: 'شاخه‌های تازه',
    description: 'چیدمان رز ممتاز.',
    imageAlt: 'رزهای قرمز',
    isPublished: true
  });
  assert.equal(translation.id, 'translation-1');
  assert.deepEqual(translationUpserts[0], {
    where: { categoryId_locale: { categoryId: 'category-1', locale: 'fa-IR' } },
    create: {
      categoryId: 'category-1',
      locale: 'fa-IR',
      title: 'رزها',
      eyebrow: 'شاخه‌های تازه',
      description: 'چیدمان رز ممتاز.',
      imageAlt: 'رزهای قرمز',
      isPublished: true
    },
    update: {
      title: 'رزها',
      eyebrow: 'شاخه‌های تازه',
      description: 'چیدمان رز ممتاز.',
      imageAlt: 'رزهای قرمز',
      isPublished: true
    }
  });
  assert.deepEqual(audits[2], {
    action: 'category.translation.upsert',
    entity: 'category',
    entityId: 'category-1',
    summary: 'Saved category translation: fa-IR',
    metadata: { locale: 'fa-IR', translationId: 'translation-1', isPublished: true }
  });

  await withoutDatabaseUrl(async () => {
    const categories = await listCategories();
    assert.ok(categories.length > 0);
    assert.equal(categories[0]?.slug, 'available-today');
    assert.ok(categories.every((category) => category.isActive !== false));
    assert.equal((await getCategoryBySlug('available-today'))?.slug, 'available-today');
    assert.equal(await getCategoryBySlug('missing-category'), undefined);
    assert.ok((await listHomepageCategories()).every((category) => category.showOnHomepage !== false));
    assert.ok((await listAdminCategories()).some((category) => category.slug === 'woshe-distance'));

    const products = await listProducts();
    assert.ok(products.length > 0);
    assert.equal(products[0]?.isActive, true);
    assert.equal((await getProductBySlug('vip-box-blue'))?.slug, 'vip-box-blue');
    assert.equal(await getProductBySlug('missing-product'), undefined);
    assert.ok((await listProductsByCategorySlug('vip-boxes')).every((product) => product.category === 'vip-boxes'));
    assert.ok((await listAdminProducts()).some((product) => product.slug === 'vip-box-blue'));

    const homepage = await getHomepageContent();
    assert.equal(homepage.title, 'Flowers for moments worth keeping.');
    const media = await listMedia();
    assert.ok(media.length > 0);
    assert.ok(media.every((item) => item.url && item.alt));
    assert.deepEqual(await listAdminAuditLogs({ search: 'anything' }, 500), []);
    assert.deepEqual(await listInquiries('new', 'customer'), []);
    assert.deepEqual(await listInquiryStatusCounts('customer'), [
      { status: 'new', count: 0 },
      { status: 'contacted', count: 0 },
      { status: 'confirmed', count: 0 },
      { status: 'fulfilled', count: 0 },
      { status: 'cancelled', count: 0 }
    ]);
    assert.deepEqual(await listInquiryPage('new', Number.NaN, 500, 'customer'), {
      inquiries: [],
      total: 0,
      page: 1,
      pageSize: 50,
      pageCount: 1
    });
    assert.deepEqual(await listAdminProductTypes(), []);
    assert.deepEqual(await listAdminProductAttributes(), []);
    assert.deepEqual(await listAdminCollections(), []);
    assert.deepEqual(await listAdminWarehouseLocations(), []);
    assert.ok((await listAdminFulfillmentMethodSettings()).length > 0);
  });

  console.log('cms-category-service.test.ts passed');
}
