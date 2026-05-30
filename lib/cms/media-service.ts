import 'server-only';

import { recordAdminAuditLog } from '@/lib/admin-audit-log';
import { normalizeImageUrl, storeMediaUpload } from '@/lib/media/media-storage';
import { buildUploadedMediaRecordData, type StoredMediaFileMetadata } from '@/lib/media/media-upload-record';
import { prisma } from '@/lib/prisma';

export type MediaAuditWriter = typeof recordAdminAuditLog;

type MediaRepository = {
  upsert(args: Parameters<typeof prisma.media.upsert>[0]): ReturnType<typeof prisma.media.upsert>;
  create(args: Parameters<typeof prisma.media.create>[0]): ReturnType<typeof prisma.media.create>;
};

type CmsMediaServiceDeps = {
  mediaRepository: MediaRepository;
  auditWriter: MediaAuditWriter;
  normalizeUrl: (value: string) => string;
  uploadStore: (file: File) => Promise<StoredMediaFileMetadata>;
};

export function createCmsMediaService(deps: CmsMediaServiceDeps) {
  return {
    async createFromUrl(input: { url: string; alt: string }) {
      const url = deps.normalizeUrl(input.url);
      const media = await deps.mediaRepository.upsert({
        where: { url },
        create: { url, alt: input.alt, sourceType: 'external', storageProvider: 'external' },
        update: { alt: input.alt, sourceType: 'external', storageProvider: 'external' }
      });

      await deps.auditWriter({
        action: 'media.upsert_url',
        entity: 'media',
        entityId: media.id,
        summary: `Registered media URL: ${input.alt}`,
        metadata: { url, sourceType: media.sourceType, storageProvider: media.storageProvider }
      });

      return media;
    },

    async upload(input: { file: File; alt: string }) {
      const storedFile = await deps.uploadStore(input.file);
      const media = await deps.mediaRepository.create({
        data: buildUploadedMediaRecordData({ storedFile, alt: input.alt, originalName: input.file.name })
      });

      await deps.auditWriter({
        action: 'media.upload',
        entity: 'media',
        entityId: media.id,
        summary: `Uploaded media: ${input.alt}`,
        metadata: { url: storedFile.url, size: storedFile.size, type: storedFile.type, provider: storedFile.provider, sourceType: media.sourceType }
      });

      return media;
    }
  };
}

export const cmsMediaService = createCmsMediaService({
  mediaRepository: prisma.media,
  auditWriter: recordAdminAuditLog,
  normalizeUrl: normalizeImageUrl,
  uploadStore: storeMediaUpload
});
