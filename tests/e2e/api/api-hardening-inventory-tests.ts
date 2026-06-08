import assert from 'node:assert/strict';
import { appPath, source, walkFiles } from './api-hardening-source';

function exportedAsyncActions(filePath: string) {
  return [...source(filePath).matchAll(/export async function ([A-Za-z0-9_]+Action)\b/g)].map((match) => match[1]).sort();
}

export async function runRouteActionInventoryHardeningTests() {
  const routes = walkFiles('app', (filePath) => filePath.endsWith('/route.ts')).map(appPath);
  assert.deepEqual(routes, [
    'app/admin/inquiries/export/route.ts',
    'app/admin/orders/csv/route.ts',
    'app/admin/products/export/route.ts',
    'app/api/webhooks/payments/stripe/route.ts',
    'app/api/webhooks/payments/zarinpal/route.ts',
    'app/orders/return/route.ts',
    'app/seed-images/catalog/[slug]/route.ts',
    'app/seed-images/category-real/[slug]/route.ts',
    'app/seed-images/category/[slug]/route.ts',
    'app/seed-images/photo-catalog/[slug]/route.ts',
    'app/seed-images/real-photo/[slug]/route.ts'
  ]);

  const serverActionModules = walkFiles('app', (filePath) => /\.(ts|tsx)$/.test(filePath) && source(filePath).includes("'use server'")).map(appPath);
  assert.deepEqual(serverActionModules, [
    'app/account/actions.ts',
    'app/account/addresses/actions.ts',
    'app/account/login/actions.ts',
    'app/account/profile/actions.ts',
    'app/admin/actions.ts',
    'app/admin/customers/[customerId]/actions.ts',
    'app/admin/homepage/actions.ts',
    'app/admin/homepage/category-actions.ts',
    'app/admin/homepage/product-actions.ts',
    'app/admin/inquiry-actions.ts',
    'app/admin/login/actions.ts',
    'app/admin/logout/actions.ts',
    'app/admin/order-actions.ts',
    'app/admin/settings/actions.ts',
    'app/cart/actions.ts',
    'app/cart/checkout/actions.ts',
    'app/locale/actions.ts',
    'app/products/[slug]/actions.ts',
    'app/products/[slug]/checkout-actions.ts'
  ]);

  const expectedActions: Record<string, string[]> = {
    'app/account/actions.ts': ['logoutCustomerAction'],
    'app/account/addresses/actions.ts': ['addAccountAddressAction', 'deleteAccountAddressAction', 'setDefaultAccountAddressAction', 'updateAccountAddressAction'],
    'app/account/login/actions.ts': ['requestCustomerOtpAction', 'verifyCustomerOtpAction'],
    'app/account/profile/actions.ts': ['updateAccountProfileAction'],
    'app/admin/actions.ts': [
      'bulkUpdateProductsAction',
      'createCategoryAction',
      'createCollectionAction',
      'createMediaFromUrlAction',
      'createProductAction',
      'createProductAttributeAction',
      'createProductTypeAction',
      'createProductVariantAction',
      'importProductsCsvAction',
      'quickEditProductsAction',
      'updateCategoryAction',
      'updateCollectionAction',
      'updateHomepageAction',
      'updateMediaAction',
      'updateMediaCategoryAction',
      'updateProductAction',
      'updateProductAttributeAction',
      'updateProductAttributeValuesAction',
      'updateProductCollectionsAction',
      'updateProductTypeAction',
      'updateProductVariantAction',
      'updateVariantLocationStockAction',
      'uploadMediaAction',
      'upsertCategoryTranslationAction',
      'upsertHomepageTranslationAction',
      'upsertProductTranslationAction'
    ],
    'app/admin/customers/[customerId]/actions.ts': ['addAdminCustomerTimelineNoteAction', 'updateAdminCustomerProfileAction'],
    'app/admin/homepage/actions.ts': ['updateExpandedHomepageAction'],
    'app/admin/homepage/category-actions.ts': ['addHomepageCategoryTileAction', 'removeHomepageCategoryTileAction', 'updateHomepageCategoryTileAction'],
    'app/admin/homepage/product-actions.ts': ['addHomepageFeaturedPickAction', 'removeHomepageFeaturedPickAction', 'updateHomepageFeaturedPickAction'],
    'app/admin/inquiry-actions.ts': ['addInquiryFollowUpAction', 'assignInquiryAction', 'saveInquiryAction'],
    'app/admin/login/actions.ts': ['loginAction'],
    'app/admin/logout/actions.ts': ['logoutAction'],
    'app/admin/order-actions.ts': [
      'addOrderLineItemAction',
      'addOrderTimelineNoteAction',
      'createStaffDraftOrderAction',
      'markOrderManualPaymentAction',
      'queueOrderNotificationAction',
      'recordOrderNotificationAttemptAction',
      'refundManualPaymentAttemptAction',
      'removeOrderLineItemAction',
      'updateOrderCustomerAssignmentAction',
      'updateOrderDiscountAction',
      'updateOrderFulfillmentAction',
      'updateOrderLineItemQuantityAction',
      'updateOrderStatusAction',
      'voidManualPaymentAttemptAction'
    ],
    'app/admin/settings/actions.ts': [
      'updateApiTokenManagementAction',
      'updateDashboardExtensionMountPointAction',
      'updateFulfillmentMethodSettingAction',
      'updateHomepageBannerMediaSettingAction',
      'updateImportExportJobTrackingAction',
      'updateIntegrationAppRegistryAction',
      'updateNotificationProviderSettingAction',
      'updatePaymentProviderSettingAction',
      'updateShippingDeliverySettingAction',
      'updateStaffAccountAction',
      'updateStaffPermissionGroupAction',
      'updateStoreSettingAction',
      'updateStorefrontNavigationMenuAction',
      'updateTaxCategorySettingAction',
      'updateWebhookConfigurationAction'
    ],
    'app/cart/actions.ts': ['addToCartAction', 'clearCartAction', 'removeCartItemAction', 'updateCartItemAction'],
    'app/cart/checkout/actions.ts': ['createCartCheckoutAction'],
    'app/locale/actions.ts': ['setStorefrontLocaleAction'],
    'app/products/[slug]/actions.ts': ['createInquiryAction'],
    'app/products/[slug]/checkout-actions.ts': ['createCheckoutAction']
  };
  for (const [filePath, actions] of Object.entries(expectedActions)) {
    assert.deepEqual(exportedAsyncActions(filePath), actions.sort(), `${filePath} exported action inventory`);
  }
}
