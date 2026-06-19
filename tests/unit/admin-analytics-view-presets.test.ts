import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { resolveAdminAnalyticsRange } from '../../lib/analytics/admin-analytics-range';
import { buildAdminAnalyticsViewPresetPreview } from '../../lib/analytics/admin-analytics-view-presets';

export async function runAdminAnalyticsViewPresetTests() {
  const now = new Date(Date.UTC(2026, 5, 19, 12));
  const range = resolveAdminAnalyticsRange(now, {
    start: '2026-06-01',
    end: '2026-06-15'
  });
  const preview = buildAdminAnalyticsViewPresetPreview(range);

  assert.equal(preview.status, 'persistence_plan_only');
  assert.equal(preview.enabled, false);
  assert.equal(preview.saveEnabled, false);
  assert.equal(preview.clientSaveEnabled, false);
  assert.equal(preview.serverSaveEnabled, false);
  assert.equal(preview.roleAware, true);
  assert.equal(preview.rangeMode, 'custom');
  assert.equal(preview.rangeLabel, '2026-06-01 to 2026-06-15');
  assert.equal(preview.rangeQuery, 'start=2026-06-01&end=2026-06-15');
  assert.equal(preview.workspaceHref, '/admin/analytics?start=2026-06-01&end=2026-06-15');
  assert.deepEqual(
    preview.presets.map((preset) => preset.key),
    ['business-performance', 'site-funnel', 'order-cohorts', 'operations-readiness']
  );
  assert.ok(preview.presets.every((preset) => preset.rangeQuery === preview.rangeQuery));
  assert.ok(preview.presets.every((preset) => preset.href.startsWith(preview.workspaceHref)));
  assert.ok(preview.presets.some((preset) => preset.audience === 'owner'));
  assert.ok(preview.presets.some((preset) => preset.audience === 'staff'));
  assert.ok(preview.presets.every((preset) => preset.sections.length > 0));
  assert.ok(preview.presets.every((preset) => preset.allowedManagers.includes('owner')));
  assert.deepEqual(preview.persistencePlan.allowedScopes, [
    'owner-private',
    'staff-shared',
    'store-wide-owner-managed'
  ]);
  assert.equal(preview.persistencePlan.status, 'persistence_plan_only');
  assert.equal(preview.persistencePlan.enabled, false);
  assert.equal(preview.persistencePlan.saveEndpointEnabled, false);
  assert.equal(preview.persistencePlan.updateEndpointEnabled, false);
  assert.equal(preview.persistencePlan.removeEndpointEnabled, false);
  assert.equal(preview.persistencePlan.managementUiEnabled, false);
  assert.equal(preview.persistencePlan.ownerApprovalRequired, true);
  assert.equal(preview.persistencePlan.ownerApprovalRecorded, false);
  assert.ok(preview.persistencePlan.requiredFields.includes('selected range query'));
  assert.ok(preview.persistencePlan.requiredFields.includes('section anchors'));
  assert.ok(preview.persistencePlan.blockedFields.includes('analytics rows'));
  assert.ok(preview.persistencePlan.blockedFields.includes('customer rows'));
  assert.ok(preview.persistencePlan.blockedFields.includes('raw event rows'));
  assert.ok(preview.blockers.includes('owner approval not recorded'));
  assert.ok(preview.blockers.includes('save endpoint not configured'));
  assert.ok(preview.blockers.includes('management UI not implemented'));
  assert.ok(preview.blockers.includes('role policy persistence not configured'));

  const helperSource = readFileSync('lib/analytics/admin-analytics-view-presets.ts', 'utf8');
  assert.match(helperSource, /persistence_plan_only/);
  assert.match(helperSource, /saveEnabled: false/);
  assert.match(helperSource, /clientSaveEnabled: false/);
  assert.match(helperSource, /serverSaveEnabled: false/);
  assert.match(helperSource, /saveEndpointEnabled: false/);
  assert.match(helperSource, /updateEndpointEnabled: false/);
  assert.match(helperSource, /removeEndpointEnabled: false/);
  assert.match(helperSource, /managementUiEnabled: false/);
  assert.match(helperSource, /adminAnalyticsRangeQueryString/);
  assert.doesNotMatch(helperSource, /localStorage|sessionStorage|cookies\(|PrismaClient|prisma\.|create\(|update\(|upsert\(|delete\(/);

  console.log('admin-analytics-view-presets.test.ts passed');
}
