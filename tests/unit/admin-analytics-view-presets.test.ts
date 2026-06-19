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

  assert.equal(preview.status, 'preview_only');
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
  assert.ok(preview.blockers.includes('view save path not configured'));
  assert.ok(preview.blockers.includes('client save path disabled'));
  assert.ok(preview.blockers.includes('server save path disabled'));

  const helperSource = readFileSync('lib/analytics/admin-analytics-view-presets.ts', 'utf8');
  assert.match(helperSource, /preview_only/);
  assert.match(helperSource, /saveEnabled: false/);
  assert.match(helperSource, /clientSaveEnabled: false/);
  assert.match(helperSource, /serverSaveEnabled: false/);
  assert.match(helperSource, /adminAnalyticsRangeQueryString/);
  assert.doesNotMatch(helperSource, /localStorage|sessionStorage|cookies\(|PrismaClient|prisma\.|create\(|update\(|upsert\(|delete\(/);

  console.log('admin-analytics-view-presets.test.ts passed');
}
