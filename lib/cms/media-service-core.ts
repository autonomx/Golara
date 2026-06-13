import { buildUploadedMediaRecordData, type StoredMediaFileMetadata } from '@/lib/media/media-upload-record';
import type { Prisma } from '@prisma/client';
import type { CmsAuditWriter, CmsIdentifiedRecord } from '@/lib/cms/service-types';

export type CmsMediaRecord = CmsIdentifiedRecord & {
  url: string;
  mediaCategory: string;
  sourceType: string;
  storageProvider: string | null;
};

export type MediaUpsertArgs = {
  where: { url: string };
  create: { url: string; alt: string; metadata: Prisma.InputJsonValue; sourceType: string; storageProvider: string };
  update: { alt: string; metadata: Prisma.InputJsonValue; sourceType: string; storageProvider: string };
};

export type MediaCreateArgs = {
  data: ReturnType<typeof buildUploadedMediaRecordData>;
};

export type MediaUpdateArgs = {
  where: { id: string };
  data: { url: string; alt: string; metadata: Prisma.InputJsonValue };
};

export type MediaUpdateCategoryArgs = {
  where: { id: string };
  data: { metadata: Prisma.InputJsonValue };
};

type MediaRepository = {
  upsert(args: MediaUpsertArgs): Promise<CmsMediaRecord>;
  create(args: MediaCreateArgs): Promise<CmsMediaRecord>;
  update(args: MediaUpdateArgs): Promise<CmsMediaRecord>;
  updateCategory(args: MediaUpdateCategoryArgs): Promise<CmsMediaRecord>;
};

export type CmsMediaServiceDeps = {
  mediaRepository: MediaRepository;
  auditWriter: CmsAuditWriter;
  normalizeUrl: (value: string) => string;
  uploadStore: (file: File) => Promise<StoredMediaFileMetadata>;
};

const MEDIA_CATEGORY_VALUES = new Set(['product', 'category', 'homepage-banner', 'homepage-category', 'homepage-best-seller', 'general']);

function normalizeMediaCategory(value?: string) {
  const normalized = value?.trim().toLowerCase();
  return normalized && MEDIA_CATEGORY_VALUES.has(normalized) ? normalized : 'general';
}

function mediaCategoryMetadata(mediaCategory: string): Prisma.InputJsonValue {
  return { mediaCategory };
}

function auditUrlMetadata(url: string): Prisma.InputJsonObject {
  if (url.startsWith('/uploads/')) {
    return { urlScope: 'local_upload' };
  }

  try {
    const parsed = new URL(url);
    return { urlScope: 'remote', urlScheme: parsed.protocol.replace(/:$/, ''), urlHost: parsed.hostname };
  } catch {
    return { urlScope: 'unknown' };
  }
}

export function createCmsMediaService(deps: CmsMediaServiceDeps) {
  return {
    async createFromUrl(input: { url: string; alt: string; mediaCategory?: string }) {
      const url = deps.normalizeUrl(input.url);
      const mediaCategory = normalizeMediaCategory(input.mediaCategory);
      const media = await deps.mediaRepository.upsert({
        where: { url },
        create: { url, alt: input.alt, metadata: mediaCategoryMetadata(mediaCategory), sourceType: 'external', storageProvider: 'external' },
        update: { alt: input.alt, metadata: mediaCategoryMetadata(mediaCategory), sourceType: 'external', storageProvider: 'external' }
      });

      await deps.auditWriter({
        action: 'media.upsert_url',
        entity: 'media',
        entityId: media.id,
        summary: `Registered media URL: ${input.alt}`,
        metadata: { ...auditUrlMetadata(url), mediaCategory: media.mediaCategory, sourceType: media.sourceType, storageProvider: media.storageProvider }
      });

      return media;
    },

    async upload(input: { file: File; alt: string; mediaCategory?: string }) {
      const storedFile = await deps.uploadStore(input.file);
      const mediaCategory = normalizeMediaCategory(input.mediaCategory);
      const media = await deps.mediaRepository.create({
        data: buildUploadedMediaRecordData({ storedFile, alt: input.alt, originalName: input.file.name, mediaCategory })
      });

      await deps.auditWriter({
        action: 'media.upload',
        entity: 'media',
        entityId: media.id,
        summary: `Uploaded media: ${input.alt}`,
        metadata: { ...auditUrlMetadata(storedFile.url), size: storedFile.size, type: storedFile.type, provider: storedFile.provider, mediaCategory: media.mediaCategory, sourceType: media.sourceType }
      });

      return media;
    },

    async update(input: { id: string; url: string; alt: string; mediaCategory?: string }) {
      const url = deps.normalizeUrl(input.url);
      const mediaCategory = normalizeMediaCategory(input.mediaCategory);
      const media = await deps.mediaRepository.update({
        where: { id: input.id },
        data: { url, alt: input.alt, metadata: mediaCategoryMetadata(mediaCategory) }
      });

      await deps.auditWriter({
        action: 'media.update',
        entity: 'media',
        entityId: media.id,
        summary: `Updated media: ${input.alt}`,
        metadata: { ...auditUrlMetadata(url), mediaCategory: media.mediaCategory, sourceType: media.sourceType, storageProvider: media.storageProvider }
      });

      return media;
    },

    async updateCategory(input: { id: string; mediaCategory?: string }) {
      const mediaCategory = normalizeMediaCategory(input.mediaCategory);
      const media = await deps.mediaRepository.updateCategory({
        where: { id: input.id },
        data: { metadata: mediaCategoryMetadata(mediaCategory) }
      });

      await deps.auditWriter({
        action: 'media.category.update',
        entity: 'media',
        entityId: media.id,
        summary: `Updated media category: ${mediaCategory}`,
        metadata: { ...auditUrlMetadata(media.url), mediaCategory: media.mediaCategory, sourceType: media.sourceType, storageProvider: media.storageProvider }
      });

      return media;
    }
  };
}
