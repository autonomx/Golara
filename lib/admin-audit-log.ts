import 'server-only';

import type { Prisma } from '@prisma/client';
import { getAdminIdentity } from '@/lib/admin-auth';
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
    const actor = await getAdminIdentity();
    await prisma.adminAuditLog.create({
      data: {
        action: input.action,
        entity: input.entity,
        entityId: input.entityId,
        summary: input.summary,
        actorType: actor.type,
        actorLabel: actor.label,
        actorEmail: actor.email,
        actorRole: actor.role,
        actorProvider: actor.provider,
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
