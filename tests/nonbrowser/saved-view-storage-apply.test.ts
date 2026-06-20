import assert from 'node:assert/strict';
import { applyAdminAnalyticsSavedViewStorage, type AdminAnalyticsSavedViewStorageDelegate } from '../../lib/analytics/admin-analytics-saved-view-storage-apply';
import type { AdminAnalyticsSavedViewMutationInput } from '../../lib/analytics/admin-analytics-saved-view-mutation-policy';

const READY_GATES = {
  generatedClientRuntimeAccessEnabled: true,
  metadataReadsEnabled: true,
  metadataChangesEnabled: true,
  readEndpointEnabled: true,
  changeEndpointEnabled: true,
  rolePolicyEnforced: true
};

function input(action: AdminAnalyticsSavedViewMutationInput['action']): AdminAnalyticsSavedViewMutationInput {
  return {
    action,
    actorRole: 'owner',
    actionPath:
      action === 'create-view'
        ? '/admin/analytics/saved-views/create'
        : action === 'update-view'
          ? '/admin/analytics/saved-views/update'
          : action === 'remove-view'
            ? '/admin/analytics/saved-views/remove'
            : '/admin/analytics/saved-views/record-owner-approval',
    viewKey: 'ops-main',
    label: 'Ops main',
    description: 'Approved operator view',
    scope: 'staff-shared',
    audience: 'staff',
    rangeMode: 'preset',
    rangeQuery: 'last_30_days',
    sectionAnchors: ['#kpis', '#trends'],
    ownerApprovalNote: 'Owner approved for operators.',
    requestedByLabel: 'owner'
  };
}

function delegate(calls: string[]): AdminAnalyticsSavedViewStorageDelegate {
  const row = {
    viewKey: 'ops-main',
    label: 'Ops main',
    description: 'Approved operator view',
    scope: 'staff-shared',
    audience: 'staff',
    rangeMode: 'preset',
    rangeQuery: 'last_30_days',
    sectionAnchors: ['#kpis'],
    ownerApproved: false,
    isActive: false,
    createdByRole: 'owner',
    createdByLabel: 'owner',
    metadata: {}
  };
  return {
    upsert: async () => {
      calls.push('upsert');
      return row;
    },
    update: async (args) => {
      calls.push(`update:${args.data.ownerApproved === true ? 'approve' : 'change'}`);
      return { ...row, ...args.data };
    }
  };
}

export async function runSavedViewStorageApplyTests() {
  const blockedCalls: string[] = [];
  const blocked = await applyAdminAnalyticsSavedViewStorage({
    input: { ...input('create-view'), actorRole: 'staff' },
    gateState: READY_GATES,
    delegate: delegate(blockedCalls)
  });
  assert.equal(blocked.accepted, false);
  assert.equal(blocked.stored, false);
  assert.equal(blockedCalls.length, 0);
  assert.ok(blocked.blockers.includes('owner role required for saved-view mutations'));

  const createCalls: string[] = [];
  const created = await applyAdminAnalyticsSavedViewStorage({
    input: input('create-view'),
    gateState: READY_GATES,
    delegate: delegate(createCalls)
  });
  assert.equal(created.accepted, true);
  assert.equal(created.stored, true);
  assert.equal(created.operation, 'create');
  assert.deepEqual(createCalls, ['upsert']);
  assert.equal(created.where?.viewKey_scope.viewKey, 'ops-main');

  const approvalCalls: string[] = [];
  const approved = await applyAdminAnalyticsSavedViewStorage({
    input: input('record-owner-approval'),
    gateState: READY_GATES,
    delegate: delegate(approvalCalls)
  });
  assert.equal(approved.accepted, true);
  assert.equal(approved.stored, true);
  assert.equal(approved.operation, 'record-owner-approval');
  assert.deepEqual(approvalCalls, ['update:approve']);
  assert.equal(approved.row?.ownerApproved, true);
  assert.equal(approved.row?.isActive, true);
}
