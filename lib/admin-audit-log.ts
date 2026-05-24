import 'server-only';

import type { Prisma } from '@prisma/client';
import { hasDatabase, prisma } from '@/lib/prisma';

type AuditLogInput = {
  action: string;
  entity: string;
  entityId?: string;
  summary: string;
  metadata?: Prisma.InputJsonValue;
};

export async function recordAdminAuditLog(input: AuditLogInput) {
  if (!hasDatabase()) return;

  try {
    await prisma.adminAuditLog.create({
      data: {
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        summary: input.summary,
        metadata: input.metadata
      }
    });
  } catch (error) {
    console.warn('[admin-audit] failed to record admin audit log', {
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      error
    });
  }
}
