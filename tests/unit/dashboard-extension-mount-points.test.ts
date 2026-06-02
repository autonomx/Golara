import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DEFAULT_DASHBOARD_EXTENSION_MOUNT_POINT,
  buildDashboardExtensionMountPointSummary,
  normalizeDashboardExtensionKey,
  normalizeDashboardExtensionMountPointInput,
  normalizeDashboardExtensionPermission,
  normalizeDashboardExtensionPermissions,
  normalizeDashboardExtensionRole,
  normalizeDashboardExtensionRoles,
  normalizeDashboardExtensionSortOrder,
  normalizeDashboardMountLocation
} from '../../lib/settings/dashboard-extension-mount-points';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runDashboardExtensionMountPointsTests() {
  const service = source('lib/settings/dashboard-extension-mount-points.ts');
  const panel = source('components/admin/AdminDashboardExtensionMountPointsPanel.tsx');
  const fulfillmentPanel = source('components/admin/AdminFulfillmentSettingsPanel.tsx');
  const actions = source('app/admin/settings/actions.ts');
  const migration = source('prisma/migrations/20260603120000_add_dashboard_extension_mount_points/migration.sql');
  const roadmap = source('docs/ADMIN_SALEOR_PARITY_ROADMAP.md');

  assert.equal(normalizeDashboardExtensionKey(' Internal Tools / Ops! '), 'internal-tools-ops');
  assert.equal(normalizeDashboardMountLocation('Order Detail'), 'order_detail');
  assert.equal(normalizeDashboardMountLocation('unknown'), DEFAULT_DASHBOARD_EXTENSION_MOUNT_POINT.mountLocation);
  assert.equal(normalizeDashboardExtensionRole('Owner'), 'owner');
  assert.equal(normalizeDashboardExtensionRole('super-admin'), null);
  assert.equal(normalizeDashboardExtensionPermission(' Admin Extensions Read '), 'admin:extensions:read');
  assert.equal(normalizeDashboardExtensionPermission('invalid'), null);
  assert.deepEqual(normalizeDashboardExtensionRoles('staff, owner\nowner'), ['owner', 'staff']);
  assert.deepEqual(normalizeDashboardExtensionPermissions('admin:tools:write\nadmin tools read'), ['admin:tools:read', 'admin:tools:write']);
  assert.equal(normalizeDashboardExtensionSortOrder('-4'), 0);
  assert.equal(normalizeDashboardExtensionSortOrder('12000'), 10000);

  const normalized = normalizeDashboardExtensionMountPointInput({
    key: 'Ops Widgets',
    label: '  Ops widgets  ',
    description: '  Internal   dashboard  extension  ',
    mountLocation: 'Settings Integrations',
    integrationAppKey: 'Default Webhook App',
    requiredRoles: 'viewer, owner, viewer',
    requiredPermissions: 'admin:extensions:write\nAdmin Extensions Read',
    isInternal: true,
    isActive: true,
    sortOrder: '7'
  });
  assert.equal(normalized.key, 'ops-widgets');
  assert.equal(normalized.label, 'Ops widgets');
  assert.equal(normalized.description, 'Internal dashboard extension');
  assert.equal(normalized.mountLocation, 'settings_integrations');
  assert.equal(normalized.integrationAppKey, 'default-webhook-app');
  assert.deepEqual(normalized.requiredRoles, ['owner', 'viewer']);
  assert.deepEqual(normalized.requiredPermissions, ['admin:extensions:read', 'admin:extensions:write']);
  assert.equal(normalized.sortOrder, 7);

  const summary = buildDashboardExtensionMountPointSummary([
    { ...DEFAULT_DASHBOARD_EXTENSION_MOUNT_POINT, key: 'inactive', label: 'Inactive', mountLocation: 'custom', isActive: false, isInternal: false, sortOrder: 50 },
    { ...DEFAULT_DASHBOARD_EXTENSION_MOUNT_POINT, key: 'active', label: 'Active', mountLocation: 'operations_home', isActive: true, sortOrder: 10 }
  ]);
  assert.equal(summary.total, 2);
  assert.equal(summary.active, 1);
  assert.equal(summary.inactive, 1);
  assert.equal(summary.internal, 1);
  assert.equal(summary.external, 1);
  assert.equal(summary.byLocation.operations_home, 1);
  assert.equal(summary.entries[0].key, 'active');

  assert.match(service, /export const DASHBOARD_EXTENSION_MOUNT_LOCATIONS/);
  assert.match(service, /export const DASHBOARD_EXTENSION_ROLES/);
  assert.match(service, /normalizeDashboardExtensionKey/);
  assert.match(service, /normalizeDashboardMountLocation/);
  assert.match(service, /normalizeDashboardExtensionPermissions/);
  assert.match(service, /buildDashboardExtensionMountPointSummary/);
  assert.match(service, /dashboardExtensionMountPointService = \{/);
  assert.match(service, /recordAdminAuditLog/);
  assert.match(service, /DashboardExtensionMountPoint/);

  assert.match(panel, /export function AdminDashboardExtensionMountPointsPanel/);
  assert.match(panel, /Dashboard extension mount points/);
  assert.match(panel, /updateDashboardExtensionMountPointAction/);
  assert.match(panel, /DASHBOARD_EXTENSION_MOUNT_LOCATIONS/);

  assert.match(fulfillmentPanel, /dashboardExtensionMountPointService\.summary\(\)/);
  assert.match(fulfillmentPanel, /AdminDashboardExtensionMountPointsPanel/);

  assert.match(actions, /dashboardExtensionMountPointService/);
  assert.match(actions, /updateDashboardExtensionMountPointAction/);
  assert.match(actions, /assertAdminRole\('owner'\)/);
  assert.match(actions, /status=dashboard-extension-mount-point-updated/);

  assert.match(migration, /CREATE TABLE IF NOT EXISTS "DashboardExtensionMountPoint"/);
  assert.match(migration, /"mountLocation" TEXT NOT NULL/);
  assert.match(migration, /"requiredRoles" JSONB NOT NULL/);
  assert.match(migration, /"requiredPermissions" JSONB NOT NULL/);
  assert.match(migration, /DashboardExtensionMountPoint_active_sort_idx/);

  assert.match(roadmap, /- \[x\] Add dashboard extension mount points for internal tools\./);

  console.log('dashboard-extension-mount-points.test.ts passed');
}
