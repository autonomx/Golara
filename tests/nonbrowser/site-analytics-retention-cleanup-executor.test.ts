import assert from 'node:assert/strict';

import { executeSiteAnalyticsRetentionCleanup, type SiteAnalyticsRetentionCleanupDelegate } from '../../lib/analytics/site-analytics-retention-cleanup-executor';
import { buildSiteAnalyticsRetentionCleanupPlan } from '../../lib/analytics/site-analytics-retention-cleanup-plan';
import { buildSiteAnalyticsRetentionSummary } from '../../lib/analytics/site-analytics-retention';

function acceptedPlan() {
  const summary = buildSiteAnalyticsRetentionSummary(
    {
      totalEventCount: 12000,
      retainedEventCount: 7000,
      staleEventCount: 5000,
      oldestEventAt: new Date('2025-01-01T00:00:00Z'),
      newestEventAt: new Date('2026-06-19T00:00:00Z')
    },
    new Date('2026-06-20T00:00:00Z'),
    180,
    { productionEvidenceConfirmed: true }
  );
  return buildSiteAnalyticsRetentionCleanupPlan({
    actorRole: 'owner',
    summary,
    deletionPlanEnabled: true,
    maxDeletionBatchSize: 1000
  });
}

function fakeDelegate(calls: string[]): SiteAnalyticsRetentionCleanupDelegate {
  return {
    deleteMany: async (args) => {
      calls.push(`${args.take}:${args.where.createdAt.lt.toISOString()}`);
      return { count: 750 };
    }
  };
}

export async function runSiteAnalyticsRetentionCleanupExecutorTests() {
  const blockedCalls: string[] = [];
  const blocked = await executeSiteAnalyticsRetentionCleanup({
    plan: acceptedPlan(),
    delegate: fakeDelegate(blockedCalls),
    executionEnabled: false,
    manualTriggerConfirmed: true
  });
  assert.equal(blocked.accepted, false);
  assert.equal(blocked.executed, false);
  assert.equal(blocked.deletedCount, 0);
  assert.deepEqual(blockedCalls, []);
  assert.ok(blocked.blockers.includes('retention cleanup execution flag is disabled'));

  const missingConfirmationCalls: string[] = [];
  const missingConfirmation = await executeSiteAnalyticsRetentionCleanup({
    plan: acceptedPlan(),
    delegate: fakeDelegate(missingConfirmationCalls),
    executionEnabled: true,
    manualTriggerConfirmed: false
  });
  assert.equal(missingConfirmation.executed, false);
  assert.deepEqual(missingConfirmationCalls, []);
  assert.ok(missingConfirmation.blockers.includes('manual owner trigger confirmation is required'));

  const calls: string[] = [];
  const executed = await executeSiteAnalyticsRetentionCleanup({
    plan: acceptedPlan(),
    delegate: fakeDelegate(calls),
    executionEnabled: true,
    manualTriggerConfirmed: true
  });
  assert.equal(executed.accepted, true);
  assert.equal(executed.executed, true);
  assert.equal(executed.deletedCount, 750);
  assert.equal(executed.backgroundJobStarted, false);
  assert.deepEqual(calls, ['1000:2025-12-22T00:00:00.000Z']);
}
