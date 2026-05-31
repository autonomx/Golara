import assert from 'node:assert/strict';
import type { AdminIdentity } from '../../lib/admin-auth-core';
import type { CustomerInquiry } from '../../lib/catalog';
import { createInquiryReportRow, createInquiryReportRows, createInquiryReportSummary, getLatestInquiryFollowUp } from '../../lib/inquiries/inquiry-reporting';

const staffIdentity: AdminIdentity = {
  authenticated: true,
  type: 'password',
  provider: 'password',
  label: 'Staff User',
  email: 'staff@example.invalid',
  role: 'staff'
};

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
    assignee: {
      adminId: 'staff@example.invalid',
      label: 'Staff User',
      email: 'staff@example.invalid',
      role: 'staff',
      assignedAt: new Date('2026-05-31T10:30:00.000Z')
    },
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

  assert.deepEqual(createInquiryReportRow(baseInquiry, staffIdentity), {
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
    assigned: true,
    assigneeLabel: 'Staff User',
    assigneeEmail: 'staff@example.invalid',
    assigneeRole: 'staff',
    assignedAt: new Date('2026-05-31T10:30:00.000Z'),
    assignmentQueue: 'mine',
    assignmentQueueLabel: 'Assigned to me',
    followUpCount: 2,
    latestFollowUpChannel: 'phone',
    latestFollowUpAt: new Date('2026-05-31T12:00:00.000Z'),
    latestFollowUpNote: 'Left voicemail.',
    recommendedAction: 'Record each outreach attempt and move to confirmed once scope, timing, and next step are clear.'
  });

  const rows = createInquiryReportRows([
    baseInquiry,
    inquiry({ id: 'inquiry-2', status: 'new', followUps: [], productTitle: undefined, name: ' ', assignee: undefined }),
    inquiry({ id: 'inquiry-3', status: 'confirmed', followUps: [], assignee: { label: 'Other Staff', email: 'other@example.invalid' } })
  ], staffIdentity);
  assert.equal(rows[1]?.productTitle, 'General inquiry');
  assert.equal(rows[1]?.customerName, '');
  assert.equal(rows[1]?.assigned, false);
  assert.equal(rows[1]?.assigneeLabel, 'Unassigned');
  assert.equal(rows[1]?.assignmentQueue, 'unassigned');
  assert.equal(rows[2]?.assignmentQueue, 'assigned');
  assert.equal(rows[2]?.assignmentQueueLabel, 'Assigned to Other Staff');

  assert.deepEqual(createInquiryReportSummary(rows.map((row, index) => inquiry({ id: `summary-${index}`, status: row.status, followUps: index === 0 ? baseInquiry.followUps : [], assignee: index === 1 ? undefined : index === 2 ? { label: 'Other Staff', email: 'other@example.invalid' } : baseInquiry.assignee })), staffIdentity), {
    total: 3,
    assigned: 2,
    unassigned: 1,
    assignedToMe: 1,
    assignedToOthers: 1,
    withFollowUps: 1,
    withoutFollowUps: 2,
    needsFirstReview: 1,
    waitingOnCustomer: 1,
    readyToFulfill: 1
  });

  console.log('inquiry-reporting.test.ts passed');
}
