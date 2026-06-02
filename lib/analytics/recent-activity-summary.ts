import 'server-only';

import { hasDatabase, prisma } from '@/lib/prisma';

export type RecentActivitySource = 'order' | 'customer' | 'admin';

export type RecentActivitySourceRow = {
  id: string;
  source: RecentActivitySource;
  type: string;
  title: string;
  note?: string | null;
  actorLabel?: string | null;
  actorRole?: string | null;
  entityLabel?: string | null;
  createdAt: Date;
};

export type RecentActivityEntry = {
  id: string;
  source: RecentActivitySource;
  type: string;
  title: string;
  note?: string;
  actorLabel: string;
  entityLabel?: string;
  createdAt: Date;
};

export type RecentActivitySummary = {
  entries: RecentActivityEntry[];
  totalActivities: number;
  staffActivities: number;
  systemActivities: number;
  bySource: { source: RecentActivitySource; count: number }[];
  generatedAt: Date;
};

export const EMPTY_RECENT_ACTIVITY_SUMMARY: RecentActivitySummary = {
  entries: [],
  totalActivities: 0,
  staffActivities: 0,
  systemActivities: 0,
  bySource: [],
  generatedAt: new Date(0)
};

function optionalText(value?: string | null) {
  const normalized = value?.trim();
  return normalized || undefined;
}

function normalizeSource(value: string): RecentActivitySource {
  if (value === 'order' || value === 'customer' || value === 'admin') return value;
  return 'admin';
}

function actorLabel(row: Pick<RecentActivitySourceRow, 'actorLabel' | 'actorRole'>) {
  const label = optionalText(row.actorLabel);
  const role = optionalText(row.actorRole);
  if (!label && !role) return 'System activity';
  return role ? `${label ?? 'Admin'} / ${role}` : label ?? 'Admin';
}

function isStaffActivity(row: Pick<RecentActivitySourceRow, 'actorLabel' | 'actorRole'>) {
  return Boolean(optionalText(row.actorLabel) || optionalText(row.actorRole));
}

export function buildRecentActivitySummary(rows: RecentActivitySourceRow[], now = new Date(), limit = 12): RecentActivitySummary {
  const bySource = new Map<RecentActivitySource, number>();
  let staffActivities = 0;
  let systemActivities = 0;

  const entries = rows
    .map((row) => {
      const source = normalizeSource(row.source);
      bySource.set(source, (bySource.get(source) ?? 0) + 1);
      if (isStaffActivity(row)) staffActivities += 1;
      else systemActivities += 1;
      return {
        id: `${source}:${row.id}`,
        source,
        type: row.type,
        title: row.title,
        note: optionalText(row.note),
        actorLabel: actorLabel(row),
        entityLabel: optionalText(row.entityLabel),
        createdAt: row.createdAt
      };
    })
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime() || a.id.localeCompare(b.id));

  const safeLimit = Math.max(1, Math.min(50, Math.floor(limit)));

  return {
    entries: entries.slice(0, safeLimit),
    totalActivities: rows.length,
    staffActivities,
    systemActivities,
    bySource: Array.from(bySource.entries())
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count || a.source.localeCompare(b.source)),
    generatedAt: now
  };
}

export const recentActivitySummaryService = {
  async summary(): Promise<RecentActivitySummary> {
    if (!hasDatabase()) return { ...EMPTY_RECENT_ACTIVITY_SUMMARY, generatedAt: new Date() };

    const [orderEvents, customerEvents, auditLogs] = await Promise.all([
      prisma.checkoutOrderTimelineEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: 25,
        select: {
          id: true,
          type: true,
          title: true,
          note: true,
          actorLabel: true,
          actorRole: true,
          createdAt: true,
          order: { select: { orderNumber: true } }
        }
      }),
      prisma.customerAdminTimelineEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: 25,
        select: {
          id: true,
          type: true,
          title: true,
          note: true,
          actorLabel: true,
          actorRole: true,
          createdAt: true,
          customer: { select: { displayName: true, phone: true } }
        }
      }),
      prisma.adminAuditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 25,
        select: {
          id: true,
          action: true,
          entity: true,
          entityId: true,
          summary: true,
          actorLabel: true,
          actorRole: true,
          createdAt: true
        }
      })
    ]);

    return buildRecentActivitySummary([
      ...orderEvents.map((event) => ({
        id: event.id,
        source: 'order' as const,
        type: event.type,
        title: event.title,
        note: event.note,
        actorLabel: event.actorLabel,
        actorRole: event.actorRole,
        entityLabel: event.order.orderNumber,
        createdAt: event.createdAt
      })),
      ...customerEvents.map((event) => ({
        id: event.id,
        source: 'customer' as const,
        type: event.type,
        title: event.title,
        note: event.note,
        actorLabel: event.actorLabel,
        actorRole: event.actorRole,
        entityLabel: event.customer.displayName ?? event.customer.phone,
        createdAt: event.createdAt
      })),
      ...auditLogs.map((log) => ({
        id: log.id,
        source: 'admin' as const,
        type: log.action,
        title: log.summary,
        actorLabel: log.actorLabel,
        actorRole: log.actorRole,
        entityLabel: log.entityId ? `${log.entity}:${log.entityId}` : log.entity,
        createdAt: log.createdAt
      }))
    ]);
  }
};
