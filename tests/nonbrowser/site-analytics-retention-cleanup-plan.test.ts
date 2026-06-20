import assert from 'node:assert/strict';

import { buildSiteAnalyticsRetentionCleanupPlan } from '../../lib/analytics/site-analytics-retention-cleanup-plan';
import { buildSiteAnalyticsRetentionSummary } from '../../lib/analytics/site-analytics-retention';

export async function runSiteAnalyticsRetentionCleanupPlanTests() {
  const now = new Date('2026-06-20T00:00:00Z');
  const summary = buildSiteAnalyticsRetentionSummary(
    {
      totalEventCount: 12000,
      retainedEventCount: 7000,
      staleEventCount: 5000,
      oldestEventAt: new Date('2025-01-01T00:00:00Z'),
      newestEventAt: new Date('2026-06-19T00:00:00Z')
    },
    now,
    180,
    { productionEvidenceConfirmed: true }
  );

  const accepted = buildSiteAnalyticsRetentionCleanupPlan({
    actorRole: 'owner',
    summary,
    deletionPlanEnabled: true,
    maxDeletionBatchSize: 1000
  });
  assert.equal(accepted.accepted, true);
  assert.equal(accepted.destructiveAction, false);
  assert.equal(accepted.ownerOnly, true);
  assert.equal(accepted.dryRunOnly, true);
  assert.equal(accepted.plannedDeletionCount, 1000);

  const staff = buildSiteAnalyticsRetentionCleanupPlan({
    actorRole: 'staff',
    summary,
    deletionPlanEnabled: true,
    maxDeletionBatchSize: 1000
  });
  assert.equal(staff.accepted, false);
  assert.equal(staff.plannedDeletionCount, 0);
  assert.ok(staff.blockers.includes('owner role required for site analytics retention cleanup planning'));

  const gated = buildSiteAnalyticsRetentionCleanupPlan({
    actorRole: 'owner',
    summary,
    deletionPlanEnabled: false,
    maxDeletionBatchSize: 1000
  });
  assert.equal(gated.accepted, false);
  assert.ok(gated.blockers.includes('retention cleanup deletion plan flag is disabled'));
}
