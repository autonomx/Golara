import assert from 'node:assert/strict';
import {
  createAdminAccountReadinessRecord,
  createAdminAccountReadinessSummary,
  getAdminAccountAssignmentKey,
  normalizeAdminAccountInput
} from '../../lib/admin-account-core';

const createdAt = new Date('2026-05-31T12:00:00.000Z');
const updatedAt = new Date('2026-05-31T13:00:00.000Z');
const lastLoginAt = new Date('2026-05-31T14:00:00.000Z');

export async function runAdminAccountCoreTests() {
  const owner = normalizeAdminAccountInput({
    provider: ' password ',
    providerAccountId: ' owner ',
    label: ' Owner User ',
    email: ' owner@example.invalid ',
    role: ' owner ',
    metadata: { source: 'seed' }
  });

  assert.deepEqual(owner, {
    provider: 'password',
    providerAccountId: 'owner',
    label: 'Owner User',
    email: 'owner@example.invalid',
    role: 'owner',
    isActive: true,
    metadata: { source: 'seed' }
  });

  assert.deepEqual(
    normalizeAdminAccountInput({
      providerAccountId: 'staff-1',
      label: 'Staff User',
      role: 'staff',
      isActive: false
    }),
    {
      provider: 'password',
      providerAccountId: 'staff-1',
      label: 'Staff User',
      email: undefined,
      role: 'staff',
      isActive: false,
      metadata: undefined
    }
  );

  assert.equal(normalizeAdminAccountInput({ providerAccountId: 'x', label: 'X', role: 'bad' }).role, 'owner');
  assert.throws(() => normalizeAdminAccountInput({ providerAccountId: ' ', label: 'Admin' }), /providerAccountId is required/);
  assert.throws(() => normalizeAdminAccountInput({ providerAccountId: 'admin', label: ' ' }), /label is required/);

  assert.equal(getAdminAccountAssignmentKey(owner), 'owner@example.invalid');
  assert.equal(getAdminAccountAssignmentKey({ ...owner, email: undefined }), 'owner');

  assert.deepEqual(createAdminAccountReadinessRecord({
    id: 'admin-1',
    providerAccountId: 'owner@example.invalid',
    label: 'Owner User',
    email: 'owner@example.invalid',
    role: 'owner',
    isActive: true,
    lastLoginAt,
    createdAt,
    updatedAt
  }), {
    id: 'admin-1',
    provider: 'password',
    providerAccountId: 'owner@example.invalid',
    label: 'Owner User',
    email: 'owner@example.invalid',
    role: 'owner',
    isActive: true,
    metadata: undefined,
    assignmentKey: 'owner@example.invalid',
    accessStatus: 'active',
    lastLoginAt,
    createdAt,
    updatedAt
  });

  const summary = createAdminAccountReadinessSummary([
    createAdminAccountReadinessRecord({ providerAccountId: 'owner@example.invalid', label: 'Owner User', email: 'owner@example.invalid', role: 'owner' }),
    createAdminAccountReadinessRecord({ providerAccountId: 'staff-1', label: 'Staff User', role: 'staff' }),
    createAdminAccountReadinessRecord({ providerAccountId: 'disabled@example.invalid', label: 'Disabled Staff', email: 'disabled@example.invalid', role: 'staff', isActive: false })
  ]);

  assert.equal(summary.total, 3);
  assert.equal(summary.active, 2);
  assert.equal(summary.inactive, 1);
  assert.equal(summary.owners, 1);
  assert.equal(summary.staff, 1);
  assert.equal(summary.missingEmail, 1);
  assert.equal(summary.assignable, 2);
  assert.equal(summary.assignmentStable, true);
  assert.equal(summary.rotationRunbook.length, 4);

  console.log('admin-account-core.test.ts passed');
}
