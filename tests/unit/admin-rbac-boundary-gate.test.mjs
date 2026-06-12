import assert from 'node:assert/strict';
import { collectAdminRbacFailures } from '../../tools/check-admin-action-boundaries.mjs';

const sources = {
  'app/admin/settings/actions.ts': `
export async function updateStoreSettingAction(formData) {
  await assertAdminRole('owner');
}
export async function updatePaymentProviderSettingAction(formData) {
  await assertAdminRole('owner');
}
export async function updateNotificationProviderSettingAction(formData) {
  await assertAdminRole('owner');
}
export async function updateWebhookConfigurationAction(formData) {
  await assertAdminRole('owner');
}
export async function updateIntegrationAppRegistryAction(formData) {
  await assertAdminRole('owner');
}
export async function updateApiTokenManagementAction(formData) {
  await assertAdminRole('owner');
}
export async function updateDashboardExtensionMountPointAction(formData) {
  await assertAdminRole('owner');
}
export async function updateImportExportJobTrackingAction(formData) {
  await assertAdminRole('owner');
}
export async function updateStaffPermissionGroupAction(formData) {
  await assertAdminRole('owner');
}
export async function updateStaffAccountAction(formData) {
  await assertAdminRole('owner');
}
`,
  'app/admin/order-actions.ts': `
export async function createStaffDraftOrderAction(formData) {
  await assertAdminRole('staff');
}
export async function updateOrderStatusAction(orderId, formData) {
  await assertAdminRole('staff');
}
export async function addOrderLineItemAction(orderId, formData) {
  await assertAdminRole('staff');
}
export async function updateOrderLineItemQuantityAction(orderId, itemId, formData) {
  await assertAdminRole('staff');
}
export async function removeOrderLineItemAction(orderId, itemId) {
  await assertAdminRole('staff');
}
export async function updateOrderDiscountAction(orderId, formData) {
  await assertAdminRole('owner');
}
export async function updateOrderCustomerAssignmentAction(orderId, formData) {
  await assertAdminRole('staff');
}
export async function markOrderManualPaymentAction(orderId, formData) {
  await assertAdminRole('owner');
}
export async function addOrderTimelineNoteAction(orderId, formData) {
  await assertAdminRole('staff');
}
export async function updateOrderFulfillmentAction(orderId, formData) {
  await assertAdminRole('staff');
}
export async function queueOrderNotificationAction(orderId, formData) {
  await assertAdminRole('staff');
}
export async function recordOrderNotificationAttemptAction(orderId, notificationId, status, formData) {
  await assertAdminRole('staff');
}
`,
  'app/admin/actions.ts': `
export async function createProductAction(formData) {
  await ensureCanWriteCms();
  await assertAdminRole('owner');
}
export async function updateProductAction(productId, formData) {
  await ensureCanWriteCms();
  await assertAdminRole('owner');
}
export async function deleteProductAction(productId) {
  await ensureCanWriteCms();
  await assertAdminRole('owner');
}
export async function createCategoryAction(formData) {
  await ensureCanWriteCms();
  await assertAdminRole('owner');
}
export async function updateCategoryAction(categoryId, formData) {
  await ensureCanWriteCms();
  await assertAdminRole('owner');
}
export async function deleteCategoryAction(categoryId) {
  await ensureCanWriteCms();
  await assertAdminRole('owner');
}
export async function deleteMediaAction(mediaId) {
  await ensureCanWriteCms();
  await assertAdminRole('owner');
}
`,
  'app/admin/inquiry-actions.ts': `
export async function saveInquiryAction(formData) {
  await assertAdminRole('staff');
}
export async function addInquiryFollowUpAction(formData) {
  await assertAdminRole('staff');
}
`
};

const pass = collectAdminRbacFailures({
  readFile: (file) => sources[file]
});
assert.equal(pass.failures.length, 0);
assert.ok(pass.checked.includes('app/admin/settings/actions.ts:updateStaffAccountAction:owner'));
assert.ok(pass.checked.includes('app/admin/order-actions.ts:markOrderManualPaymentAction:owner'));
assert.ok(pass.checked.includes('app/admin/order-actions.ts:updateOrderFulfillmentAction:staff'));

const fail = collectAdminRbacFailures({
  readFile: (file) => {
    if (file === 'app/admin/settings/actions.ts') {
      return sources[file].replace("updateStaffAccountAction(formData) {\n  await assertAdminRole('owner');", "updateStaffAccountAction(formData) {\n  await assertAdminRole('staff');");
    }
    if (file === 'app/admin/order-actions.ts') {
      return sources[file].replace("markOrderManualPaymentAction(orderId, formData) {\n  await assertAdminRole('owner');", "markOrderManualPaymentAction(orderId, formData) {\n  await assertAdminRole('staff');");
    }
    return sources[file];
  }
});
assert.deepEqual(fail.failures, [
  "app/admin/settings/actions.ts: updateStaffAccountAction must require assertAdminRole('owner')",
  "app/admin/order-actions.ts: markOrderManualPaymentAction must require assertAdminRole('owner')"
]);

console.log('admin-rbac-boundary-gate.test.mjs passed');
