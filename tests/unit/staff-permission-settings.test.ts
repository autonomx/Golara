import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DEFAULT_STAFF_PERMISSION_GROUP,
  STAFF_PERMISSION_KEYS,
  buildStaffPermissionSettingsSnapshot,
  normalizeAdminPermissionGroupInput,
  normalizeAdminStaffAccountInput,
  normalizeStaffPermissionKey,
  normalizeStaffPermissionList
} from '../../lib/settings/staff-permission-settings';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runStaffPermissionSettingsTests() {
  const migration = source('prisma/migrations/20260603070000_add_staff_accounts_permission_groups/migration.sql');
  const service = source('lib/settings/staff-permission-settings.ts');
  const panel = source('components/admin/AdminStaffPermissionSettingsPanel.tsx');
  const fulfillmentPanel = source('components/admin/AdminFulfillmentSettingsPanel.tsx');
  const actions = source('app/admin/settings/actions.ts');
  const roadmap = source('docs/ADMIN_SALEOR_PARITY_ROADMAP.md');

  assert.match(migration, /CREATE TABLE IF NOT EXISTS "AdminPermissionGroup"/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS "AdminStaffAccount"/);
  assert.match(migration, /"permissions" JSONB NOT NULL DEFAULT '\[\]'::jsonb/);
  assert.match(migration, /"providerAccountId" TEXT NOT NULL/);
  assert.match(migration, /"permissionGroupKey" TEXT/);
  assert.match(migration, /AdminPermissionGroup_key_key/);
  assert.match(migration, /AdminStaffAccount_provider_account_key/);
  assert.match(migration, /AdminStaffAccount_permissionGroupKey_fkey/);
  assert.match(migration, /'staff-operations'/);

  assert.match(service, /STAFF_PERMISSION_KEYS = \[/);
  assert.match(service, /export type AdminPermissionGroup/);
  assert.match(service, /export type AdminStaffAccount/);
  assert.match(service, /DEFAULT_STAFF_PERMISSION_GROUP/);
  assert.match(service, /normalizeStaffPermissionList/);
  assert.match(service, /normalizeAdminPermissionGroupInput/);
  assert.match(service, /normalizeAdminStaffAccountInput/);
  assert.match(service, /buildStaffPermissionSettingsSnapshot/);
  assert.match(service, /staffPermissionSettingsService = \{/);
  assert.match(service, /FROM "AdminPermissionGroup"/);
  assert.match(service, /FROM "AdminStaffAccount"/);
  assert.match(service, /INSERT INTO "AdminPermissionGroup"/);
  assert.match(service, /INSERT INTO "AdminStaffAccount"/);
  assert.match(service, /action: 'settings\.staff_permission_group\.update'/);
  assert.match(service, /action: 'settings\.staff_account\.update'/);

  assert.equal(DEFAULT_STAFF_PERMISSION_GROUP.key, 'staff-operations');
  assert.equal(DEFAULT_STAFF_PERMISSION_GROUP.role, 'staff');
  assert.ok(STAFF_PERMISSION_KEYS.includes('inquiries:write'));
  assert.equal(normalizeStaffPermissionKey(' Orders:Write '), 'orders:write');
  assert.equal(normalizeStaffPermissionKey('unknown'), null);
  assert.deepEqual(normalizeStaffPermissionList(['orders:write', 'orders:write', 'bad', 'inquiries:read']), ['inquiries:read', 'orders:write']);

  const group = normalizeAdminPermissionGroupInput({
    key: ' Support Team! ',
    label: '  Support team  ',
    description: '  Handles orders  ',
    role: ' staff ',
    permissions: ['orders:read', 'orders:write', 'invalid'],
    isDefault: true,
    isActive: true
  });

  assert.equal(group.key, 'support-team');
  assert.equal(group.label, 'Support team');
  assert.equal(group.description, 'Handles orders');
  assert.equal(group.role, 'staff');
  assert.deepEqual(group.permissions, ['orders:read', 'orders:write']);

  const account = normalizeAdminStaffAccountInput({
    provider: ' password ',
    providerAccountId: ' staff-1 ',
    label: '  Staff User  ',
    email: ' staff@example.invalid ',
    role: ' staff ',
    permissionGroupKey: ' staff-operations ',
    isActive: true
  });

  assert.equal(account.provider, 'password');
  assert.equal(account.providerAccountId, 'staff-1');
  assert.equal(account.label, 'Staff User');
  assert.equal(account.email, 'staff@example.invalid');
  assert.equal(account.role, 'staff');
  assert.equal(account.permissionGroupKey, 'staff-operations');

  const snapshot = buildStaffPermissionSettingsSnapshot([DEFAULT_STAFF_PERMISSION_GROUP], [
    {
      ...account,
      id: 'staff-1',
      assignmentKey: 'staff@example.invalid',
      accessStatus: 'active'
    }
  ]);
  assert.equal(snapshot.groups.length, 1);
  assert.equal(snapshot.accounts.length, 1);
  assert.equal(snapshot.summary.total, 1);
  assert.equal(snapshot.summary.staff, 1);
  assert.equal(snapshot.summary.assignmentStable, true);

  assert.match(panel, /export function AdminStaffPermissionSettingsPanel/);
  assert.match(panel, /updateStaffPermissionGroupAction/);
  assert.match(panel, /updateStaffAccountAction/);
  assert.match(panel, /Staff accounts and permission groups/);
  assert.match(panel, /name="permissions"/);
  assert.match(panel, /Save permission group/);
  assert.match(panel, /Save staff account/);

  assert.match(fulfillmentPanel, /staffPermissionSettingsService\.snapshot\(\)/);
  assert.match(fulfillmentPanel, /AdminStaffPermissionSettingsPanel/);

  assert.match(actions, /updateStaffPermissionGroupAction/);
  assert.match(actions, /updateStaffAccountAction/);
  assert.match(actions, /staffPermissionSettingsService\.updateGroup/);
  assert.match(actions, /staffPermissionSettingsService\.updateAccount/);
  assert.match(actions, /staff-permission-group-updated/);
  assert.match(actions, /staff-account-updated/);
  assert.match(actions, /updateStaffPermissionGroupAction[\s\S]*?assertAdminRole\('owner'\)/);
  assert.match(actions, /updateStaffAccountAction[\s\S]*?assertAdminRole\('owner'\)/);

  assert.match(roadmap, /- \[x\] Add staff accounts and permission groups\./);

  console.log('staff-permission-settings.test.ts passed');
}
