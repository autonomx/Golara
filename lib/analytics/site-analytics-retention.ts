import 'server-only';

import { hasDatabase, prisma } from '@/lib/prisma';

export const SITE_ANALYTICS_RAW_EVENT_RETENTION_DAYS = 180;
export const SITE_ANALYTICS_RETENTION_PRODUCTION_EVIDENCE_ENV = 'SITE_ANALYTICS_RETENTION_PRODUCTION_EVIDENCE_CONFIRMED';
export const SITE_ANALYTICS_RETENTION_CLEANUP_DELETION_ENABLED = false;

const DAY_MS = 24 * 60 * 60 * 1000;

type SiteAnalyticsRetentionCleanupReason =
  | 'database_not_configured'
  | 'table_unavailable'
  | 'production_evidence_required'
  | 'no_stale_events'
  | 'preview_ready';

export type SiteAnalyticsRetentionCleanupPreview = {
  eligibleEventCount: number;
  cutoffAt: Date;
  retentionDays: number;
  productionEvidenceConfirmed: boolean;
  deletionEnabled: boolean;
  readyForFutureCleanup: boolean;
  reason: SiteAnalyticsRetentionCleanupReason;
};

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
  cleanupPreview: SiteAnalyticsRetentionCleanupPreview;
};

type RawSiteAnalyticsRetentionRow = {
  totalEventCount?: number | bigint | string | null;
  retainedEventCount?: number | bigint | string | null;
  staleEventCount?: number | bigint | string | null;
  oldestEventAt?: Date | string | null;
  newestEventAt?: Date | string | null;
};

type SiteAnalyticsRetentionBuildOptions = {
  productionEvidenceConfirmed?: boolean;
};

function retentionCutoff(now: Date, retentionDays = SITE_ANALYTICS_RAW_EVENT_RETENTION_DAYS) {
  return new Date(now.getTime() - retentionDays * DAY_MS);
}

export function isSiteAnalyticsRetentionProductionEvidenceConfirmed(env: NodeJS.ProcessEnv = process.env) {
  const value = env[SITE_ANALYTICS_RETENTION_PRODUCTION_EVIDENCE_ENV]?.trim().toLowerCase();
  return value === '1' || value === 'true' || value === 'yes';
}

function buildSiteAnalyticsRetentionCleanupPreview({
  databaseConfigured,
  tableAvailable,
  staleEventCount,
  cutoffAt,
  retentionDays,
  productionEvidenceConfirmed
}: {
  databaseConfigured: boolean;
  tableAvailable: boolean;
  staleEventCount: number;
  cutoffAt: Date;
  retentionDays: number;
  productionEvidenceConfirmed: boolean;
}): SiteAnalyticsRetentionCleanupPreview {
  const eligibleEventCount = databaseConfigured && tableAvailable ? staleEventCount : 0;
  const readyForFutureCleanup = databaseConfigured && tableAvailable && productionEvidenceConfirmed && staleEventCount > 0;
  const reason: SiteAnalyticsRetentionCleanupReason = !databaseConfigured
    ? 'database_not_configured'
    : !tableAvailable
      ? 'table_unavailable'
      : !productionEvidenceConfirmed
        ? 'production_evidence_required'
        : staleEventCount > 0
          ? 'preview_ready'
          : 'no_stale_events';

  return {
    eligibleEventCount,
    cutoffAt,
    retentionDays,
    productionEvidenceConfirmed,
    deletionEnabled: SITE_ANALYTICS_RETENTION_CLEANUP_DELETION_ENABLED,
    readyForFutureCleanup,
    reason
  };
}

export function emptySiteAnalyticsRetentionSummary(
  now = new Date(),
  retentionDays = SITE_ANALYTICS_RAW_EVENT_RETENTION_DAYS,
  options: SiteAnalyticsRetentionBuildOptions = {}
): SiteAnalyticsRetentionSummary {
  const cutoffAt = retentionCutoff(now, retentionDays);
  const productionEvidenceConfirmed = options.productionEvidenceConfirmed ?? isSiteAnalyticsRetentionProductionEvidenceConfirmed();

  return {
    databaseConfigured: false,
    tableAvailable: false,
    retentionDays,
    cutoffAt,
    totalEventCount: 0,
    retainedEventCount: 0,
    staleEventCount: 0,
    oldestEventAt: null,
    newestEventAt: null,
    generatedAt: now,
    cleanupPreview: buildSiteAnalyticsRetentionCleanupPreview({
      databaseConfigured: false,
      tableAvailable: false,
      staleEventCount: 0,
      cutoffAt,
      retentionDays,
      productionEvidenceConfirmed
    })
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

export function buildSiteAnalyticsRetentionSummary(
  row: RawSiteAnalyticsRetentionRow | null | undefined,
  now = new Date(),
  retentionDays = SITE_ANALYTICS_RAW_EVENT_RETENTION_DAYS,
  options: SiteAnalyticsRetentionBuildOptions = {}
): SiteAnalyticsRetentionSummary {
  const empty = emptySiteAnalyticsRetentionSummary(now, retentionDays, options);
  if (!row) {
    return {
      ...empty,
      databaseConfigured: true,
      tableAvailable: true,
      cleanupPreview: buildSiteAnalyticsRetentionCleanupPreview({
        databaseConfigured: true,
        tableAvailable: true,
        staleEventCount: 0,
        cutoffAt: empty.cutoffAt,
        retentionDays,
        productionEvidenceConfirmed: empty.cleanupPreview.productionEvidenceConfirmed
      })
    };
  }

  const staleEventCount = numberValue(row.staleEventCount);
  const cutoffAt = retentionCutoff(now, retentionDays);
  const productionEvidenceConfirmed = options.productionEvidenceConfirmed ?? isSiteAnalyticsRetentionProductionEvidenceConfirmed();

  return {
    databaseConfigured: true,
    tableAvailable: true,
    retentionDays,
    cutoffAt,
    totalEventCount: numberValue(row.totalEventCount),
    retainedEventCount: numberValue(row.retainedEventCount),
    staleEventCount,
    oldestEventAt: dateValue(row.oldestEventAt),
    newestEventAt: dateValue(row.newestEventAt),
    generatedAt: now,
    cleanupPreview: buildSiteAnalyticsRetentionCleanupPreview({
      databaseConfigured: true,
      tableAvailable: true,
      staleEventCount,
      cutoffAt,
      retentionDays,
      productionEvidenceConfirmed
    })
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
        const empty = emptySiteAnalyticsRetentionSummary(now, retentionDays);
        return {
          ...empty,
          databaseConfigured: true,
          cleanupPreview: buildSiteAnalyticsRetentionCleanupPreview({
            databaseConfigured: true,
            tableAvailable: false,
            staleEventCount: 0,
            cutoffAt: empty.cutoffAt,
            retentionDays,
            productionEvidenceConfirmed: empty.cleanupPreview.productionEvidenceConfirmed
          })
        };
      }
      throw error;
    }
  }
};
