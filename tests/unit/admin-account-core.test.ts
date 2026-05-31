import assert from 'node:assert/strict';
import { normalizeAdminAccountInput } from '../../lib/admin-account-core';

export async function runAdminAccountCoreTests() {
  assert.deepEqual(
    normalizeAdminAccountInput({
      provider: ' password ',
      providerAccountId: ' owner ',
      label: ' Owner User ',
      email: ' owner@example.invalid ',
      role: ' owner ',
      metadata: { source: 'seed' }
    }),
    {
      provider: 'password',
      providerAccountId: 'owner',
      label: 'Owner User',
      email: 'owner@example.invalid',
      role: 'owner',
      isActive: true,
      metadata: { source: 'seed' }
    }
  );

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

  console.log('admin-account-core.test.ts passed');
}
