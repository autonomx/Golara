import 'server-only';

import type { Prisma } from '@prisma/client';
import { recordAdminAuditLog } from '@/lib/admin-audit-log';
import { readWithSeedFallback } from '@/lib/cms/repository-fallback-policy';
import { prisma } from '@/lib/prisma';

export const PROMOTION_AUDIT_ACTIONS = [
  'promotion.discount.create',
  'promotion.voucher.create',
  'promotion.eligibility.create',
  'promotion.store_credit.create'
] as const;

export const PROMOTION_AUDIT_ENTITIES = [
  'promotionDiscount',
  'promotionVoucher',
  'promotionEligibilityRule',
  'promotionStoreCredit'
] as const;

export type PromotionAuditAction = (typeof PROMOTION_AUDIT_ACTIONS)[number];
export type PromotionAuditEntity = (typeof PROMOTION_AUDIT_ENTITIES)[number];

export type PromotionAuditLogInput = {
  action: string;
  entity: string;
  entityId?: string | null;
  summary: string;
  metadata?: Prisma.InputJsonValue;
};

export type PromotionAuditLogFilters = {
  action?: string | null;
  entity?: string | null;
  entityId?: string | null;
  search?: string | null;
};

export type PromotionAuditLogRecord = {
  id: string;
  action: PromotionAuditAction;
  entity: PromotionAuditEntity;
  entityId: string | null;
  summary: string;
  actorLabel: string;
  actorEmail: string | null;
  actorRole: string;
  actorProvider: string;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
};

function optionalText(value?: string | null) {
  const normalized = value?.trim();
  return normalized || null;
}

export function assertPromotionAuditAction(value: string): PromotionAuditAction {
  const normalized = optionalText(value);
  if (PROMOTION_AUDIT_ACTIONS.includes(normalized as PromotionAuditAction)) {
    return normalized as PromotionAuditAction;
  }
  throw new Error(`Unsupported promotion audit action: ${value}`);
}

export function assertPromotionAuditEntity(value: string): PromotionAuditEntity {
  const normalized = optionalText(value);
  if (PROMOTION_AUDIT_ENTITIES.includes(normalized as PromotionAuditEntity)) {
    return normalized as PromotionAuditEntity;
  }
  throw new Error(`Unsupported promotion audit entity: ${value}`);
}

export function normalizePromotionAuditLogLimit(value?: number | null) {
  if (value === undefined || value === null) return 25;
  const normalized = Math.floor(value);
  return Math.max(1, Math.min(100, normalized));
}

export function normalizePromotionAuditLogInput(input: PromotionAuditLogInput) {
  const summary = optionalText(input.summary);
  if (!summary) throw new Error('Promotion audit summary is required.');

  return {
    action: assertPromotionAuditAction(input.action),
    entity: assertPromotionAuditEntity(input.entity),
    entityId: optionalText(input.entityId),
    summary,
    metadata: input.metadata
  };
}

export function buildPromotionAuditLogWhere(filters: PromotionAuditLogFilters = {}): Prisma.AdminAuditLogWhereInput {
  const where: Prisma.AdminAuditLogWhereInput = {
    action: { in: [...PROMOTION_AUDIT_ACTIONS] }
  };
  const action = optionalText(filters.action);
  const entity = optionalText(filters.entity);
  const entityId = optionalText(filters.entityId);
  const search = optionalText(filters.search);

  if (action) where.action = assertPromotionAuditAction(action);
  if (entity) where.entity = assertPromotionAuditEntity(entity);
  if (entityId) where.entityId = entityId;
  if (search) {
    where.AND = [
      ...(Array.isArray(where.AND) ? where.AND : where.AND ? [where.AND] : []),
      {
        OR: [
          { summary: { contains: search, mode: 'insensitive' } },
          { action: { contains: search, mode: 'insensitive' } },
          { entity: { contains: search, mode: 'insensitive' } },
          { entityId: { contains: search, mode: 'insensitive' } },
          { actorLabel: { contains: search, mode: 'insensitive' } },
          { actorEmail: { contains: search, mode: 'insensitive' } }
        ]
      }
    ];
  }

  return where;
}

function mapPromotionAuditLog(log: PromotionAuditLogRecord): PromotionAuditLogRecord {
  return {
    id: log.id,
    action: assertPromotionAuditAction(log.action),
    entity: assertPromotionAuditEntity(log.entity),
    entityId: log.entityId,
    summary: log.summary,
    actorLabel: log.actorLabel,
    actorEmail: log.actorEmail,
    actorRole: log.actorRole,
    actorProvider: log.actorProvider,
    metadata: log.metadata,
    createdAt: log.createdAt
  };
}

export async function recordPromotionAuditLog(input: PromotionAuditLogInput) {
  const auditLog = normalizePromotionAuditLogInput(input);
  await recordAdminAuditLog({
    action: auditLog.action,
    entity: auditLog.entity,
    entityId: auditLog.entityId ?? undefined,
    summary: auditLog.summary,
    metadata: auditLog.metadata
  });
}

export async function listPromotionAuditLogs(filters: PromotionAuditLogFilters = {}, limit?: number | null): Promise<PromotionAuditLogRecord[]> {
  const safeLimit = normalizePromotionAuditLogLimit(limit);
  return readWithSeedFallback(async () => {
    const logs = await prisma.adminAuditLog.findMany({
      where: buildPromotionAuditLogWhere(filters),
      orderBy: { createdAt: 'desc' },
      take: safeLimit
    });
    return logs.map((log) => mapPromotionAuditLog(log as PromotionAuditLogRecord));
  }, () => [], 'promotion audit log read');
}

export async function listPromotionAuditLogsForEntity(entity: string, entityId?: string | null, limit?: number | null) {
  return listPromotionAuditLogs({ entity, entityId }, limit);
}

export async function listPromotionAuditLogsForAction(action: string, limit?: number | null) {
  return listPromotionAuditLogs({ action }, limit);
}
