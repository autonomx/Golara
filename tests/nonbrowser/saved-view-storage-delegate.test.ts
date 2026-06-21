import assert from 'node:assert/strict';

import {
  ADMIN_ANALYTICS_SAVED_VIEW_STORAGE_DELEGATE_ENABLED_ENV,
  buildAdminAnalyticsSavedViewStorageDelegate
} from '../../lib/analytics/admin-analytics-saved-view-storage-delegate';

function testEnv(values: Record<string, string> = {}): NodeJS.ProcessEnv {
  return { NODE_ENV: 'test', ...values } as NodeJS.ProcessEnv;
}

export async function runSavedViewStorageDelegateTests() {
  const defaultOff = buildAdminAnalyticsSavedViewStorageDelegate({ env: testEnv(), databaseConfigured: true });
  assert.equal(defaultOff.delegate, null);
  assert.equal(defaultOff.state.attached, false);
  assert.equal(defaultOff.state.metadataOnly, true);
  assert.ok(defaultOff.state.blockers.includes('saved-view storage delegate flag is disabled'));

  const missingDatabase = buildAdminAnalyticsSavedViewStorageDelegate({
    env: testEnv({ [ADMIN_ANALYTICS_SAVED_VIEW_STORAGE_DELEGATE_ENABLED_ENV]: 'true' }),
    databaseConfigured: false
  });
  assert.equal(missingDatabase.delegate, null);
  assert.equal(missingDatabase.state.attached, false);
  assert.ok(missingDatabase.state.blockers.includes('database is not configured for saved-view storage delegate'));

  const attached = buildAdminAnalyticsSavedViewStorageDelegate({
    env: testEnv({ [ADMIN_ANALYTICS_SAVED_VIEW_STORAGE_DELEGATE_ENABLED_ENV]: 'true' }),
    databaseConfigured: true
  });
  assert.equal(attached.state.attached, true);
  assert.equal(attached.state.metadataOnly, true);
  assert.equal(typeof attached.delegate?.upsert, 'function');
  assert.equal(typeof attached.delegate?.update, 'function');
}
