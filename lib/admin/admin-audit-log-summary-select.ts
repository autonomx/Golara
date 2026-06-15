import type { Prisma } from '@prisma/client';

export const adminAuditLogSummarySelect = {
  id: true,
  action: true,
  entity: true,
  entityId: true,
  summary: true,
  actorLabel: true,
  actorEmail: true,
  actorRole: true,
  actorProvider: true,
  createdAt: true
} satisfies Prisma.AdminAuditLogSelect;

export type AdminAuditLogSummaryRow = Prisma.AdminAuditLogGetPayload<{
  select: typeof adminAuditLogSummarySelect;
}>;

export const adminAuditLogSummaryExcludedFields = ['metadata', 'actorType'] as const;
