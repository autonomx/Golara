import assert from 'node:assert/strict';
import { createCmsMediaService, type CmsMediaRecord } from '../../lib/cms/media-service-core';

type AuditRecord = {
  action: string;
  entity: string;
  entityId: string;
  summary: string;
  metadata?: unknown;
};

export async function runCmsMediaServiceTests() {
  const audits: AuditRecord[] = [];
  const upserts: unknown[] = [];
  const creates: unknown[] = [];

  const service = createCmsMediaService({
    mediaRepository: {
      async upsert(args) {
        upserts.push(args);
        return {
          id: 'media-url-1',
          url: args.create.url,
          sourceType: args.create.sourceType,
          storageProvider: args.create.storageProvider
        } satisfies CmsMediaRecord;
      },
      async create(args) {
        creates.push(args);
        return {
          id: 'media-upload-1',
          url: args.data.url,
          sourceType: args.data.sourceType,
          storageProvider: args.data.storageProvider ?? null
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

  const mediaFromUrl = await service.createFromUrl({ url: '/rose.webp', alt: 'Rose' });
  assert.equal(mediaFromUrl.id, 'media-url-1');
  assert.deepEqual(upserts[0], {
    where: { url: 'https://cdn.example.test/rose.webp' },
    create: { url: 'https://cdn.example.test/rose.webp', alt: 'Rose', sourceType: 'external', storageProvider: 'external' },
    update: { alt: 'Rose', sourceType: 'external', storageProvider: 'external' }
  });
  assert.deepEqual(audits[0], {
    action: 'media.upsert_url',
    entity: 'media',
    entityId: 'media-url-1',
    summary: 'Registered media URL: Rose',
    metadata: { url: 'https://cdn.example.test/rose.webp', sourceType: 'external', storageProvider: 'external' }
  });

  const file = new File(['hello'], 'rose-original.webp', { type: 'image/webp' });
  const uploadedMedia = await service.upload({ file, alt: 'Uploaded rose' });
  assert.equal(uploadedMedia.id, 'media-upload-1');
  assert.deepEqual(creates[0], {
    data: {
      url: 'https://cdn.example.test/uploads/rose.webp',
      alt: 'Uploaded rose',
      sourceType: 'upload',
      storageProvider: 'cloudinary',
      mimeType: 'image/webp',
      sizeBytes: file.size,
      metadata: { originalName: 'rose-original.webp' }
    }
  });
  assert.deepEqual(audits[1], {
    action: 'media.upload',
    entity: 'media',
    entityId: 'media-upload-1',
    summary: 'Uploaded media: Uploaded rose',
    metadata: { url: 'https://cdn.example.test/uploads/rose.webp', size: file.size, type: 'image/webp', provider: 'cloudinary', sourceType: 'upload' }
  });

  console.log('cms-media-service.test.ts passed');
}
