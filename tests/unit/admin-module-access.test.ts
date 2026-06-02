import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ADMIN_MODULE_ACCESS_POLICIES,
  ADMIN_MODULE_KEYS,
  buildAdminModuleAccessReadiness,
  canAccessAdminModule,
  getAdminModuleAccessPolicy,
  normalizeAdminModuleKey
} from '../../lib/settings/admin-module-access';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runAdminModuleAccessTests() {
  const policySource = source('lib/settings/admin-module-access.ts');
  const panel = source('components/admin/AdminModuleAccessSettingsPanel.tsx');
  const fulfillmentPanel = source('components/admin/AdminFulfillmentSettingsPanel.tsx');
  const roadmap = source('docs/ADMIN_SALEOR_PARITY_ROADMAP.md');

  assert.match(policySource, /ADMIN_MODULE_KEYS = \[/);
  assert.match(policySource, /ADMIN_MODULE_ACCESS_POLICIES/);
  assert.match(policySource, /export type AdminModuleAccessPolicy/);
  assert.match(policySource, /export function canAccessAdminModule/);
  assert.match(policySource, /export function buildAdminModuleAccessReadiness/);

  assert.equal(ADMIN_MODULE_KEYS.length, 12);
  assert.equal(ADMIN_MODULE_ACCESS_POLICIES.length, ADMIN_MODULE_KEYS.length);
  assert.deepEqual(ADMIN_MODULE_ACCESS_POLICIES.map((policy) => policy.key), [...ADMIN_MODULE_KEYS]);
  assert.equal(normalizeAdminModuleKey(' Orders '), 'orders');
  assert.equal(normalizeAdminModuleKey('bad'), null);

  const settingsPolicy = getAdminModuleAccessPolicy('settings');
  assert.equal(settingsPolicy.readRole, 'owner');
  assert.equal(settingsPolicy.writeRole, 'owner');
  assert.deepEqual(settingsPolicy.writePermissions, ['settings:write']);

  const orderPolicy = getAdminModuleAccessPolicy('orders');
  assert.equal(orderPolicy.readRole, 'staff');
  assert.equal(orderPolicy.writeRole, 'staff');
  assert.deepEqual(orderPolicy.writePermissions, ['orders:write']);

  assert.equal(canAccessAdminModule('owner', [], 'settings', 'write').allowed, true);
  assert.equal(canAccessAdminModule('staff', ['orders:write'], 'orders', 'write').allowed, true);
  assert.equal(canAccessAdminModule('staff', [], 'orders', 'write').allowed, false);
  assert.deepEqual(canAccessAdminModule('staff', [], 'orders', 'write').missingPermissions, ['orders:write']);
  assert.equal(canAccessAdminModule('staff', ['settings:write'], 'settings', 'write').allowed, false);
  assert.match(canAccessAdminModule('staff', ['settings:write'], 'settings', 'write').reason, /owner role is required/);
  assert.equal(canAccessAdminModule('staff', ['catalog:read'], 'products', 'read').allowed, true);
  assert.equal(canAccessAdminModule('staff', ['catalog:read'], 'products', 'write').allowed, false);

  const readiness = buildAdminModuleAccessReadiness();
  assert.equal(readiness.total, ADMIN_MODULE_KEYS.length);
  assert.equal(readiness.ownerWriteModules, 8);
  assert.equal(readiness.staffWriteModules, 4);
  assert.equal(readiness.permissionBackedModules, 12);

  assert.match(panel, /export function AdminModuleAccessSettingsPanel/);
  assert.match(panel, /Role-based module access/);
  assert.match(panel, /ADMIN_MODULE_ACCESS_POLICIES/);
  assert.match(panel, /buildAdminModuleAccessReadiness/);
  assert.match(panel, /Read role/);
  assert.match(panel, /Write role/);
  assert.match(panel, /Write permissions/);

  assert.match(fulfillmentPanel, /AdminModuleAccessSettingsPanel/);

  assert.match(roadmap, /- \[x\] Add role-based access controls for each admin module\./);

  console.log('admin-module-access.test.ts passed');
}
