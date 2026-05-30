import type { MediaStorageProviderName } from '@/lib/media/media-storage-readiness';

export type StoredMediaFileMetadata = {
  url: string;
  size: number;
  type: string;
  provider: MediaStorageProviderName;
};

export function buildUploadedMediaRecordData(input: { storedFile: StoredMediaFileMetadata; alt: string; originalName: string }) {
  return {
    url: input.storedFile.url,
    alt: input.alt,
    sourceType: 'upload',
    storageProvider: input.storedFile.provider,
    mimeType: input.storedFile.type,
    sizeBytes: input.storedFile.size,
    metadata: { originalName: input.originalName }
  };
}
