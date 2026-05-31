import assert from 'node:assert/strict';
import {
  createInquiryAssigneeFromAdminIdentity,
  getInquiryAssigneeLabel,
  isInquiryAssigned,
  normalizeInquiryAssignee
} from '../../lib/inquiries/inquiry-assignment';

const assignedAt = new Date('2026-05-31T12:00:00.000Z');

export async function runInquiryAssignmentTests() {
  assert.equal(normalizeInquiryAssignee({}), undefined);
  assert.deepEqual(
    normalizeInquiryAssignee({
      adminId: ' admin-1 ',
      label: ' Staff User ',
      email: ' staff@example.invalid ',
      role: ' staff ',
      assignedAt
    }),
    {
      adminId: 'admin-1',
      label: 'Staff User',
      email: 'staff@example.invalid',
      role: 'staff',
      assignedAt
    }
  );

  assert.deepEqual(
    createInquiryAssigneeFromAdminIdentity(
      {
        authenticated: true,
        type: 'password',
        provider: 'password',
        label: 'Owner User',
        email: 'owner@example.invalid',
        role: 'owner'
      },
      assignedAt
    ),
    {
      adminId: 'owner@example.invalid',
      label: 'Owner User',
      email: 'owner@example.invalid',
      role: 'owner',
      assignedAt
    }
  );

  assert.equal(
    createInquiryAssigneeFromAdminIdentity({ authenticated: false, type: 'password', provider: 'password', label: 'Admin', role: 'staff' }, assignedAt),
    undefined
  );

  assert.equal(getInquiryAssigneeLabel(undefined), 'Unassigned');
  assert.equal(getInquiryAssigneeLabel({ email: 'staff@example.invalid' }), 'staff@example.invalid');
  assert.equal(getInquiryAssigneeLabel({ adminId: 'staff-id' }), 'staff-id');
  assert.equal(getInquiryAssigneeLabel({ label: 'Staff User', email: 'staff@example.invalid' }), 'Staff User');

  assert.equal(isInquiryAssigned(undefined), false);
  assert.equal(isInquiryAssigned({}), false);
  assert.equal(isInquiryAssigned({ assignedAt }), true);
  assert.equal(isInquiryAssigned({ label: 'Staff User' }), true);

  console.log('inquiry-assignment.test.ts passed');
}
