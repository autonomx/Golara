import assert from 'node:assert/strict';

import {
  buildSiteAnalyticsRetentionCleanupDelegate,
  SITE_ANALYTICS_RETENTION_CLEANUP_DELEGATE_ENABLED_ENV,
  SITE_ANALYTICS_RETENTION_CLEANUP_DELEGATE_MAX_BATCH_SIZE
} from '../../lib/analytics/site-analytics-retention-cleanup-delegate';

function testEnv(values: Record<string, string> = {}): NodeJS.ProcessEnv {
  return { NODE_ENV: 'test', ...values } as NodeJS.ProcessEnv;
}

export async function runSiteRetentionDelegateTests() {
  const defaultOff = buildSiteAnalyticsRetentionCleanupDelegate({ env: testEnv(), databaseConfigured: true });
  assert.equal(defaultOff.delegate, null);
  assert.equal(defaultOff.state.attached, false);
  assert.equal(defaultOff.state.enabled, false);
  assert.ok(defaultOff.state.blockers.includes('retention cleanup delegate flag is disabled'));

  const missingDatabase = buildSiteAnalyticsRetentionCleanupDelegate({
    env: testEnv({ [SITE_ANALYTICS_RETENTION_CLEANUP_DELEGATE_ENABLED_ENV]: 'true' }),
    databaseConfigured: false
  });
  assert.equal(missingDatabase.delegate, null);
  assert.equal(missingDatabase.state.attached, false);
  assert.ok(missingDatabase.state.blockers.includes('database is not configured for retention cleanup delegate'));

  const attached = buildSiteAnalyticsRetentionCleanupDelegate({
    env: testEnv({ [SITE_ANALYTICS_RETENTION_CLEANUP_DELEGATE_ENABLED_ENV]: 'true' }),
    databaseConfigured: true
  });
  assert.equal(attached.state.attached, true);
  assert.equal(attached.state.maxBatchSize, SITE_ANALYTICS_RETENTION_CLEANUP_DELEGATE_MAX_BATCH_SIZE);
  assert.equal(typeof attached.delegate?.deleteMany, 'function');
}
