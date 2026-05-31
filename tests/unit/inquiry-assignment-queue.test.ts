import assert from 'node:assert/strict';
import type { AdminIdentity } from '../../lib/admin-auth-core';
import type { CustomerInquiry } from '../../lib/catalog';
import {
  createInquiryAssignmentQueueSummary,
  filterInquiriesByAssignmentQueue,
  getInquiryAssignmentQueueKey,
  getInquiryAssignmentQueueLabel,
  inquiryAssignedToIdentity
} from '../../lib/inquiries/inquiry-assignment-queue';

const ownerIdentity: AdminIdentity = {
  authenticated: true,
  type: 'password',
  provider: 'password',
  label: 'Owner User',
  email: 'owner@example.invalid',
  role: 'owner'
};

function inquiry(overrides: Partial<CustomerInquiry> = {}): CustomerInquiry {
  return {
    id: 'inquiry-1',
    name: 'Mina Customer',
    email: 'mina@example.invalid',
    phone: '555-0101',
    message: 'Can you prepare this arrangement?',
    status: 'new',
    createdAt: new Date('2026-05-31T10:00:00.000Z'),
    ...overrides
  };
}

export async function runInquiryAssignmentQueueTests() {
  const mineByEmail = inquiry({ id: 'mine-email', assignee: { adminId: 'owner@example.invalid', label: 'Owner User', email: 'owner@example.invalid' } });
  const mineByLabel = inquiry({ id: 'mine-label', assignee: { adminId: 'Owner User' } });
  const assignedToStaff = inquiry({ id: 'assigned-staff', assignee: { adminId: 'staff@example.invalid', label: 'Staff User', email: 'staff@example.invalid' } });
  const unassigned = inquiry({ id: 'unassigned' });

  assert.equal(inquiryAssignedToIdentity(mineByEmail, ownerIdentity), true);
  assert.equal(inquiryAssignedToIdentity(mineByLabel, ownerIdentity), true);
  assert.equal(inquiryAssignedToIdentity(assignedToStaff, ownerIdentity), false);
  assert.equal(inquiryAssignedToIdentity(mineByEmail, { ...ownerIdentity, authenticated: false }), false);
  assert.equal(inquiryAssignedToIdentity(unassigned, ownerIdentity), false);

  assert.equal(getInquiryAssignmentQueueKey(mineByEmail, ownerIdentity), 'mine');
  assert.equal(getInquiryAssignmentQueueKey(assignedToStaff, ownerIdentity), 'assigned');
  assert.equal(getInquiryAssignmentQueueKey(unassigned, ownerIdentity), 'unassigned');
  assert.equal(getInquiryAssignmentQueueLabel(mineByEmail, ownerIdentity), 'Assigned to me');
  assert.equal(getInquiryAssignmentQueueLabel(assignedToStaff, ownerIdentity), 'Assigned to Staff User');
  assert.equal(getInquiryAssignmentQueueLabel(unassigned, ownerIdentity), 'Unassigned');

  const inquiries = [mineByEmail, mineByLabel, assignedToStaff, unassigned];
  assert.deepEqual(filterInquiriesByAssignmentQueue(inquiries, 'mine', ownerIdentity).map((item) => item.id), ['mine-email', 'mine-label']);
  assert.deepEqual(filterInquiriesByAssignmentQueue(inquiries, 'assigned', ownerIdentity).map((item) => item.id), ['assigned-staff']);
  assert.deepEqual(filterInquiriesByAssignmentQueue(inquiries, 'unassigned', ownerIdentity).map((item) => item.id), ['unassigned']);
  assert.deepEqual(filterInquiriesByAssignmentQueue(inquiries, 'all', ownerIdentity).map((item) => item.id), inquiries.map((item) => item.id));

  assert.deepEqual(createInquiryAssignmentQueueSummary(inquiries, ownerIdentity), {
    total: 4,
    mine: 2,
    assigned: 1,
    unassigned: 1,
    queues: [
      {
        key: 'mine',
        label: 'Mine',
        description: 'Inquiries assigned to the signed-in admin identity.',
        count: 2
      },
      {
        key: 'assigned',
        label: 'Assigned',
        description: 'Inquiries owned by another staff member or role.',
        count: 1
      },
      {
        key: 'unassigned',
        label: 'Unassigned',
        description: 'Inquiries that still need an owner.',
        count: 1
      }
    ]
  });

  console.log('inquiry-assignment-queue.test.ts passed');
}
