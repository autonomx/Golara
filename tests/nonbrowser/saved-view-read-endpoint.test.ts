import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import {
  buildAdminAnalyticsSavedViewReadEndpointRuntimeState,
  isAdminAnalyticsSavedViewReadEndpointRuntimeEnabled,
  loadAdminAnalyticsSavedViewReadEndpointModel,
  shouldAttachAdminAnalyticsSavedViewReadDelegate,
  type AdminAnalyticsSavedViewGeneratedClientReadDelegate,
  type AdminAnalyticsSavedViewReadDelegateArgs,
  type AdminAnalyticsSavedViewReadEndpointEnv
} from '../../lib/analytics/admin-analytics-saved-view-read-endpoint';

function enabledEnv(): AdminAnalyticsSavedViewReadEndpointEnv {
  return {
    ADMIN_ANALYTICS_SAVED_VIEW_READ_ENDPOINT_ENABLED: 'true',
    ADMIN_ANALYTICS_SAVED_VIEW_READER_FACTORY_RUNTIME_ENABLED: 'true',
    ADMIN_ANALYTICS_SAVED_VIEW_GENERATED_CLIENT_RUNTIME_ACCESS_ENABLED: 'true',
    ADMIN_ANALYTICS_SAVED_VIEW_REPOSITORY_READS_ENABLED: 'true',
    ADMIN_ANALYTICS_SAVED_VIEW_ROLE_POLICY_ENFORCED: 'true'
  };
}

function validRow() {
  return {
    id: 'view-1',
    viewKey: 'business-summary',
    label: 'Business summary',
    description: 'Owner dashboard summary',
    scope: 'owner-private',
    audience: 'owner',
    rangeMode: 'preset',
    rangeQuery: 'range=30',
    sectionAnchors: ['#business-analytics-charts'],
    ownerApproved: true,
    isActive: true
  };
}

export async function runSavedViewReadEndpointTests() {
  const disabled = await loadAdminAnalyticsSavedViewReadEndpointModel({ actorRole: 'owner', env: {} });
  assert.equal(disabled.status, 'saved_view_read_endpoint_runtime_gated');
  assert.equal(disabled.routePath, '/admin/analytics/saved-views/read');
  assert.equal(disabled.readEndpointAvailable, true);
  assert.equal(disabled.readEndpointRuntimeEnabled, false);
  assert.equal(disabled.repositoryReadsEnabled, false);
  assert.equal(disabled.rows.length, 0);
  assert.ok(disabled.blockers.includes('saved-view read endpoint runtime disabled'));

  const publicModel = await loadAdminAnalyticsSavedViewReadEndpointModel({ actorRole: 'public', env: enabledEnv() });
  assert.equal(publicModel.rows.length, 0);
  assert.ok(publicModel.blockers.includes('admin role required for saved-view reads'));

  const state = buildAdminAnalyticsSavedViewReadEndpointRuntimeState(enabledEnv());
  assert.equal(state.readEndpointRuntimeEnabled, true);
  assert.equal(state.readerFactoryRuntimeEnabled, true);
  assert.equal(state.generatedClientRuntimeAccessEnabled, true);
  assert.equal(state.repositoryReadsEnabled, true);
  assert.equal(state.rolePolicyEnforced, true);
  assert.equal(isAdminAnalyticsSavedViewReadEndpointRuntimeEnabled(enabledEnv()), true);
  assert.equal(shouldAttachAdminAnalyticsSavedViewReadDelegate(enabledEnv()), true);
  assert.equal(shouldAttachAdminAnalyticsSavedViewReadDelegate({}), false);

  const ownerDelegate: AdminAnalyticsSavedViewGeneratedClientReadDelegate = {
    findMany: async (args: AdminAnalyticsSavedViewReadDelegateArgs) => {
      assert.deepEqual(args.where, { ownerApproved: true, isActive: true });
      assert.deepEqual(args.orderBy, [{ viewKey: 'asc' }, { label: 'asc' }]);
      assert.ok(args.take <= 25);
      return [validRow()];
    }
  };
  const ownerModel = await loadAdminAnalyticsSavedViewReadEndpointModel({
    actorRole: 'owner',
    env: enabledEnv(),
    delegate: ownerDelegate
  });
  assert.equal(ownerModel.metadataOnly, true);
  assert.equal(ownerModel.rows.length, 1);
  assert.equal(ownerModel.rows[0]?.activeForOperators, false);

  const staffDelegate: AdminAnalyticsSavedViewGeneratedClientReadDelegate = {
    findMany: async (args: AdminAnalyticsSavedViewReadDelegateArgs) => {
      assert.deepEqual(args.where, { ownerApproved: true, isActive: true, audience: 'staff' });
      return [{ ...validRow(), id: 'view-2', scope: 'staff-shared', audience: 'staff' }];
    }
  };
  const staffModel = await loadAdminAnalyticsSavedViewReadEndpointModel({
    actorRole: 'staff',
    env: enabledEnv(),
    delegate: staffDelegate
  });
  assert.equal(staffModel.rows.length, 1);
  assert.equal(staffModel.rows[0]?.audience, 'staff');

  const routeSource = await readFile('app/admin/analytics/saved-views/read/route.ts', 'utf8');
  assert.match(routeSource, /export async function GET/);
  assert.match(routeSource, /assertAdminRole\('staff'\)/);
  assert.match(routeSource, /NextResponse\.json/);
  assert.match(routeSource, /shouldAttachAdminAnalyticsSavedViewReadDelegate/);
  assert.match(routeSource, /await import\('@\/lib\/prisma'\)/);
  assert.doesNotMatch(routeSource, /export\s+async\s+function\s+(POST|PUT|PATCH|DELETE)/);
  assert.doesNotMatch(routeSource, /\.create\(|\.update\(|\.upsert\(|\.delete\(|sendMail|transport|setInterval|setTimeout|cron|schedule\.create/i);

  const helperSource = await readFile('lib/analytics/admin-analytics-saved-view-read-endpoint.ts', 'utf8');
  assert.doesNotMatch(helperSource, /customerRows\s*:/);
  assert.doesNotMatch(helperSource, /eventRows\s*:/);
  assert.doesNotMatch(helperSource, /exportContents\s*:/);
  assert.doesNotMatch(helperSource, /\.create\(|\.update\(|\.upsert\(|\.delete\(|sendMail|transport|setInterval|setTimeout|cron|schedule\.create/i);
}
