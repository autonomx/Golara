import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { buildAdminAnalyticsSavedViewRoutePlan } from '../../lib/analytics/admin-analytics-saved-view-route-plan';

const gates = {
  generatedClientRuntimeAccessEnabled: true,
  metadataReadsEnabled: true,
  metadataChangesEnabled: true,
  readEndpointEnabled: true,
  changeEndpointEnabled: true,
  rolePolicyEnforced: true
};

const payload = {
  viewKey: 'business-summary',
  label: 'Business summary',
  scope: 'owner-private',
  audience: 'owner',
  rangeMode: 'preset',
  rangeQuery: 'range=30',
  sectionAnchors: ['#business-analytics-charts'],
  ownerApprovalNote: 'approved by owner'
};

export async function runSavedViewRoutePlanTests() {
  const accepted = buildAdminAnalyticsSavedViewRoutePlan({
    action: 'record-owner-approval',
    actorRole: 'owner',
    payload,
    gateState: gates
  });
  assert.equal(accepted.ok, true);
  assert.equal(accepted.persisted, false);
  assert.equal(accepted.metadataOnly, true);
  assert.equal(accepted.operation, 'record-owner-approval');
  assert.equal(accepted.preview?.ownerApproved, true);
  assert.equal(accepted.preview?.isActive, false);

  const denied = buildAdminAnalyticsSavedViewRoutePlan({
    action: 'create-view',
    actorRole: 'staff',
    payload,
    gateState: gates
  });
  assert.equal(denied.ok, false);
  assert.ok(denied.blockers.includes('owner role required for saved-view mutations'));

  const helperSource = await readFile('lib/analytics/admin-analytics-saved-view-route-plan.ts', 'utf8');
  assert.match(helperSource, /persisted: false/);
  assert.match(helperSource, /metadataOnly: true/);

  const createRouteSource = await readFile('app/admin/analytics/saved-views/create/route.ts', 'utf8');
  assert.match(createRouteSource, /buildAdminAnalyticsSavedViewStorageDelegate/);
  assert.match(createRouteSource, /delegate: delegateAttachment\.delegate/);
  assert.match(createRouteSource, /delegate: delegateAttachment\.state/);
  assert.doesNotMatch(createRouteSource, /sendMail|createTransport|setInterval|setTimeout|cron/);

  const dynamicRouteSource = await readFile('app/admin/analytics/saved-views/[action]/route.ts', 'utf8');
  assert.match(dynamicRouteSource, /export async function POST/);
  assert.match(dynamicRouteSource, /assertAdminRole\('owner'\)/);
  assert.match(dynamicRouteSource, /ACTION_BY_SEGMENT/);
  assert.match(dynamicRouteSource, /buildAdminAnalyticsSavedViewStorageDelegate/);
  assert.match(dynamicRouteSource, /delegate: delegateAttachment\.delegate/);
  assert.match(dynamicRouteSource, /delegate: delegateAttachment\.state/);
  assert.doesNotMatch(dynamicRouteSource, /sendMail|createTransport|setInterval|setTimeout|cron/);
}
