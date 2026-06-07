import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { createCmsProductService, type CmsProductRecord, type CmsProductTranslationRecord } from '../../lib/cms/product-service-core';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

type AuditRecord = {
  action: string;
  entity: string;
  entityId: string;
  summary: string;
  metadata?: unknown;
};

const productInput = {
  title: 'Rose Bouquet',
  slug: 'rose-bouquet',
  code: 'ROSE-001',
  description: 'A premium rose bouquet.',
  priceCents: 12900,
  currency: 'CAD',
  imageUrl: 'https://cdn.example.test/rose-bouquet.webp',
  categoryId: 'category-1',
  availableToday: true,
  bestSeller: true,
  requiresQuote: false,
  isActive: true,
  sortOrder: 5
};

export async function runCmsProductServiceTests() {
  const audits: AuditRecord[] = [];
  const creates: unknown[] = [];
  const updates: unknown[] = [];
  const translationUpserts: unknown[] = [];

  const service = createCmsProductService({
    productRepository: {
      async create(args) {
        creates.push(args);
        return {
          id: 'product-1',
          title: args.data.title,
          slug: args.data.slug,
          code: args.data.code,
          categoryId: args.data.categoryId,
          priceCents: args.data.priceCents,
          isActive: args.data.isActive
        } satisfies CmsProductRecord;
      },
      async update(args) {
        updates.push(args);
        return {
          id: args.where.id,
          title: args.data.title,
          slug: args.data.slug,
          code: args.data.code,
          categoryId: args.data.categoryId,
          priceCents: args.data.priceCents,
          isActive: args.data.isActive
        } satisfies CmsProductRecord;
      }
    },
    productTranslationRepository: {
      async upsert(args) {
        translationUpserts.push(args);
        return {
          id: 'product-translation-1',
          isPublished: args.create.isPublished
        } satisfies CmsProductTranslationRecord;
      }
    },
    async auditWriter(input) {
      audits.push(input);
    }
  });

  const created = await service.create(productInput);
  assert.equal(created.id, 'product-1');
  assert.deepEqual(creates[0], { data: productInput });
  assert.deepEqual(audits[0], {
    action: 'product.create',
    entity: 'product',
    entityId: 'product-1',
    summary: 'Created product: Rose Bouquet',
    metadata: { slug: 'rose-bouquet', code: 'ROSE-001', categoryId: 'category-1', priceCents: 12900, isActive: true }
  });

  const updatedInput = { ...productInput, title: 'Garden Rose Bouquet', slug: 'garden-rose-bouquet', code: 'ROSE-002', priceCents: 14900, isActive: false };
  const updated = await service.update('product-1', updatedInput);
  assert.equal(updated.title, 'Garden Rose Bouquet');
  assert.deepEqual(updates[0], { where: { id: 'product-1' }, data: updatedInput });
  assert.deepEqual(audits[1], {
    action: 'product.update',
    entity: 'product',
    entityId: 'product-1',
    summary: 'Updated product: Garden Rose Bouquet',
    metadata: { slug: 'garden-rose-bouquet', code: 'ROSE-002', categoryId: 'category-1', priceCents: 14900, isActive: false }
  });

  const translation = await service.upsertTranslation({
    productId: 'product-1',
    locale: 'fa-IR',
    title: 'دسته گل رز',
    description: 'دسته گل رز ممتاز.',
    imageAlt: 'دسته گل رز قرمز',
    isPublished: true
  });
  assert.equal(translation.id, 'product-translation-1');
  assert.deepEqual(translationUpserts[0], {
    where: { productId_locale: { productId: 'product-1', locale: 'fa-IR' } },
    create: {
      productId: 'product-1',
      locale: 'fa-IR',
      title: 'دسته گل رز',
      description: 'دسته گل رز ممتاز.',
      imageAlt: 'دسته گل رز قرمز',
      isPublished: true
    },
    update: {
      title: 'دسته گل رز',
      description: 'دسته گل رز ممتاز.',
      imageAlt: 'دسته گل رز قرمز',
      isPublished: true
    }
  });
  assert.deepEqual(audits[2], {
    action: 'product.translation.upsert',
    entity: 'product',
    entityId: 'product-1',
    summary: 'Saved product translation: fa-IR',
    metadata: { locale: 'fa-IR', translationId: 'product-translation-1', isPublished: true }
  });

  const repository = source('lib/cms/catalog-repository.ts');
  assert.ok(repository.includes('function buildInquiryWhere(status?: string, search?: string)'));
  assert.ok(repository.includes('function buildAuditLogWhere(filters: AdminAuditLogFilters = {})'));
  assert.ok(repository.includes('function mapProductVariantLocationStocks(stocks?: DbProductVariantLocationStock[])'));
  assert.ok(repository.includes('availableQuantity: Math.max(0, stock.quantity - stock.reservedQuantity)'));
  assert.ok(repository.includes('function stringArrayFromJson(value: Prisma.JsonValue | null | undefined)'));
  assert.ok(repository.includes('function mapProduct(product: DbProduct, options: CatalogReadOptions = {}): Product'));
  assert.ok(repository.includes('const image = product.imageUrl || product.images?.[0]?.url || FALLBACK_IMAGE'));
  assert.ok(repository.includes('requiresQuote: product.requiresQuote || product.priceCents <= 0'));
  assert.ok(repository.includes('function mapInquiry(inquiry: DbInquiry): CustomerInquiry'));
  assert.ok(repository.includes('function localizedHomepageContent(section:'));

  console.log('cms-product-service.test.ts passed');
}
