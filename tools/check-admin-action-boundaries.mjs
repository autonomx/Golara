#!/usr/bin/env node

import { readFileSync } from 'node:fs';

const ownerRequiredExports = new Map([
  ['app/admin/settings/actions.ts', [
    'updateStoreSettingAction',
    'updatePaymentProviderSettingAction',
    'updateNotificationProviderSettingAction',
    'updateWebhookConfigurationAction',
    'updateIntegrationAppRegistryAction',
    'updateApiTokenManagementAction',
    'updateDashboardExtensionMountPointAction',
    'updateImportExportJobTrackingAction',
    'updateStaffPermissionGroupAction',
    'updateStaffAccountAction'
  ]],
  ['app/admin/order-actions.ts', [
    'updateOrderDiscountAction',
    'markOrderManualPaymentAction'
  ]],
  ['app/admin/actions.ts', [
    'createProductAction',
    'updateProductAction',
    'deleteProductAction',
    'createCategoryAction',
    'updateCategoryAction',
    'deleteCategoryAction',
    'deleteMediaAction'
  ]]
]);

const staffRequiredExports = new Map([
  ['app/admin/inquiry-actions.ts', ['saveInquiryAction', 'addInquiryFollowUpAction']],
  ['app/admin/order-actions.ts', [
    'createStaffDraftOrderAction',
    'updateOrderStatusAction',
    'addOrderLineItemAction',
    'updateOrderLineItemQuantityAction',
    'removeOrderLineItemAction',
    'updateOrderCustomerAssignmentAction',
    'addOrderTimelineNoteAction',
    'updateOrderFulfillmentAction',
    'queueOrderNotificationAction',
    'recordOrderNotificationAttemptAction'
  ]]
]);

function findExportStart(source, exportName) {
  const needle = `export async function ${exportName}`;
  const index = source.indexOf(needle);
  if (index >= 0) return index;
  return source.indexOf(`export async function\n${exportName}`);
}

function exportedFunctionBody(source, exportName) {
  const start = findExportStart(source, exportName);
  if (start < 0) return '';
  const next = source.indexOf('\nexport async function ', start + 1);
  return next >= 0 ? source.slice(start, next) : source.slice(start);
}

function requiresRole(source, exportName, role) {
  const body = exportedFunctionBody(source, exportName);
  const requiredCall = `assertAdminRole('${role}')`;
  const requiredDoubleQuoteCall = `assertAdminRole("${role}")`;
  return body.includes(requiredCall) || body.includes(requiredDoubleQuoteCall);
}

export function collectAdminRbacFailures({ readFile = readFileSync } = {}) {
  const failures = [];
  const checked = [];

  for (const [file, exports] of ownerRequiredExports) {
    const source = readFile(file, 'utf8');
    for (const exportName of exports) {
      checked.push(`${file}:${exportName}:owner`);
      if (!requiresRole(source, exportName, 'owner')) {
        failures.push(`${file}: ${exportName} must require assertAdminRole('owner')`);
      }
    }
  }

  for (const [file, exports] of staffRequiredExports) {
    const source = readFile(file, 'utf8');
    for (const exportName of exports) {
      checked.push(`${file}:${exportName}:staff`);
      if (!requiresRole(source, exportName, 'staff')) {
        failures.push(`${file}: ${exportName} must require assertAdminRole('staff')`);
      }
    }
  }

  return { checked, failures };
}

export function runAdminRbacBoundaryCheck() {
  const { checked, failures } = collectAdminRbacFailures();

  if (failures.length > 0) {
    console.error('Admin RBAC boundary check failed:');
    for (const failure of failures) console.error(`- ${failure}`);
    process.exit(1);
  }

  console.log(`admin RBAC boundary checks passed (${checked.length} role requirements checked)`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runAdminRbacBoundaryCheck();
}
