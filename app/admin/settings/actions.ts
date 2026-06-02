'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertAdminRole } from '@/lib/admin-auth';
import { apiTokenManagementService } from '@/lib/settings/api-token-management';
import { dashboardExtensionMountPointService } from '@/lib/settings/dashboard-extension-mount-points';
import { fulfillmentMethodSettingsService } from '@/lib/settings/fulfillment-method-settings';
import { homepageBannerMediaSettingsService } from '@/lib/settings/homepage-banner-media-settings';
import { importExportJobTrackingService } from '@/lib/settings/import-export-job-tracking';
import { integrationAppRegistryService } from '@/lib/settings/integration-app-registry';
import { notificationProviderSettingsService } from '@/lib/settings/notification-provider-settings';
import { paymentProviderSettingsService } from '@/lib/settings/payment-provider-settings';
import { shippingDeliverySettingsService } from '@/lib/settings/shipping-delivery-settings';
import { staffPermissionSettingsService } from '@/lib/settings/staff-permission-settings';
import { storeSettingsService } from '@/lib/settings/store-settings';
import { storefrontNavigationMenuService, type StorefrontNavigationMenuItemInput } from '@/lib/settings/storefront-navigation-menu';
import { taxCategorySettingsService } from '@/lib/settings/tax-category-settings';
import { webhookConfigurationService } from '@/lib/settings/webhook-configuration';

function stringField(formData: FormData, name: string, fallback = '') {
  const value = formData.get(name);
  if (typeof value !== 'string') return fallback;
  return value.trim();
}

function requiredString(formData: FormData, name: string) {
  const value = stringField(formData, name);
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function boolField(formData: FormData, name: string) {
  return formData.getAll(name).includes('on');
}

function intField(formData: FormData, name: string, fallback = 0) {
  const value = Number.parseInt(stringField(formData, name, String(fallback)), 10);
  return Number.isFinite(value) ? value : fallback;
}

function moneyField(formData: FormData, name: string, fallbackCents = 0) {
  const value = stringField(formData, name);
  if (!value) return fallbackCents;
  const parsed = Number.parseFloat(value.replace(/[$,]/g, ''));
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed * 100)) : fallbackCents;
}

function optionalMoneyField(formData: FormData, name: string) {
  const value = stringField(formData, name);
  if (!value) return null;
  const parsed = Number.parseFloat(value.replace(/[$,]/g, ''));
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed * 100)) : null;
}

function basisPointsField(formData: FormData, name: string) {
  const value = stringField(formData, name);
  const parsed = Number.parseFloat(value.replace(/[%]/g, ''));
  return Number.isFinite(parsed) ? Math.max(0, Math.min(10000, Math.round(parsed * 100))) : 0;
}

function parseNavigationItemsJson(formData: FormData): StorefrontNavigationMenuItemInput[] {
  const value = requiredString(formData, 'itemsJson');
  const parsed = JSON.parse(value) as StorefrontNavigationMenuItemInput[];
  if (!Array.isArray(parsed)) throw new Error('itemsJson must be an array');
  return parsed;
}

function listField(formData: FormData, name: string) {
  return stringField(formData, name).split(/[\n,]+/g).map((value) => value.trim()).filter(Boolean);
}

export async function updateStoreSettingAction(formData: FormData) {
  await assertAdminRole('owner');

  await storeSettingsService.update({
    storeName: requiredString(formData, 'storeName'),
    legalName: stringField(formData, 'legalName') || null,
    supportEmail: stringField(formData, 'supportEmail') || null,
    supportPhone: stringField(formData, 'supportPhone') || null,
    defaultLocale: requiredString(formData, 'defaultLocale'),
    defaultCurrency: requiredString(formData, 'defaultCurrency'),
    timezone: requiredString(formData, 'timezone'),
    storefrontBaseUrl: stringField(formData, 'storefrontBaseUrl') || null,
    isMaintenanceMode: boolField(formData, 'isMaintenanceMode')
  });

  revalidatePath('/admin');
  revalidatePath('/admin/settings');
  redirect('/admin/settings?status=store-settings-updated');
}

export async function updateStorefrontNavigationMenuAction(formData: FormData) {
  await assertAdminRole('owner');

  await storefrontNavigationMenuService.update({
    key: requiredString(formData, 'key'),
    label: requiredString(formData, 'label'),
    locale: stringField(formData, 'locale') || null,
    isActive: boolField(formData, 'isActive'),
    items: parseNavigationItemsJson(formData)
  });

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/admin/settings');
  redirect('/admin/settings?status=storefront-navigation-updated');
}

export async function updateHomepageBannerMediaSettingAction(formData: FormData) {
  await assertAdminRole('owner');

  await homepageBannerMediaSettingsService.update({
    key: requiredString(formData, 'key'),
    locale: stringField(formData, 'locale') || null,
    eyebrow: stringField(formData, 'eyebrow') || null,
    title: requiredString(formData, 'title'),
    subtitle: stringField(formData, 'subtitle') || null,
    mediaId: stringField(formData, 'mediaId') || null,
    imageUrl: stringField(formData, 'imageUrl') || null,
    imageAlt: stringField(formData, 'imageAlt') || null,
    ctaLabel: stringField(formData, 'ctaLabel') || null,
    ctaHref: stringField(formData, 'ctaHref') || null,
    isActive: boolField(formData, 'isActive'),
    sortOrder: intField(formData, 'sortOrder', 10)
  });

  revalidatePath('/');
  revalidatePath('/admin');
  revalidatePath('/admin/settings');
  redirect('/admin/settings?status=homepage-banner-media-updated');
}

export async function updateShippingDeliverySettingAction(formData: FormData) {
  await assertAdminRole('owner');

  await shippingDeliverySettingsService.update({
    key: requiredString(formData, 'key'),
    label: requiredString(formData, 'label'),
    description: stringField(formData, 'description') || null,
    deliveryFeeCents: moneyField(formData, 'deliveryFee', 0),
    freeDeliveryMinimumCents: optionalMoneyField(formData, 'freeDeliveryMinimum'),
    minimumOrderCents: optionalMoneyField(formData, 'minimumOrder'),
    deliveryRadiusKm: intField(formData, 'deliveryRadiusKm', 0),
    deliveryPostalCodes: stringField(formData, 'deliveryPostalCodes'),
    pickupAddress: stringField(formData, 'pickupAddress') || null,
    deliveryInstructions: stringField(formData, 'deliveryInstructions') || null,
    sameDayCutoffMinutes: intField(formData, 'sameDayCutoffMinutes', 0),
    timezone: requiredString(formData, 'timezone'),
    isActive: boolField(formData, 'isActive')
  });

  revalidatePath('/admin');
  revalidatePath('/admin/settings');
  redirect('/admin/settings?status=shipping-delivery-updated');
}

export async function updateTaxCategorySettingAction(formData: FormData) {
  await assertAdminRole('owner');

  await taxCategorySettingsService.update({
    key: requiredString(formData, 'key'),
    label: requiredString(formData, 'label'),
    description: stringField(formData, 'description') || null,
    taxRateBasisPoints: basisPointsField(formData, 'taxRatePercent'),
    countryCode: requiredString(formData, 'countryCode'),
    regionCode: stringField(formData, 'regionCode') || null,
    appliesToShipping: boolField(formData, 'appliesToShipping'),
    isDefault: boolField(formData, 'isDefault'),
    isActive: boolField(formData, 'isActive')
  });

  revalidatePath('/admin');
  revalidatePath('/admin/settings');
  redirect('/admin/settings?status=tax-category-updated');
}

export async function updatePaymentProviderSettingAction(formData: FormData) {
  await assertAdminRole('owner');

  await paymentProviderSettingsService.update({
    key: requiredString(formData, 'key'),
    label: requiredString(formData, 'label'),
    description: stringField(formData, 'description') || null,
    checkoutMode: requiredString(formData, 'checkoutMode'),
    domesticProvider: requiredString(formData, 'domesticProvider'),
    overseasProvider: stringField(formData, 'overseasProvider') || null,
    domesticCurrency: requiredString(formData, 'domesticCurrency'),
    overseasCurrency: requiredString(formData, 'overseasCurrency'),
    overseasFallback: requiredString(formData, 'overseasFallback'),
    requireIranianGatewayMerchantId: boolField(formData, 'requireIranianGatewayMerchantId'),
    requireStripeSecretKey: boolField(formData, 'requireStripeSecretKey'),
    isDefault: boolField(formData, 'isDefault'),
    isActive: boolField(formData, 'isActive')
  });

  revalidatePath('/admin');
  revalidatePath('/admin/settings');
  redirect('/admin/settings?status=payment-provider-updated');
}

export async function updateNotificationProviderSettingAction(formData: FormData) {
  await assertAdminRole('owner');

  await notificationProviderSettingsService.update({
    key: requiredString(formData, 'key'),
    label: requiredString(formData, 'label'),
    description: stringField(formData, 'description') || null,
    emailProvider: requiredString(formData, 'emailProvider'),
    smsProvider: requiredString(formData, 'smsProvider'),
    defaultFromEmail: stringField(formData, 'defaultFromEmail') || null,
    defaultFromPhone: stringField(formData, 'defaultFromPhone') || null,
    replyToEmail: stringField(formData, 'replyToEmail') || null,
    enableOrderEmail: boolField(formData, 'enableOrderEmail'),
    enableOrderSms: boolField(formData, 'enableOrderSms'),
    requireEmailProviderEnv: boolField(formData, 'requireEmailProviderEnv'),
    requireSmsProviderEnv: boolField(formData, 'requireSmsProviderEnv'),
    isDefault: boolField(formData, 'isDefault'),
    isActive: boolField(formData, 'isActive')
  });

  revalidatePath('/admin');
  revalidatePath('/admin/settings');
  redirect('/admin/settings?status=notification-provider-updated');
}

export async function updateWebhookConfigurationAction(formData: FormData) {
  await assertAdminRole('owner');

  await webhookConfigurationService.update({
    key: requiredString(formData, 'key'),
    label: requiredString(formData, 'label'),
    description: stringField(formData, 'description') || null,
    targetUrl: requiredString(formData, 'targetUrl'),
    events: listField(formData, 'events'),
    secretEnvVar: stringField(formData, 'secretEnvVar') || null,
    headerNames: listField(formData, 'headerNames'),
    isDefault: boolField(formData, 'isDefault'),
    isActive: boolField(formData, 'isActive')
  });

  revalidatePath('/admin');
  revalidatePath('/admin/settings');
  redirect('/admin/settings?status=webhook-configuration-updated');
}

export async function updateIntegrationAppRegistryAction(formData: FormData) {
  await assertAdminRole('owner');

  await integrationAppRegistryService.update({
    key: requiredString(formData, 'key'),
    label: requiredString(formData, 'label'),
    description: stringField(formData, 'description') || null,
    category: requiredString(formData, 'category'),
    provider: stringField(formData, 'provider') || null,
    status: requiredString(formData, 'status'),
    homepageUrl: stringField(formData, 'homepageUrl') || null,
    docsUrl: stringField(formData, 'docsUrl') || null,
    webhookConfigurationKey: stringField(formData, 'webhookConfigurationKey') || null,
    permissions: listField(formData, 'permissions'),
    requiredEnvVars: listField(formData, 'requiredEnvVars'),
    isInternal: boolField(formData, 'isInternal'),
    isActive: boolField(formData, 'isActive')
  });

  revalidatePath('/admin');
  revalidatePath('/admin/settings');
  redirect('/admin/settings?status=integration-app-registry-updated');
}

export async function updateApiTokenManagementAction(formData: FormData) {
  await assertAdminRole('owner');

  await apiTokenManagementService.update({
    key: requiredString(formData, 'key'),
    label: requiredString(formData, 'label'),
    description: stringField(formData, 'description') || null,
    tokenValue: stringField(formData, 'tokenValue') || null,
    tokenPrefix: stringField(formData, 'tokenPrefix') || null,
    scopes: listField(formData, 'scopes'),
    integrationAppKey: stringField(formData, 'integrationAppKey') || null,
    expiresAt: stringField(formData, 'expiresAt') || null,
    isRevoked: boolField(formData, 'isRevoked'),
    isActive: boolField(formData, 'isActive')
  });

  revalidatePath('/admin');
  revalidatePath('/admin/settings');
  redirect('/admin/settings?status=api-token-management-updated');
}

export async function updateDashboardExtensionMountPointAction(formData: FormData) {
  await assertAdminRole('owner');

  await dashboardExtensionMountPointService.update({
    key: requiredString(formData, 'key'),
    label: requiredString(formData, 'label'),
    description: stringField(formData, 'description') || null,
    mountLocation: requiredString(formData, 'mountLocation'),
    integrationAppKey: stringField(formData, 'integrationAppKey') || null,
    requiredRoles: listField(formData, 'requiredRoles'),
    requiredPermissions: listField(formData, 'requiredPermissions'),
    isInternal: boolField(formData, 'isInternal'),
    isActive: boolField(formData, 'isActive'),
    sortOrder: intField(formData, 'sortOrder', 100)
  });

  revalidatePath('/admin');
  revalidatePath('/admin/settings');
  redirect('/admin/settings?status=dashboard-extension-mount-point-updated');
}

export async function updateImportExportJobTrackingAction(formData: FormData) {
  await assertAdminRole('owner');

  await importExportJobTrackingService.upsert({
    key: requiredString(formData, 'key'),
    label: requiredString(formData, 'label'),
    description: stringField(formData, 'description') || null,
    kind: requiredString(formData, 'kind'),
    target: requiredString(formData, 'target'),
    status: requiredString(formData, 'status'),
    requestedBy: stringField(formData, 'requestedBy') || null,
    sourceFilename: stringField(formData, 'sourceFilename') || null,
    sourceMimeType: stringField(formData, 'sourceMimeType') || null,
    inputValue: stringField(formData, 'inputValue') || null,
    outputUrl: stringField(formData, 'outputUrl') || null,
    totalRows: intField(formData, 'totalRows', 0),
    processedRows: intField(formData, 'processedRows', 0),
    failedRows: intField(formData, 'failedRows', 0),
    errorMessage: stringField(formData, 'errorMessage') || null
  });

  revalidatePath('/admin');
  revalidatePath('/admin/settings');
  redirect('/admin/settings?status=import-export-job-tracking-updated');
}

export async function updateStaffPermissionGroupAction(formData: FormData) {
  await assertAdminRole('owner');

  await staffPermissionSettingsService.updateGroup({
    key: requiredString(formData, 'key'),
    label: requiredString(formData, 'label'),
    description: stringField(formData, 'description') || null,
    role: requiredString(formData, 'role'),
    permissions: listField(formData, 'permissions'),
    isDefault: boolField(formData, 'isDefault'),
    isActive: boolField(formData, 'isActive')
  });

  revalidatePath('/admin');
  revalidatePath('/admin/settings');
  redirect('/admin/settings?status=staff-permission-group-updated');
}

export async function updateStaffAccountAction(formData: FormData) {
  await assertAdminRole('owner');

  await staffPermissionSettingsService.updateAccount({
    provider: stringField(formData, 'provider') || 'password',
    providerAccountId: requiredString(formData, 'providerAccountId'),
    label: requiredString(formData, 'label'),
    email: stringField(formData, 'email') || null,
    role: requiredString(formData, 'role'),
    permissionGroupKey: stringField(formData, 'permissionGroupKey') || null,
    isActive: boolField(formData, 'isActive')
  });

  revalidatePath('/admin');
  revalidatePath('/admin/settings');
  redirect('/admin/settings?status=staff-account-updated');
}

export async function updateFulfillmentMethodSettingAction(formData: FormData) {
  await assertAdminRole('owner');

  await fulfillmentMethodSettingsService.update({
    key: requiredString(formData, 'key'),
    label: requiredString(formData, 'label'),
    description: stringField(formData, 'description') || null,
    isActive: boolField(formData, 'isActive'),
    isDefault: boolField(formData, 'isDefault'),
    requiresAddress: boolField(formData, 'requiresAddress'),
    requiresScheduling: boolField(formData, 'requiresScheduling'),
    sortOrder: intField(formData, 'sortOrder', 0)
  });

  revalidatePath('/admin');
  revalidatePath('/admin/settings');
  redirect('/admin/settings?status=fulfillment-method-updated');
}
