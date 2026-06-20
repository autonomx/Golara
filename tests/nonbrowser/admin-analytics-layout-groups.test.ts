import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

import { buildAdminAnalyticsLayoutPreview } from '../../lib/analytics/admin-analytics-layout';
import type { AdminAnalyticsResolvedRange } from '../../lib/analytics/admin-analytics-range';

const range: AdminAnalyticsResolvedRange = {
  mode: 'preset',
  label: 'Last 30 days',
  days: 30,
  startDate: new Date('2026-05-21T00:00:00.000Z'),
  endDate: new Date('2026-06-20T00:00:00.000Z')
};

export async function runAdminAnalyticsLayoutGroupTests() {
  const preview = buildAdminAnalyticsLayoutPreview(range);
  assert.equal(preview.status, 'collapsible_groups_active');
  assert.equal(preview.groupHeadersEnabled, true);
  assert.equal(preview.collapsibleGroupsEnabled, true);
  assert.equal(preview.tabsEnabled, false);
  assert.equal(preview.preservesSectionIndex, true);
  assert.equal(preview.preservesRangeLinks, true);
  assert.equal(preview.requiresAccessibleTableFallbacks, true);
  assert.equal(preview.groups.length, 6);
  assert.ok(preview.groups.some((group) => group.defaultOpen));
  assert.ok(preview.groups.every((group) => group.sections.every((section) => section.keepsTableFallback)));
  assert.ok(preview.groups.every((group) => group.sections.every((section) => section.href.includes('/admin/analytics?'))));

  const componentSource = await readFile('components/admin/AdminAnalyticsLayoutGroupHeaders.tsx', 'utf8');
  assert.match(componentSource, /<details/);
  assert.match(componentSource, /<summary/);
  assert.match(componentSource, /open=\{group\.defaultOpen\}/);
  assert.match(componentSource, /aria-label=\{`\$\{group\.label\} analytics links`\}/);
  assert.match(componentSource, /tabs disabled/);
  assert.doesNotMatch(componentSource, /use client|useState|onClick|window\.|localStorage/);
}
