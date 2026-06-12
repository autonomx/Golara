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
async function ensureCanWriteCms() {
  await assertAdminRole('owner');
}
export async function createMediaFromUrlAction(formData) {
  await ensureCanWriteCms();
}
export async function uploadMediaAction(formData) {
  await ensureCanWriteCms();
}
export async function updateMediaAction(mediaId, formData) {
  await ensureCanWriteCms();
}
export async function updateMediaCategoryAction(mediaId, formData) {
  await ensureCanWriteCms();
}
export async function createProductAction(formData) {
  await ensureCanWriteCms();
}
export async function updateProductAction(productId, formData) {
  await ensureCanWriteCms();
}
export async function createProductVariantAction(productId, formData) {
  await ensureCanWriteCms();
}
export async function updateProductVariantAction(productId, variantId, formData) {
  await ensureCanWriteCms();
}
export async function updateVariantLocationStockAction(productId, variantId, formData) {
  await ensureCanWriteCms();
}
export async function createCategoryAction(formData) {
  await ensureCanWriteCms();
}
export async function updateCategoryAction(categoryId, formData) {
  await ensureCanWriteCms();
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
assert.ok(pass.checked.includes('app/admin/actions.ts:uploadMediaAction:owner'));

const fail = collectAdminRbacFailures({
  readFile: (file) => {
    if (file === 'app/admin/settings/actions.ts') {
      return sources[file].replace("updateStaffAccountAction(formData) {\n  await assertAdminRole('owner');", "updateStaffAccountAction(formData) {\n  await assertAdminRole('staff');");
    }
    if (file === 'app/admin/order-actions.ts') {
      return sources[file].replace("markOrderManualPaymentAction(orderId, formData) {\n  await assertAdminRole('owner');", "markOrderManualPaymentAction(orderId, formData) {\n  await assertAdminRole('staff');");
    }
    if (file === 'app/admin/actions.ts') {
      return sources[file].replace("async function ensureCanWriteCms() {\n  await assertAdminRole('owner');", "async function ensureCanWriteCms() {\n  await assertAdminRole('staff');");
    }
    return sources[file];
  }
});
assert.deepEqual(fail.failures, [
  "app/admin/settings/actions.ts: updateStaffAccountAction must require assertAdminRole('owner')",
  "app/admin/order-actions.ts: markOrderManualPaymentAction must require assertAdminRole('owner')",
  "app/admin/actions.ts: createMediaFromUrlAction must require assertAdminRole('owner')",
  "app/admin/actions.ts: uploadMediaAction must require assertAdminRole('owner')",
  "app/admin/actions.ts: updateMediaAction must require assertAdminRole('owner')",
  "app/admin/actions.ts: updateMediaCategoryAction must require assertAdminRole('owner')",
  "app/admin/actions.ts: createProductAction must require assertAdminRole('owner')",
  "app/admin/actions.ts: updateProductAction must require assertAdminRole('owner')",
  "app/admin/actions.ts: createProductVariantAction must require assertAdminRole('owner')",
  "app/admin/actions.ts: updateProductVariantAction must require assertAdminRole('owner')",
  "app/admin/actions.ts: updateVariantLocationStockAction must require assertAdminRole('owner')",
  "app/admin/actions.ts: createCategoryAction must require assertAdminRole('owner')",
  "app/admin/actions.ts: updateCategoryAction must require assertAdminRole('owner')"
]);

console.log('admin-rbac-boundary-gate.test.mjs passed');
