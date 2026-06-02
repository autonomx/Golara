'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertAdminRole } from '@/lib/admin-auth';
import { cmsCategoryService } from '@/lib/cms/category-service';
import { cmsHomepageService } from '@/lib/cms/homepage-service';
import { cmsMediaService } from '@/lib/cms/media-service';
import { cmsProductService } from '@/lib/cms/product-service';
import { normalizeLocale } from '@/lib/i18n/locales';
import { normalizeImageUrl } from '@/lib/media/media-storage';
import { hasDatabase, prisma } from '@/lib/prisma';

async function ensureCanWriteCms() {
  await assertAdminRole('owner');

  if (!hasDatabase()) {
    throw new Error('DATABASE_URL is not configured. Add a PostgreSQL connection before using admin write actions.');
  }
}

function tabForStatus(status: string) {
  if (status.startsWith('product-')) return 'products';
  if (status.startsWith('category-')) return 'categories';
  if (status.startsWith('media-')) return 'media';
  if (status.startsWith('homepage-')) return 'content';
  return 'overview';
}

function adminPath(status: string, message?: string) {
  const tab = tabForStatus(status);
  const params = new URLSearchParams({ status });
  if (message) params.set('message', message);
  if (tab === 'products') return `/admin/products?${params.toString()}`;
  if (tab === 'categories') return `/admin/categories?${params.toString()}`;
  if (tab === 'media') return `/admin/media?${params.toString()}`;
  params.set('tab', tab);
  return `/admin?${params.toString()}`;
}

function stringField(formData: FormData, name: string, fallback = '') {
  const value = formData.get(name);
  if (typeof value !== 'string') return fallback;
  return value.trim();
}

function optionalString(formData: FormData, name: string) {
  return stringField(formData, name) || undefined;
}

function requiredString(formData: FormData, name: string) {
  const value = stringField(formData, name);
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function boolField(formData: FormData, name: string) {
  return formData.get(name) === 'on';
}

function intField(formData: FormData, name: string, fallback = 0) {
  const value = Number.parseInt(stringField(formData, name, String(fallback)), 10);
  return Number.isFinite(value) ? value : fallback;
}

function priceCentsField(formData: FormData, name: string) {
  const value = Number.parseFloat(requiredString(formData, name));
  if (!Number.isFinite(value) || value < 0) throw new Error(`${name} must be a positive number`);
  return Math.round(value * 100);
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function resolveImageUrl(formData: FormData) {
  const selectedMediaUrl = stringField(formData, 'selectedMediaUrl');
  const imageUrl = stringField(formData, 'imageUrl');
  if (selectedMediaUrl) return selectedMediaUrl;
  if (imageUrl) return normalizeImageUrl(imageUrl);
  throw new Error('Choose a media-library image or provide an image URL.');
}

function resolveOptionalImageUrl(formData: FormData, selectedName: string, manualName: string) {
  const selectedMediaUrl = stringField(formData, selectedName);
  const imageUrl = stringField(formData, manualName);
  if (selectedMediaUrl) return selectedMediaUrl;
  if (imageUrl) return normalizeImageUrl(imageUrl);
  return null;
}

function parentCategoryId(formData: FormData, categoryId?: string) {
  const parentId = optionalString(formData, 'parentId');
  if (!parentId || parentId === categoryId) return null;
  return parentId;
}

function formIds(formData: FormData, name: string) {
  return formData
    .getAll(name)
    .filter((value): value is string => typeof value === 'string' && Boolean(value.trim()));
}

function revalidateCatalog() {
  revalidatePath('/');
  revalidatePath('/products');
  revalidatePath('/admin');
  revalidatePath('/categories/[slug]', 'page');
  revalidatePath('/products/[slug]', 'page');
}

function homepagePayload(formData: FormData) {
  return {
    eyebrow: stringField(formData, 'translationEyebrow'),
    title: requiredString(formData, 'translationTitle'),
    body: stringField(formData, 'translationBody'),
    primaryCtaLabel: stringField(formData, 'translationPrimaryCtaLabel'),
    primaryCtaHref: stringField(formData, 'translationPrimaryCtaHref'),
    secondaryCtaLabel: stringField(formData, 'translationSecondaryCtaLabel'),
    secondaryCtaHref: stringField(formData, 'translationSecondaryCtaHref'),
    panelEyebrow: stringField(formData, 'translationPanelEyebrow'),
    panelTitle: stringField(formData, 'translationPanelTitle'),
    panelBody: stringField(formData, 'translationPanelBody')
  };
}

export async function createMediaFromUrlAction(formData: FormData) {
  await ensureCanWriteCms();

  await cmsMediaService.createFromUrl({
    url: requiredString(formData, 'url'),
    alt: requiredString(formData, 'alt'),
    mediaCategory: requiredString(formData, 'mediaCategory')
  });

  revalidateCatalog();
  redirect(adminPath('media-created'));
}

export async function uploadMediaAction(formData: FormData) {
  await ensureCanWriteCms();

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) throw new Error('Choose an image file to upload.');

  await cmsMediaService.upload({
    file,
    alt: stringField(formData, 'alt') || file.name,
    mediaCategory: requiredString(formData, 'mediaCategory')
  });

  revalidateCatalog();
  redirect(adminPath('media-uploaded'));
}

export async function updateMediaAction(mediaId: string, formData: FormData) {
  await ensureCanWriteCms();
  if (!mediaId) throw new Error('mediaId is required');

  await cmsMediaService.update({
    id: mediaId,
    url: requiredString(formData, 'url'),
    alt: requiredString(formData, 'alt'),
    mediaCategory: requiredString(formData, 'mediaCategory')
  });

  revalidateCatalog();
  redirect(adminPath('media-saved'));
}

export async function updateMediaCategoryAction(mediaId: string, formData: FormData) {
  await ensureCanWriteCms();
  if (!mediaId) throw new Error('mediaId is required');

  await cmsMediaService.updateCategory({
    id: mediaId,
    mediaCategory: requiredString(formData, 'mediaCategory')
  });

  revalidateCatalog();
  redirect(adminPath('media-saved'));
}

export async function createCategoryAction(formData: FormData) {
  await ensureCanWriteCms();

  const title = requiredString(formData, 'title');
  await cmsCategoryService.create({
    title,
    slug: stringField(formData, 'slug') || slugify(title),
    eyebrow: requiredString(formData, 'eyebrow'),
    description: requiredString(formData, 'description'),
    imageUrl: resolveOptionalImageUrl(formData, 'categorySelectedMediaUrl', 'categoryImageUrl'),
    parentId: parentCategoryId(formData),
    showOnHomepage: boolField(formData, 'showOnHomepage'),
    sortOrder: intField(formData, 'sortOrder', 100),
    isActive: boolField(formData, 'isActive')
  });

  revalidateCatalog();
  redirect(adminPath('category-created'));
}

export async function updateCategoryAction(categoryId: string, formData: FormData) {
  await ensureCanWriteCms();
  if (!categoryId) throw new Error('categoryId is required');

  const title = requiredString(formData, 'title');
  await cmsCategoryService.update(categoryId, {
    title,
    slug: stringField(formData, 'slug') || slugify(title),
    eyebrow: requiredString(formData, 'eyebrow'),
    description: requiredString(formData, 'description'),
    imageUrl: resolveOptionalImageUrl(formData, 'categorySelectedMediaUrl', 'categoryImageUrl'),
    parentId: parentCategoryId(formData, categoryId),
    showOnHomepage: boolField(formData, 'showOnHomepage'),
    sortOrder: intField(formData, 'sortOrder', 100),
    isActive: boolField(formData, 'isActive')
  });

  revalidateCatalog();
  redirect(adminPath('category-updated'));
}

export async function upsertCategoryTranslationAction(categoryId: string, formData: FormData) {
  await ensureCanWriteCms();
  if (!categoryId) throw new Error('categoryId is required');

  await cmsCategoryService.upsertTranslation({
    categoryId,
    locale: normalizeLocale(requiredString(formData, 'locale')),
    title: requiredString(formData, 'translationTitle'),
    eyebrow: optionalString(formData, 'translationEyebrow'),
    description: optionalString(formData, 'translationDescription'),
    imageAlt: optionalString(formData, 'translationImageAlt'),
    isPublished: boolField(formData, 'translationIsPublished')
  });

  revalidateCatalog();
  redirect(adminPath('category-translation-updated'));
}

export async function createProductAction(formData: FormData) {
  await ensureCanWriteCms();

  const title = requiredString(formData, 'title');
  await cmsProductService.create({
    title,
    slug: stringField(formData, 'slug') || slugify(title),
    code: requiredString(formData, 'code'),
    description: requiredString(formData, 'description'),
    priceCents: priceCentsField(formData, 'price'),
    currency: stringField(formData, 'currency', 'CAD') || 'CAD',
    imageUrl: resolveImageUrl(formData),
    categoryId: requiredString(formData, 'categoryId'),
    availableToday: boolField(formData, 'availableToday'),
    bestSeller: boolField(formData, 'bestSeller'),
    requiresQuote: boolField(formData, 'requiresQuote'),
    isActive: boolField(formData, 'isActive'),
    sortOrder: intField(formData, 'sortOrder', 0)
  });

  revalidateCatalog();
  redirect(adminPath('product-created'));
}

export async function updateProductAction(productId: string, formData: FormData) {
  await ensureCanWriteCms();
  if (!productId) throw new Error('productId is required');

  const title = requiredString(formData, 'title');
  await cmsProductService.update(productId, {
    title,
    slug: stringField(formData, 'slug') || slugify(title),
    code: requiredString(formData, 'code'),
    description: requiredString(formData, 'description'),
    priceCents: priceCentsField(formData, 'price'),
    currency: stringField(formData, 'currency', 'CAD') || 'CAD',
    imageUrl: resolveImageUrl(formData),
    categoryId: requiredString(formData, 'categoryId'),
    availableToday: boolField(formData, 'availableToday'),
    bestSeller: boolField(formData, 'bestSeller'),
    requiresQuote: boolField(formData, 'requiresQuote'),
    isActive: boolField(formData, 'isActive'),
    sortOrder: intField(formData, 'sortOrder', 0)
  });

  revalidateCatalog();
  redirect(`/admin/products/${productId}?status=product-updated`);
}

export async function createProductVariantAction(productId: string, formData: FormData) {
  await ensureCanWriteCms();
  if (!productId) throw new Error('productId is required');

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { imageUrl: true } });
  if (!product) throw new Error('Product not found.');

  await prisma.productVariant.create({
    data: {
      productId,
      sku: requiredString(formData, 'sku'),
      name: requiredString(formData, 'name'),
      priceCents: priceCentsField(formData, 'price'),
      currency: stringField(formData, 'currency', 'CAD') || 'CAD',
      imageUrl: resolveOptionalImageUrl(formData, 'variantSelectedMediaUrl', 'variantImageUrl') ?? product.imageUrl,
      isActive: boolField(formData, 'isActive'),
      sortOrder: intField(formData, 'sortOrder', 0)
    }
  });

  revalidateCatalog();
  revalidatePath(`/admin/products/${productId}`);
  redirect(`/admin/products/${productId}?status=product-variant-created`);
}

export async function updateProductVariantAction(productId: string, variantId: string, formData: FormData) {
  await ensureCanWriteCms();
  if (!productId) throw new Error('productId is required');
  if (!variantId) throw new Error('variantId is required');

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { imageUrl: true } });
  if (!product) throw new Error('Product not found.');

  await prisma.productVariant.update({
    where: { id: variantId },
    data: {
      sku: requiredString(formData, 'sku'),
      name: requiredString(formData, 'name'),
      priceCents: priceCentsField(formData, 'price'),
      currency: stringField(formData, 'currency', 'CAD') || 'CAD',
      imageUrl: resolveOptionalImageUrl(formData, 'variantSelectedMediaUrl', 'variantImageUrl') ?? product.imageUrl,
      isActive: boolField(formData, 'isActive'),
      sortOrder: intField(formData, 'sortOrder', 0)
    }
  });

  revalidateCatalog();
  revalidatePath(`/admin/products/${productId}`);
  redirect(`/admin/products/${productId}?status=product-variant-updated`);
}

export async function bulkUpdateProductsAction(formData: FormData) {
  await ensureCanWriteCms();

  const productIds = formIds(formData, 'productId');
  const bulkAction = stringField(formData, 'bulkAction');
  const targetCategoryId = optionalString(formData, 'targetCategoryId');

  if (productIds.length === 0) {
    redirect(adminPath('error', 'Select at least one product.'));
  }

  const data =
    bulkAction === 'activate'
      ? { isActive: true }
      : bulkAction === 'deactivate'
        ? { isActive: false }
        : bulkAction === 'mark-best-seller'
          ? { bestSeller: true }
          : bulkAction === 'unmark-best-seller'
            ? { bestSeller: false }
            : bulkAction === 'mark-available-today'
              ? { availableToday: true }
              : bulkAction === 'unmark-available-today'
                ? { availableToday: false }
                : bulkAction === 'move-category' && targetCategoryId
                  ? { categoryId: targetCategoryId }
                  : null;

  if (!data) {
    redirect(adminPath('error', 'Choose a valid bulk action.'));
  }

  const result = await prisma.product.updateMany({
    where: { id: { in: productIds } },
    data
  });

  revalidateCatalog();
  redirect(adminPath('product-bulk-updated', `Updated ${result.count} products.`));
}

export async function upsertProductTranslationAction(productId: string, formData: FormData) {
  await ensureCanWriteCms();
  if (!productId) throw new Error('productId is required');

  await cmsProductService.upsertTranslation({
    productId,
    locale: normalizeLocale(requiredString(formData, 'locale')),
    title: requiredString(formData, 'translationTitle'),
    description: optionalString(formData, 'translationDescription'),
    imageAlt: optionalString(formData, 'translationImageAlt'),
    isPublished: boolField(formData, 'translationIsPublished')
  });

  revalidateCatalog();
  redirect(adminPath('product-translation-updated'));
}

export async function updateHomepageAction(formData: FormData) {
  await ensureCanWriteCms();

  await cmsHomepageService.updateDefault({
    payload: homepagePayload(formData)
  });

  revalidateCatalog();
  redirect(adminPath('homepage-updated'));
}

export async function upsertHomepageTranslationAction(formData: FormData) {
  await ensureCanWriteCms();

  await cmsHomepageService.upsertTranslation({
    locale: normalizeLocale(requiredString(formData, 'locale')),
    payload: homepagePayload(formData),
    isPublished: boolField(formData, 'translationIsPublished')
  });

  revalidateCatalog();
  redirect(adminPath('homepage-translation-updated'));
}
