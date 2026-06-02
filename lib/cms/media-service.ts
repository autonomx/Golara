import 'server-only';

import type { Prisma } from '@prisma/client';
import { recordAdminAuditLog } from '@/lib/admin-audit-log';
import { createCmsMediaService, type CmsMediaRecord, type MediaCreateArgs, type MediaUpdateArgs, type MediaUpdateCategoryArgs, type MediaUpsertArgs } from '@/lib/cms/media-service-core';
import { normalizeImageUrl, storeMediaUpload } from '@/lib/media/media-storage';
import { prisma } from '@/lib/prisma';

export { createCmsMediaService } from '@/lib/cms/media-service-core';

function metadataObject(value: Prisma.JsonValue | null | undefined): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function mediaCategoryFromMetadata(value: Prisma.JsonValue | null | undefined) {
  const mediaCategory = metadataObject(value).mediaCategory;
  return typeof mediaCategory === 'string' ? mediaCategory : 'general';
}

function toCmsMediaRecord(media: { id: string; url: string; metadata: Prisma.JsonValue | null; sourceType: string; storageProvider: string | null }): CmsMediaRecord {
  return {
    id: media.id,
    url: media.url,
    mediaCategory: mediaCategoryFromMetadata(media.metadata),
    sourceType: media.sourceType,
    storageProvider: media.storageProvider
  };
}

async function mergedMetadata(mediaId: string, metadata: Prisma.InputJsonValue): Promise<Prisma.InputJsonValue> {
  const current = await prisma.media.findUnique({ where: { id: mediaId }, select: { metadata: true } });
  return { ...metadataObject(current?.metadata), ...metadataObject(metadata as Prisma.JsonValue) } as Prisma.InputJsonObject;
}

const mediaRepository = {
  async upsert(args: MediaUpsertArgs): Promise<CmsMediaRecord> {
    return toCmsMediaRecord(await prisma.media.upsert(args));
  },
  async create(args: MediaCreateArgs): Promise<CmsMediaRecord> {
    return toCmsMediaRecord(await prisma.media.create(args));
  },
  async update(args: MediaUpdateArgs): Promise<CmsMediaRecord> {
    return toCmsMediaRecord(await prisma.media.update({ ...args, data: { ...args.data, metadata: await mergedMetadata(args.where.id, args.data.metadata) } }));
  },
  async updateCategory(args: MediaUpdateCategoryArgs): Promise<CmsMediaRecord> {
    return toCmsMediaRecord(await prisma.media.update({ ...args, data: { metadata: await mergedMetadata(args.where.id, args.data.metadata) } }));
  }
};

export const cmsMediaService = createCmsMediaService({
  mediaRepository,
  auditWriter: recordAdminAuditLog,
  normalizeUrl: normalizeImageUrl,
  uploadStore: storeMediaUpload
});
