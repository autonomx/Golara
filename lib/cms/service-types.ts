import type { Prisma } from '@prisma/client';

export type CmsAuditInput = {
  action: string;
  entity: string;
  entityId: string;
  summary: string;
  metadata?: Prisma.InputJsonValue;
};

export type CmsAuditWriter = (input: CmsAuditInput) => Promise<unknown>;

export type CmsIdentifiedRecord = {
  id: string;
};

export type CmsPublishedRecord = CmsIdentifiedRecord & {
  isPublished: boolean;
};
