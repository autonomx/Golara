import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { buildAdminAnalyticsSavedViewMutationPlan } from '../../lib/analytics/admin-analytics-saved-view-mutation-policy';

const BASE_INPUT = {
  action: 'create-view' as const,
  actorRole: 'owner' as const,
  actionPath: '/admin/analytics/saved-views/create',
  viewKey: 'business-summary',
  label: 'Business summary',
  description: 'Owner dashboard summary view',
  scope: 'owner-private',
  audience: 'owner',
  rangeMode: 'preset',
  rangeQuery: 'range=30',
  sectionAnchors: ['#business-analytics-charts', '#order-analytics'],
  requestedByLabel: 'Owner',
  repositoryWritesEnabled: true,
  writeEndpointsEnabled: true,
  rolePolicyEnforced: true
};

export async function runSavedViewMutationPolicyTests() {
  const accepted = buildAdminAnalyticsSavedViewMutationPlan(BASE_INPUT);
  assert.equal(accepted.accepted, true);
  assert.equal(accepted.repositoryOperation, 'create');
  assert.equal(accepted.metadataOnly, true);
  assert.equal(accepted.actionPath, '/admin/analytics/saved-views/create');
  assert.equal(accepted.data?.isActive, false);
  assert.equal(accepted.data?.ownerApproved, false);
  assert.deepEqual(accepted.data?.sectionAnchors, ['#business-analytics-charts', '#order-analytics']);
  assert.ok(accepted.blockedFields.includes('customer rows'));

  const deniedForStaff = buildAdminAnalyticsSavedViewMutationPlan({ ...BASE_INPUT, actorRole: 'staff' });
  assert.equal(deniedForStaff.accepted, false);
  assert.equal(deniedForStaff.repositoryOperation, 'none');
  assert.ok(deniedForStaff.blockers.includes('owner role required for saved-view mutations'));

  const deniedForRoute = buildAdminAnalyticsSavedViewMutationPlan({ ...BASE_INPUT, actionPath: '/admin/analytics/export' });
  assert.equal(deniedForRoute.accepted, false);
  assert.ok(deniedForRoute.blockers.includes('approved saved-view action target required'));

  const deniedWithoutGates = buildAdminAnalyticsSavedViewMutationPlan({
    ...BASE_INPUT,
    repositoryWritesEnabled: false,
    writeEndpointsEnabled: false,
    rolePolicyEnforced: false
  });
  assert.equal(deniedWithoutGates.accepted, false);
  assert.ok(deniedWithoutGates.blockers.includes('saved-view repository writes are disabled'));
  assert.ok(deniedWithoutGates.blockers.includes('saved-view write endpoints are disabled'));
  assert.ok(deniedWithoutGates.blockers.includes('saved-view role policy is not enforced'));

  const approval = buildAdminAnalyticsSavedViewMutationPlan({
    ...BASE_INPUT,
    action: 'record-owner-approval',
    actionPath: '/admin/analytics/saved-views/record-owner-approval',
    ownerApprovalNote: 'Approved for owner-managed dashboard presets.'
  });
  assert.equal(approval.accepted, true);
  assert.equal(approval.repositoryOperation, 'record-owner-approval');
  assert.equal(approval.data?.ownerApproved, true);
  assert.equal(approval.data?.isActive, false);

  const source = await readFile('lib/analytics/admin-analytics-saved-view-mutation-policy.ts', 'utf8');
  assert.doesNotMatch(source, /customerRows\s*:/);
  assert.doesNotMatch(source, /eventRows\s*:/);
  assert.doesNotMatch(source, /exportContents\s*:/);
  assert.doesNotMatch(source, /PrismaClient|prisma\.|\.create\(|\.update\(|\.delete\(/);
  assert.doesNotMatch(source, /setInterval|setTimeout|cron|worker\.|queue\./);
  assert.doesNotMatch(source, /sendMail|createTransport|smtp|fetch\(|axios/);
}
