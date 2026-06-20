import assert from 'node:assert/strict';

import { buildAdminAnalyticsSavedViewReadPlan } from '../../lib/analytics/admin-analytics-saved-view-adapter-plan';

export async function runViewPlanTests() {
  const ownerPlan = buildAdminAnalyticsSavedViewReadPlan({ actorRole: 'owner', maxRows: 100 });
  assert.equal(ownerPlan.take, 25);
  assert.equal(ownerPlan.metadataOnly, true);
  assert.deepEqual(ownerPlan.where, { ownerApproved: true, isActive: true });

  const staffPlan = buildAdminAnalyticsSavedViewReadPlan({ actorRole: 'staff', maxRows: 4 });
  assert.equal(staffPlan.take, 4);
  assert.deepEqual(staffPlan.where, { ownerApproved: true, isActive: true, audience: 'staff' });
}
