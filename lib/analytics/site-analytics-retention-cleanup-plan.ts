import type { SiteAnalyticsRetentionSummary } from './site-analytics-retention';

export type SiteAnalyticsRetentionCleanupActorRole = 'owner' | 'staff' | 'public';

export type SiteAnalyticsRetentionCleanupPlan = {
  accepted: boolean;
  destructiveAction: false;
  ownerOnly: true;
  dryRunOnly: true;
  retentionDays: number;
  cutoffAt: Date;
  eligibleEventCount: number;
  maxDeletionBatchSize: number;
  plannedDeletionCount: number;
  blockers: string[];
};

export type SiteAnalyticsRetentionCleanupPlanOptions = {
  actorRole: SiteAnalyticsRetentionCleanupActorRole;
  summary: SiteAnalyticsRetentionSummary;
  deletionPlanEnabled?: boolean;
  productionEvidenceConfirmed?: boolean;
  maxDeletionBatchSize?: number;
};

function clampBatchSize(value: number | undefined) {
  if (!Number.isFinite(value ?? NaN)) return 0;
  return Math.max(0, Math.min(Math.floor(value ?? 0), 5000));
}

export function buildSiteAnalyticsRetentionCleanupPlan(options: SiteAnalyticsRetentionCleanupPlanOptions): SiteAnalyticsRetentionCleanupPlan {
  const blockers: string[] = [];
  const summary = options.summary;
  const preview = summary.cleanupPreview;
  const maxDeletionBatchSize = clampBatchSize(options.maxDeletionBatchSize ?? 1000);
  const productionEvidenceConfirmed = options.productionEvidenceConfirmed ?? preview.productionEvidenceConfirmed;
  const deletionPlanEnabled = options.deletionPlanEnabled === true;

  if (options.actorRole !== 'owner') blockers.push('owner role required for site analytics retention cleanup planning');
  if (!summary.databaseConfigured) blockers.push('database must be configured before retention cleanup planning');
  if (!summary.tableAvailable) blockers.push('site analytics event table must be available before retention cleanup planning');
  if (!productionEvidenceConfirmed) blockers.push('production retention evidence must be confirmed before cleanup planning');
  if (!deletionPlanEnabled) blockers.push('retention cleanup deletion plan flag is disabled');
  if (preview.deletionEnabled) blockers.push('destructive retention deletion must remain disabled in planning mode');
  if (preview.eligibleEventCount <= 0) blockers.push('no stale site analytics events are eligible for cleanup');
  if (maxDeletionBatchSize <= 0) blockers.push('max deletion batch size must be greater than zero');

  const accepted = blockers.length === 0;
  return {
    accepted,
    destructiveAction: false,
    ownerOnly: true,
    dryRunOnly: true,
    retentionDays: summary.retentionDays,
    cutoffAt: summary.cutoffAt,
    eligibleEventCount: preview.eligibleEventCount,
    maxDeletionBatchSize,
    plannedDeletionCount: accepted ? Math.min(preview.eligibleEventCount, maxDeletionBatchSize) : 0,
    blockers
  };
}
