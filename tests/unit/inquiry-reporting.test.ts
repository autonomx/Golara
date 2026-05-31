import assert from 'node:assert/strict';
import type { CustomerInquiry } from '../../lib/catalog';
import { createInquiryReportRow, createInquiryReportRows, createInquiryReportSummary, getLatestInquiryFollowUp } from '../../lib/inquiries/inquiry-reporting';

function inquiry(overrides: Partial<CustomerInquiry> = {}): CustomerInquiry {
  return {
    id: 'inquiry-1',
    name: 'Mina Customer',
    email: 'mina@example.invalid',
    phone: '555-0101',
    message: 'Can you prepare this arrangement?',
    productTitle: 'Rose Bouquet',
    deliveryDate: new Date('2026-06-01T10:00:00.000Z'),
    deliveryNotes: 'Morning delivery.',
    staffNotes: 'Prefers pink roses.',
    status: 'contacted',
    createdAt: new Date('2026-05-31T10:00:00.000Z'),
    followUps: [
      { id: 'follow-up-1', channel: 'email', note: 'Sent details.', createdAt: new Date('2026-05-31T11:00:00.000Z') },
      { id: 'follow-up-2', channel: 'phone', note: 'Left voicemail.', createdAt: new Date('2026-05-31T12:00:00.000Z') }
    ],
    ...overrides
  };
}

export async function runInquiryReportingTests() {
  const baseInquiry = inquiry();
  assert.equal(getLatestInquiryFollowUp(baseInquiry)?.id, 'follow-up-2');
  assert.equal(getLatestInquiryFollowUp({ ...baseInquiry, followUps: [] }), undefined);

  assert.deepEqual(createInquiryReportRow(baseInquiry), {
    createdAt: new Date('2026-05-31T10:00:00.000Z'),
    status: 'contacted',
    statusLabel: 'Contacted',
    productTitle: 'Rose Bouquet',
    customerName: 'Mina Customer',
    phone: '555-0101',
    email: 'mina@example.invalid',
    deliveryDate: new Date('2026-06-01T10:00:00.000Z'),
    deliveryNotes: 'Morning delivery.',
    message: 'Can you prepare this arrangement?',
    staffNotes: 'Prefers pink roses.',
    followUpCount: 2,
    latestFollowUpChannel: 'phone',
    latestFollowUpAt: new Date('2026-05-31T12:00:00.000Z'),
    latestFollowUpNote: 'Left voicemail.',
    recommendedAction: 'Record each outreach attempt and move to confirmed once scope, timing, and next step are clear.'
  });

  const rows = createInquiryReportRows([
    baseInquiry,
    inquiry({ id: 'inquiry-2', status: 'new', followUps: [], productTitle: undefined, name: ' ' }),
    inquiry({ id: 'inquiry-3', status: 'confirmed', followUps: [] })
  ]);
  assert.equal(rows[1]?.productTitle, 'General inquiry');
  assert.equal(rows[1]?.customerName, '');

  assert.deepEqual(createInquiryReportSummary(rows.map((row, index) => inquiry({ id: `summary-${index}`, status: row.status, followUps: index === 0 ? baseInquiry.followUps : [] }))), {
    total: 3,
    withFollowUps: 1,
    withoutFollowUps: 2,
    needsFirstReview: 1,
    waitingOnCustomer: 1,
    readyToFulfill: 1
  });

  console.log('inquiry-reporting.test.ts passed');
}
