import { buildUploadedMediaRecordData, type StoredMediaFileMetadata } from '@/lib/media/media-upload-record';

type MediaAuditInput = {
  action: string;
  entity: string;
  entityId: string;
  summary: string;
  metadata?: Record<string, unknown>;
};

export type MediaAuditWriter = (input: MediaAuditInput) => Promise<unknown>;

export type CmsMediaRecord = {
  id: string;
  url: string;
  sourceType: string;
  storageProvider: string | null;
};

type MediaRepository = {
  upsert(args: {
    where: { url: string };
    create: { url: string; alt: string; sourceType: string; storageProvider: string };
    update: { alt: string; sourceType: string; storageProvider: string };
  }): Promise<CmsMediaRecord>;
  create(args: {
    data: ReturnType<typeof buildUploadedMediaRecordData>;
  }): Promise<CmsMediaRecord>;
};

export type CmsMediaServiceDeps = {
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
