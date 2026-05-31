import assert from 'node:assert/strict';
import {
  createInquiryAssigneeForRole,
  createInquiryAssigneeFromAdminIdentity,
  describeInquiryAssignmentChange,
  getInquiryAssigneeLabel,
  isInquiryAssigned,
  normalizeInquiryAssignee,
  parseInquiryAssignmentActionPayload
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

  assert.deepEqual(createInquiryAssigneeForRole('staff', assignedAt), {
    adminId: 'role:staff',
    label: 'Staff queue',
    role: 'staff',
    assignedAt
  });
  assert.deepEqual(createInquiryAssigneeForRole('owner', assignedAt), {
    adminId: 'role:owner',
    label: 'Owner queue',
    role: 'owner',
    assignedAt
  });

  assert.deepEqual(parseInquiryAssignmentActionPayload({}), { type: 'assign-to-me' });
  assert.deepEqual(parseInquiryAssignmentActionPayload({ action: 'assign-to-me' }), { type: 'assign-to-me' });
  assert.deepEqual(parseInquiryAssignmentActionPayload({ action: 'unassign' }), { type: 'unassign' });
  assert.deepEqual(parseInquiryAssignmentActionPayload({ action: 'assign-to-role', role: 'owner' }), { type: 'assign-to-role', role: 'owner' });
  assert.deepEqual(parseInquiryAssignmentActionPayload({ action: 'assign-to-role', role: 'other-role' }), { type: 'assign-to-role', role: 'staff' });
  assert.deepEqual(parseInquiryAssignmentActionPayload({ action: 'other-action' }), { type: 'assign-to-me' });

  assert.equal(getInquiryAssigneeLabel(undefined), 'Unassigned');
  assert.equal(getInquiryAssigneeLabel({ email: 'staff@example.invalid' }), 'staff@example.invalid');
  assert.equal(getInquiryAssigneeLabel({ adminId: 'staff-id' }), 'staff-id');
  assert.equal(getInquiryAssigneeLabel({ label: 'Staff User', email: 'staff@example.invalid' }), 'Staff User');

  assert.equal(isInquiryAssigned(undefined), false);
  assert.equal(isInquiryAssigned({}), false);
  assert.equal(isInquiryAssigned({ assignedAt }), true);
  assert.equal(isInquiryAssigned({ label: 'Staff User' }), true);
  assert.equal(isInquiryAssigned({ role: 'staff' }), true);

  assert.equal(describeInquiryAssignmentChange(undefined, { label: 'Staff User' }), 'Assignment set to Staff User.');
  assert.equal(describeInquiryAssignmentChange({ label: 'Staff User' }, undefined), 'Assignment cleared from Staff User.');
  assert.equal(describeInquiryAssignmentChange({ label: 'Staff User' }, { label: 'Owner User' }), 'Assignment changed from Staff User to Owner User.');

  console.log('inquiry-assignment.test.ts passed');
}
