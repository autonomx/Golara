import 'server-only';

import { hasDatabase, prisma } from '@/lib/prisma';

export const SITE_ANALYTICS_RAW_EVENT_RETENTION_DAYS = 180;

const DAY_MS = 24 * 60 * 60 * 1000;

export type SiteAnalyticsRetentionSummary = {
  databaseConfigured: boolean;
  tableAvailable: boolean;
  retentionDays: number;
  cutoffAt: Date;
  totalEventCount: number;
  retainedEventCount: number;
  staleEventCount: number;
  oldestEventAt: Date | null;
  newestEventAt: Date | null;
  generatedAt: Date;
};

type RawSiteAnalyticsRetentionRow = {
  totalEventCount?: number | bigint | string | null;
  retainedEventCount?: number | bigint | string | null;
  staleEventCount?: number | bigint | string | null;
  oldestEventAt?: Date | string | null;
  newestEventAt?: Date | string | null;
};

function retentionCutoff(now: Date, retentionDays = SITE_ANALYTICS_RAW_EVENT_RETENTION_DAYS) {
  return new Date(now.getTime() - retentionDays * DAY_MS);
}

export function emptySiteAnalyticsRetentionSummary(now = new Date(), retentionDays = SITE_ANALYTICS_RAW_EVENT_RETENTION_DAYS): SiteAnalyticsRetentionSummary {
  return {
    databaseConfigured: false,
    tableAvailable: false,
    retentionDays,
    cutoffAt: retentionCutoff(now, retentionDays),
    totalEventCount: 0,
    retainedEventCount: 0,
    staleEventCount: 0,
    oldestEventAt: null,
    newestEventAt: null,
    generatedAt: now
  };
}

function numberValue(value: number | bigint | string | null | undefined) {
  if (typeof value === 'bigint') return Number(value);
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function dateValue(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isMissingSiteAnalyticsTableError(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code?: unknown }).code) : '';
  const message = error instanceof Error ? error.message : '';
  return code === 'P2021' || code === 'P2022' || /SiteAnalyticsEvent|site analytics/i.test(message);
}

export function buildSiteAnalyticsRetentionSummary(row: RawSiteAnalyticsRetentionRow | null | undefined, now = new Date(), retentionDays = SITE_ANALYTICS_RAW_EVENT_RETENTION_DAYS): SiteAnalyticsRetentionSummary {
  const empty = emptySiteAnalyticsRetentionSummary(now, retentionDays);
  if (!row) return { ...empty, databaseConfigured: true, tableAvailable: true };

  return {
    databaseConfigured: true,
    tableAvailable: true,
    retentionDays,
    cutoffAt: retentionCutoff(now, retentionDays),
    totalEventCount: numberValue(row.totalEventCount),
    retainedEventCount: numberValue(row.retainedEventCount),
    staleEventCount: numberValue(row.staleEventCount),
    oldestEventAt: dateValue(row.oldestEventAt),
    newestEventAt: dateValue(row.newestEventAt),
    generatedAt: now
  };
}

export const siteAnalyticsRetentionService = {
  async summary(): Promise<SiteAnalyticsRetentionSummary> {
    const now = new Date();
    const retentionDays = SITE_ANALYTICS_RAW_EVENT_RETENTION_DAYS;
    const cutoffAt = retentionCutoff(now, retentionDays);

    if (!hasDatabase()) return emptySiteAnalyticsRetentionSummary(now, retentionDays);

    try {
      const rows = await prisma.$queryRaw<RawSiteAnalyticsRetentionRow[]>`
        SELECT
          COUNT(*) AS "totalEventCount",
          COUNT(*) FILTER (WHERE "createdAt" >= ${cutoffAt}) AS "retainedEventCount",
          COUNT(*) FILTER (WHERE "createdAt" < ${cutoffAt}) AS "staleEventCount",
          MIN("createdAt") AS "oldestEventAt",
          MAX("createdAt") AS "newestEventAt"
        FROM "SiteAnalyticsEvent"
      `;

      return buildSiteAnalyticsRetentionSummary(rows[0], now, retentionDays);
    } catch (error) {
      if (isMissingSiteAnalyticsTableError(error)) {
        return { ...emptySiteAnalyticsRetentionSummary(now, retentionDays), databaseConfigured: true };
      }
      throw error;
    }
  }
};
