import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  buildSiteAnalyticsRetentionCleanupDelegate,
  SITE_ANALYTICS_RETENTION_CLEANUP_DELEGATE_ENABLED_ENV,
  SITE_ANALYTICS_RETENTION_CLEANUP_DELEGATE_MAX_BATCH_SIZE
} from '../../lib/analytics/site-analytics-retention-cleanup-delegate';

export async function runSiteRetentionDelegateTests() {
  const defaultOff = buildSiteAnalyticsRetentionCleanupDelegate({ env: {}, databaseConfigured: true });
  assert.equal(defaultOff.delegate, null);
  assert.equal(defaultOff.state.attached, false);
  assert.equal(defaultOff.state.enabled, false);
  assert.ok(defaultOff.state.blockers.includes('retention cleanup delegate flag is disabled'));

  const missingDatabase = buildSiteAnalyticsRetentionCleanupDelegate({
    env: { [SITE_ANALYTICS_RETENTION_CLEANUP_DELEGATE_ENABLED_ENV]: 'true' },
    databaseConfigured: false
  });
  assert.equal(missingDatabase.delegate, null);
  assert.equal(missingDatabase.state.attached, false);
  assert.ok(missingDatabase.state.blockers.includes('database is not configured for retention cleanup delegate'));

  const attached = buildSiteAnalyticsRetentionCleanupDelegate({
    env: { [SITE_ANALYTICS_RETENTION_CLEANUP_DELEGATE_ENABLED_ENV]: 'true' },
    databaseConfigured: true
  });
  assert.equal(attached.state.attached, true);
  assert.equal(attached.state.maxBatchSize, SITE_ANALYTICS_RETENTION_CLEANUP_DELEGATE_MAX_BATCH_SIZE);
  assert.equal(typeof attached.delegate?.deleteMany, 'function');

  const delegateSource = await readFile('lib/analytics/site-analytics-retention-cleanup-delegate.ts', 'utf8');
  assert.match(delegateSource, /SITE_ANALYTICS_RETENTION_CLEANUP_DELEGATE_ENABLED/);
  assert.match(delegateSource, /SITE_ANALYTICS_RETENTION_CLEANUP_DELEGATE_MAX_BATCH_SIZE = 1000/);
  assert.match(delegateSource, /Math\.min\(/);
  assert.match(delegateSource, /DELETE FROM "SiteAnalyticsEvent"/);
  assert.match(delegateSource, /LIMIT \$\{take\}/);
  assert.doesNotMatch(delegateSource, /setInterval|setTimeout|cron|queue|worker|sendMail|createTransport|fetch\(/);
}
