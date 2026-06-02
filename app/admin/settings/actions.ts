'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertAdminRole } from '@/lib/admin-auth';
import { fulfillmentMethodSettingsService } from '@/lib/settings/fulfillment-method-settings';
import { homepageBannerMediaSettingsService } from '@/lib/settings/homepage-banner-media-settings';
import { shippingDeliverySettingsService } from '@/lib/settings/shipping-delivery-settings';
import { storeSettingsService } from '@/lib/settings/store-settings';
import { storefrontNavigationMenuService, type StorefrontNavigationMenuItemInput } from '@/lib/settings/storefront-navigation-menu';

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

function parseNavigationItemsJson(formData: FormData): StorefrontNavigationMenuItemInput[] {
  const value = requiredString(formData, 'itemsJson');
  const parsed = JSON.parse(value) as StorefrontNavigationMenuItemInput[];
  if (!Array.isArray(parsed)) throw new Error('itemsJson must be an array');
  return parsed;
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
