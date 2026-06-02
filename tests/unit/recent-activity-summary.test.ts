import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { buildRecentActivitySummary } from '../../lib/analytics/recent-activity-summary';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runRecentActivitySummaryTests() {
  const service = source('lib/analytics/recent-activity-summary.ts');
  const panel = source('components/admin/AdminRecentActivitySummaryPanel.tsx');
  const orderPanel = source('components/admin/AdminOrderRevenueSummaryPanel.tsx');
  const roadmap = source('docs/ADMIN_SALEOR_PARITY_ROADMAP.md');

  const now = new Date('2026-06-02T12:00:00Z');
  const summary = buildRecentActivitySummary([
    { id: 'old-order', source: 'order', type: 'order_created', title: 'Order created', actorLabel: null, actorRole: null, entityLabel: 'G-100', createdAt: new Date('2026-06-01T09:00:00Z') },
    { id: 'customer-note', source: 'customer', type: 'staff_note', title: 'Customer note added', note: 'Prefers morning delivery', actorLabel: 'Mina', actorRole: 'staff', entityLabel: 'Ava', createdAt: new Date('2026-06-02T09:00:00Z') },
    { id: 'audit', source: 'admin', type: 'promotion.voucher.create', title: 'Voucher created', actorLabel: 'Owner', actorRole: 'owner', entityLabel: 'promotionVoucher:abc', createdAt: new Date('2026-06-02T10:00:00Z') }
  ], now);

  assert.equal(summary.totalActivities, 3);
  assert.equal(summary.staffActivities, 2);
  assert.equal(summary.systemActivities, 1);
  assert.equal(summary.entries.length, 3);
  assert.equal(summary.entries[0].id, 'admin:audit');
  assert.equal(summary.entries[0].actorLabel, 'Owner / owner');
  assert.equal(summary.entries[1].note, 'Prefers morning delivery');
  assert.equal(summary.entries[2].actorLabel, 'System activity');
  assert.equal(summary.bySource.find((row) => row.source === 'order')?.count, 1);
  assert.equal(summary.bySource.find((row) => row.source === 'customer')?.count, 1);
  assert.equal(summary.bySource.find((row) => row.source === 'admin')?.count, 1);

  const limited = buildRecentActivitySummary([
    { id: '1', source: 'order', type: 'one', title: 'One', createdAt: new Date('2026-06-01T10:00:00Z') },
    { id: '2', source: 'order', type: 'two', title: 'Two', createdAt: new Date('2026-06-01T11:00:00Z') }
  ], now, 1);
  assert.equal(limited.entries.length, 1);
  assert.equal(limited.entries[0].id, 'order:2');

  assert.match(service, /export type RecentActivitySummary/);
  assert.match(service, /buildRecentActivitySummary/);
  assert.match(service, /recentActivitySummaryService = \{/);
  assert.match(service, /prisma\.checkoutOrderTimelineEvent\.findMany/);
  assert.match(service, /prisma\.customerAdminTimelineEvent\.findMany/);
  assert.match(service, /prisma\.adminAuditLog\.findMany/);

  assert.match(panel, /export function AdminRecentActivitySummaryPanel/);
  assert.match(panel, /Recent activity timeline/);
  assert.match(panel, /order timeline events, customer timeline events, and admin audit logs/);
  assert.match(panel, /No recent order, customer, or admin activity/);

  assert.match(orderPanel, /AdminRecentActivitySummaryPanel/);
  assert.match(orderPanel, /recentActivitySummaryService\.summary\(\)/);
  assert.match(orderPanel, /AdminRecentActivitySummaryPanel summary=\{recentActivitySummary\}/);

  assert.match(roadmap, /- \[x\] Add recent activity timeline\./);

  console.log('recent-activity-summary.test.ts passed');
}
