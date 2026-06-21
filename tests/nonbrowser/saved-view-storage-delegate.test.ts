import assert from 'node:assert/strict';

import {
  ADMIN_ANALYTICS_SAVED_VIEW_GENERATED_CLIENT_DELEGATE_ENABLED_ENV,
  buildAdminAnalyticsSavedViewGeneratedClientDelegate,
  buildAdminAnalyticsSavedViewPreferredStorageDelegate,
  type AdminAnalyticsSavedViewGeneratedClientDelegate
} from '../../lib/analytics/admin-analytics-saved-view-generated-client-delegate';
import {
  ADMIN_ANALYTICS_SAVED_VIEW_STORAGE_DELEGATE_ENABLED_ENV,
  buildAdminAnalyticsSavedViewStorageDelegate
} from '../../lib/analytics/admin-analytics-saved-view-storage-delegate';

function testEnv(values: Record<string, string> = {}): NodeJS.ProcessEnv {
  return { NODE_ENV: 'test', ...values } as NodeJS.ProcessEnv;
}

function generatedDelegate(): AdminAnalyticsSavedViewGeneratedClientDelegate {
  return {
    upsert: async (args) => ({
      ...args.create,
      id: 'generated_1'
    }),
    update: async (args) => ({
      viewKey: args.where.viewKey_scope.viewKey,
      label: args.where.viewKey_scope.viewKey,
      description: null,
      scope: args.where.viewKey_scope.scope,
      audience: 'owner',
      rangeMode: 'preset',
      rangeQuery: 'range=30d',
      sectionAnchors: [],
      ownerApproved: args.data.ownerApproved ?? false,
      isActive: args.data.isActive ?? false,
      createdByRole: 'owner',
      createdByLabel: null,
      metadata: args.data.metadata ?? {},
      id: 'generated_1'
    })
  };
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

  const generatedDefaultOff = buildAdminAnalyticsSavedViewGeneratedClientDelegate({
    env: testEnv(),
    databaseConfigured: true,
    generatedClient: generatedDelegate()
  });
  assert.equal(generatedDefaultOff.delegate, null);
  assert.equal(generatedDefaultOff.state.source, 'none');
  assert.equal(generatedDefaultOff.state.generatedClientAvailable, true);
  assert.ok(generatedDefaultOff.state.blockers.includes('saved-view generated-client delegate flag is disabled'));

  const generatedMissingClient = buildAdminAnalyticsSavedViewGeneratedClientDelegate({
    env: testEnv({ [ADMIN_ANALYTICS_SAVED_VIEW_GENERATED_CLIENT_DELEGATE_ENABLED_ENV]: 'true' }),
    databaseConfigured: true,
    generatedClient: null
  });
  assert.equal(generatedMissingClient.delegate, null);
  assert.equal(generatedMissingClient.state.source, 'none');
  assert.equal(generatedMissingClient.state.generatedClientAvailable, false);
  assert.ok(generatedMissingClient.state.blockers.includes('generated saved-view Prisma delegate is not available'));

  const generatedAttached = buildAdminAnalyticsSavedViewGeneratedClientDelegate({
    env: testEnv({ [ADMIN_ANALYTICS_SAVED_VIEW_GENERATED_CLIENT_DELEGATE_ENABLED_ENV]: 'true' }),
    databaseConfigured: true,
    generatedClient: generatedDelegate()
  });
  assert.equal(generatedAttached.delegate !== null, true);
  assert.equal(generatedAttached.state.source, 'generated-client');
  assert.equal(generatedAttached.state.attached, true);
  assert.equal(generatedAttached.state.metadataOnly, true);

  const preferredGenerated = buildAdminAnalyticsSavedViewPreferredStorageDelegate({
    env: testEnv({
      [ADMIN_ANALYTICS_SAVED_VIEW_GENERATED_CLIENT_DELEGATE_ENABLED_ENV]: 'true',
      [ADMIN_ANALYTICS_SAVED_VIEW_STORAGE_DELEGATE_ENABLED_ENV]: 'true'
    }),
    databaseConfigured: true,
    generatedClient: generatedDelegate()
  });
  assert.equal(preferredGenerated.state.source, 'generated-client');
  assert.equal(preferredGenerated.delegate !== null, true);

  const preferredFallback = buildAdminAnalyticsSavedViewPreferredStorageDelegate({
    env: testEnv({ [ADMIN_ANALYTICS_SAVED_VIEW_STORAGE_DELEGATE_ENABLED_ENV]: 'true' }),
    databaseConfigured: true,
    generatedClient: null
  });
  assert.equal(preferredFallback.state.source, 'raw-sql');
  assert.equal(preferredFallback.state.attached, true);
  assert.equal(preferredFallback.delegate !== null, true);
}
