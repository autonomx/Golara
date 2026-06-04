import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  buildInquiryOperationsSummary,
  getInquirySource,
  isCancelledInquiryStatus,
  isClosedInquiryStatus,
  isOpenInquiryStatus,
  normalizeInquiryStatus
} from '../../lib/analytics/inquiry-operations-summary';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runInquiryOperationsSummaryTests() {
  const service = source('lib/analytics/inquiry-operations-summary.ts');
  const panel = source('components/admin/AdminInquiryOperationsSummaryPanel.tsx');
  const orderPanel = source('components/admin/AdminOrderRevenueSummaryPanel.tsx');
  const consolePage = source('app/admin/AdminConsolePage.tsx');
  const roadmap = source('docs/ADMIN_SALEOR_PARITY_ROADMAP.md');

  assert.equal(normalizeInquiryStatus('Needs Follow Up!'), 'needs_follow_up');
  assert.equal(isClosedInquiryStatus('fulfilled'), true);
  assert.equal(isClosedInquiryStatus('resolved'), true);
  assert.equal(isCancelledInquiryStatus('Canceled'), true);
  assert.equal(isOpenInquiryStatus('contacted'), true);
  assert.equal(isOpenInquiryStatus('fulfilled'), false);

  const now = new Date('2026-06-02T12:00:00Z');
  const summary = buildInquiryOperationsSummary([
    { id: '1', status: 'new', createdAt: new Date('2026-06-01T12:00:00Z'), productId: 'p1', productTitle: 'Roses' },
    { id: '2', status: 'contacted', createdAt: new Date('2026-05-20T12:00:00Z'), assignee: { label: 'Mina' }, followUps: [{ id: 'f1', note: 'Called', channel: 'phone', createdAt: now }] },
    { id: '3', status: 'fulfilled', createdAt: new Date('2026-04-01T12:00:00Z'), assignee: { email: 'owner@example.com' }, productTitle: 'Lilies' },
    { id: '4', status: 'cancelled', createdAt: new Date('2026-05-31T12:00:00Z') }
  ], now);

  assert.equal(summary.totalInquiries, 4);
  assert.equal(summary.newInquiries, 1);
  assert.equal(summary.openInquiries, 2);
  assert.equal(summary.assignedInquiries, 2);
  assert.equal(summary.unassignedInquiries, 2);
  assert.equal(summary.followUpInquiries, 1);
  assert.equal(summary.closedInquiries, 1);
  assert.equal(summary.cancelledInquiries, 1);
  assert.equal(summary.recentInquiries, 3);
  assert.equal(summary.resolutionRatePercent, 25);
  assert.equal(summary.byStatus[0].count, 1);
  assert.equal(summary.bySource.find((row) => row.source === 'product')?.count, 2);
  assert.equal(getInquirySource({ id: 'source', status: 'new', createdAt: now, productTitle: 'Bouquet' }), 'product');

  assert.match(service, /export type InquiryOperationsSummary/);
  assert.match(service, /buildInquiryOperationsSummary/);
  assert.match(service, /inquiryOperationsSummaryService = \{/);
  assert.match(service, /listInquiries\(\)/);
  assert.doesNotMatch(service, /checkoutOrder/);

  assert.match(panel, /export function AdminInquiryOperationsSummaryPanel/);
  assert.match(panel, /Inquiry operations summary/);
  assert.match(panel, /not an order conversion metric/);
  assert.match(panel, /Recent inquiries/);

  assert.match(orderPanel, /AdminInquiryOperationsSummaryPanel/);
  assert.match(orderPanel, /inquiryOperationsSummaryService\.summary\(\)/);
  assert.match(orderPanel, /AdminInquiryOperationsSummaryPanel summary=\{inquiryOperationsSummary\}/);
  assert.match(consolePage, /const showOverviewExtras = activeTab === 'overview' && overviewSection === 'all'/);
  assert.match(consolePage, /showOverviewExtras && authenticated \? <AdminOrderRevenueSummaryPanel/);

  assert.match(roadmap, /- \[x\] Add inquiry conversion summary\./);

  console.log('inquiry-operations-summary.test.ts passed');
}
