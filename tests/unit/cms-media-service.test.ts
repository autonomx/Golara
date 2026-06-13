import assert from 'node:assert/strict';
import { createCmsMediaService, type CmsMediaRecord } from '../../lib/cms/media-service-core';

type AuditRecord = {
  action: string;
  entity: string;
  entityId: string;
  summary: string;
  metadata?: unknown;
};

function mediaCategoryFromMetadata(metadata: unknown) {
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return 'general';
  const mediaCategory = (metadata as { mediaCategory?: unknown }).mediaCategory;
  return typeof mediaCategory === 'string' ? mediaCategory : 'general';
}

function assertAuditMetadataDoesNotExposeUrl(audit: AuditRecord) {
  const serialized = JSON.stringify(audit.metadata);
  assert.ok(!serialized.includes('https://cdn.example.test/'), `audit metadata must not expose full media URLs: ${serialized}`);
  assert.ok(!serialized.includes('/uploads/rose'), `audit metadata must not expose local media paths: ${serialized}`);
  assert.ok(!Object.prototype.hasOwnProperty.call((audit.metadata ?? {}) as Record<string, unknown>, 'url'), 'audit metadata must not include raw url field');
}

export async function runCmsMediaServiceTests() {
  const audits: AuditRecord[] = [];
  const upserts: unknown[] = [];
  const creates: unknown[] = [];
  const updates: unknown[] = [];
  const categoryUpdates: unknown[] = [];

  const service = createCmsMediaService({
    mediaRepository: {
      async upsert(args) {
        upserts.push(args);
        return {
          id: 'media-url-1',
          url: args.create.url,
          mediaCategory: mediaCategoryFromMetadata(args.create.metadata),
          sourceType: args.create.sourceType,
          storageProvider: args.create.storageProvider
        } satisfies CmsMediaRecord;
      },
      async create(args) {
        creates.push(args);
        return {
          id: 'media-upload-1',
          url: args.data.url,
          mediaCategory: mediaCategoryFromMetadata(args.data.metadata),
          sourceType: args.data.sourceType,
          storageProvider: args.data.storageProvider ?? null
        } satisfies CmsMediaRecord;
      },
      async update(args) {
        updates.push(args);
        return {
          id: args.where.id,
          url: args.data.url,
          mediaCategory: mediaCategoryFromMetadata(args.data.metadata),
          sourceType: 'upload',
          storageProvider: 'cloudinary'
        } satisfies CmsMediaRecord;
      },
      async updateCategory(args) {
        categoryUpdates.push(args);
        return {
          id: args.where.id,
          url: 'https://cdn.example.test/uploads/rose-edited.webp',
          mediaCategory: mediaCategoryFromMetadata(args.data.metadata),
          sourceType: 'upload',
          storageProvider: 'cloudinary'
        } satisfies CmsMediaRecord;
      }
    },
    async auditWriter(input) {
      audits.push(input);
    },
    normalizeUrl(value) {
      return `https://cdn.example.test/${value.replace(/^\/+/, '')}`;
    },
    async uploadStore(file) {
      return {
        url: 'https://cdn.example.test/uploads/rose.webp',
        size: file.size,
        type: file.type,
        provider: 'cloudinary'
      };
    }
  });

  const mediaFromUrl = await service.createFromUrl({ url: '/rose.webp', alt: 'Rose', mediaCategory: 'product' });
  assert.equal(mediaFromUrl.id, 'media-url-1');
  assert.deepEqual(upserts[0], {
    where: { url: 'https://cdn.example.test/rose.webp' },
    create: { url: 'https://cdn.example.test/rose.webp', alt: 'Rose', metadata: { mediaCategory: 'product' }, sourceType: 'external', storageProvider: 'external' },
    update: { alt: 'Rose', metadata: { mediaCategory: 'product' }, sourceType: 'external', storageProvider: 'external' }
  });
  assert.deepEqual(audits[0], {
    action: 'media.upsert_url',
    entity: 'media',
    entityId: 'media-url-1',
    summary: 'Registered media URL: Rose',
    metadata: { urlScope: 'remote', urlScheme: 'https', urlHost: 'cdn.example.test', mediaCategory: 'product', sourceType: 'external', storageProvider: 'external' }
  });

  const file = new File(['hello'], 'rose-original.webp', { type: 'image/webp' });
  const uploadedMedia = await service.upload({ file, alt: 'Uploaded rose', mediaCategory: 'category' });
  assert.equal(uploadedMedia.id, 'media-upload-1');
  assert.deepEqual(creates[0], {
    data: {
      url: 'https://cdn.example.test/uploads/rose.webp',
      alt: 'Uploaded rose',
      sourceType: 'upload',
      storageProvider: 'cloudinary',
      mimeType: 'image/webp',
      sizeBytes: file.size,
      metadata: { originalName: 'rose-original.webp', mediaCategory: 'category' }
    }
  });
  assert.deepEqual(audits[1], {
    action: 'media.upload',
    entity: 'media',
    entityId: 'media-upload-1',
    summary: 'Uploaded media: Uploaded rose',
    metadata: { urlScope: 'remote', urlScheme: 'https', urlHost: 'cdn.example.test', size: file.size, type: 'image/webp', provider: 'cloudinary', mediaCategory: 'category', sourceType: 'upload' }
  });

  const updatedMedia = await service.update({ id: 'media-upload-1', url: '/uploads/rose-edited.webp', alt: 'Edited rose', mediaCategory: 'homepage-banner' });
  assert.equal(updatedMedia.id, 'media-upload-1');
  assert.deepEqual(updates[0], {
    where: { id: 'media-upload-1' },
    data: { url: 'https://cdn.example.test/uploads/rose-edited.webp', alt: 'Edited rose', metadata: { mediaCategory: 'homepage-banner' } }
  });
  assert.deepEqual(audits[2], {
    action: 'media.update',
    entity: 'media',
    entityId: 'media-upload-1',
    summary: 'Updated media: Edited rose',
    metadata: { urlScope: 'remote', urlScheme: 'https', urlHost: 'cdn.example.test', mediaCategory: 'homepage-banner', sourceType: 'upload', storageProvider: 'cloudinary' }
  });

  const categorizedMedia = await service.updateCategory({ id: 'media-upload-1', mediaCategory: 'product' });
  assert.equal(categorizedMedia.mediaCategory, 'product');
  assert.deepEqual(categoryUpdates[0], {
    where: { id: 'media-upload-1' },
    data: { metadata: { mediaCategory: 'product' } }
  });
  assert.deepEqual(audits[3], {
    action: 'media.category.update',
    entity: 'media',
    entityId: 'media-upload-1',
    summary: 'Updated media category: product',
    metadata: { urlScope: 'remote', urlScheme: 'https', urlHost: 'cdn.example.test', mediaCategory: 'product', sourceType: 'upload', storageProvider: 'cloudinary' }
  });

  for (const audit of audits) {
    assertAuditMetadataDoesNotExposeUrl(audit);
  }

  console.log('cms-media-service.test.ts passed');
}
