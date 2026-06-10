import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { getAdminRecentActivityCopy } from '@/lib/localization/admin-recent-activity-copy';

const repoRoot = process.cwd();
const panelPath = path.join(repoRoot, 'components/admin/AdminRecentActivitySummaryPanel.tsx');
const copyPath = path.join(repoRoot, 'lib/localization/admin-recent-activity-copy.ts');

const panelSource = fs.readFileSync(panelPath, 'utf8');
const copySource = fs.readFileSync(copyPath, 'utf8');

const fixedLabels = [
  'Analytics',
  'Recent activity timeline',
  'Unified operational feed from order timeline events, customer timeline events, and admin audit logs.',
  'shown',
  'Activities reviewed',
  'Staff activities',
  'System activities',
  'Sources',
  'Activity',
  'Source',
  'Actor',
  'Entity',
  'No recent order, customer, or admin activity has been recorded yet.',
  'System activity'
];

const sourceLabels = ['order', 'customer', 'admin'];

for (const label of fixedLabels) {
  assert.ok(panelSource.includes(`t('${label}')`), `${label} should stay wrapped with the recent activity translator`);
  assert.notEqual(getAdminRecentActivityCopy(label, 'fa'), label, `${label} should have Persian copy`);
}

for (const label of sourceLabels) {
  assert.ok(copySource.includes(`${label}:`), `${label} source key should stay in recent activity copy`);
  assert.notEqual(getAdminRecentActivityCopy(label, 'fa'), label, `${label} source should have Persian copy`);
}

assert.ok(panelSource.includes('createAdminRecentActivityTranslator(locale)'), 'panel should create the recent activity translator with the requested locale');
assert.ok(panelSource.includes('translateRecentActivitySource(row.source, locale)'), 'row sources should stay routed through the source translator');
assert.ok(panelSource.includes('actorLabel(row.actorLabel, locale)'), 'actor labels should stay routed through localized actorLabel');
assert.ok(panelSource.includes("value === 'System activity' ? t('System activity') : value"), 'system actor label should stay localized');

for (const raw of ['>Analytics<', '>Recent activity timeline<', '>Activities reviewed<', '>Staff activities<', '>System activities<']) {
  assert.ok(!panelSource.includes(raw), `${raw} should not be rendered as raw JSX text`);
}
