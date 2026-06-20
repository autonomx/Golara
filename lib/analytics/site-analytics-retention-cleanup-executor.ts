import type { SiteAnalyticsRetentionCleanupPlan } from './site-analytics-retention-cleanup-plan';

export type SiteAnalyticsRetentionCleanupDelegate = {
  deleteMany(args: { where: { createdAt: { lt: Date } }; take?: number }): Promise<{ count: number }>;
};

export type SiteAnalyticsRetentionCleanupExecutionResult = {
  accepted: boolean;
  executed: boolean;
  deletedCount: number;
  maxDeletionBatchSize: number;
  cutoffAt: Date;
  ownerOnly: true;
  requiresManualTrigger: true;
  backgroundJobStarted: false;
  blockers: string[];
};

export async function executeSiteAnalyticsRetentionCleanup(options: {
  plan: SiteAnalyticsRetentionCleanupPlan;
  delegate: SiteAnalyticsRetentionCleanupDelegate | null;
  executionEnabled?: boolean;
  manualTriggerConfirmed?: boolean;
}): Promise<SiteAnalyticsRetentionCleanupExecutionResult> {
  const blockers = [...options.plan.blockers];

  if (!options.plan.accepted) blockers.push('retention cleanup plan must be accepted before execution');
  if (options.plan.destructiveAction !== false) blockers.push('retention cleanup plan must originate from dry-run-only planning mode');
  if (options.executionEnabled !== true) blockers.push('retention cleanup execution flag is disabled');
  if (options.manualTriggerConfirmed !== true) blockers.push('manual owner trigger confirmation is required');
  if (options.delegate === null) blockers.push('retention cleanup delegate not provided');
  if (options.plan.plannedDeletionCount <= 0) blockers.push('planned deletion count must be greater than zero');

  if (blockers.length > 0 || options.delegate === null) {
    return {
      accepted: false,
      executed: false,
      deletedCount: 0,
      maxDeletionBatchSize: options.plan.maxDeletionBatchSize,
      cutoffAt: options.plan.cutoffAt,
      ownerOnly: true,
      requiresManualTrigger: true,
      backgroundJobStarted: false,
      blockers
    };
  }

  const result = await options.delegate.deleteMany({
    where: { createdAt: { lt: options.plan.cutoffAt } },
    take: options.plan.plannedDeletionCount
  });

  return {
    accepted: true,
    executed: true,
    deletedCount: Math.min(Math.max(0, result.count), options.plan.plannedDeletionCount),
    maxDeletionBatchSize: options.plan.maxDeletionBatchSize,
    cutoffAt: options.plan.cutoffAt,
    ownerOnly: true,
    requiresManualTrigger: true,
    backgroundJobStarted: false,
    blockers: []
  };
}
