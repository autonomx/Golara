import assert from 'node:assert/strict';

import { runAdminAnalyticsSavedViewActionCore } from '../../lib/analytics/admin-analytics-saved-view-action-core';
import type { AdminAnalyticsSavedViewStorageDelegate } from '../../lib/analytics/admin-analytics-saved-view-storage-apply';

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

function fakeTarget(calls: string[]): AdminAnalyticsSavedViewStorageDelegate {
  const row = {
    viewKey: 'business-summary',
    label: 'Business summary',
    description: null,
    scope: 'owner-private',
    audience: 'owner',
    rangeMode: 'preset',
    rangeQuery: 'range=30',
    sectionAnchors: ['#business-analytics-charts'],
    ownerApproved: false,
    isActive: false,
    createdByRole: 'owner',
    createdByLabel: null,
    metadata: {}
  };
  return {
    upsert: async () => {
      calls.push('upsert');
      return row;
    },
    update: async (args) => {
      calls.push('update');
      return { ...row, ...args.data };
    }
  };
}

export async function runSavedViewCoreFlowTests() {
  const planOnly = await runAdminAnalyticsSavedViewActionCore({
    action: 'create-view',
    actorRole: 'owner',
    payload,
    gateState: gates
  });
  assert.equal(planOnly.ok, true);
  assert.equal(planOnly.mode, 'plan-only');
  assert.equal(planOnly.storage, null);
  assert.equal(planOnly.plan.persisted, false);

  const calls: string[] = [];
  const applied = await runAdminAnalyticsSavedViewActionCore({
    action: 'create-view',
    actorRole: 'owner',
    payload,
    gateState: gates,
    delegate: fakeTarget(calls)
  });
  assert.equal(applied.ok, true);
  assert.equal(applied.mode, 'storage-applied');
  assert.equal(applied.storage?.stored, true);
  assert.deepEqual(calls, ['upsert']);

  const deniedCalls: string[] = [];
  const denied = await runAdminAnalyticsSavedViewActionCore({
    action: 'create-view',
    actorRole: 'staff',
    payload,
    gateState: gates,
    delegate: fakeTarget(deniedCalls)
  });
  assert.equal(denied.ok, false);
  assert.equal(denied.mode, 'plan-only');
  assert.deepEqual(deniedCalls, []);
}
