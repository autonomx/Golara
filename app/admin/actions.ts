'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertAdminRole } from '@/lib/admin-auth';
import { cmsCategoryService } from '@/lib/cms/category-service';
import { cmsHomepageService } from '@/lib/cms/homepage-service';
import { cmsMediaService } from '@/lib/cms/media-service';
import { cmsProductService } from '@/lib/cms/product-service';
import { variantStockAuditService } from '@/lib/inventory/variant-stock-audit-service';
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

function productTypeReturnPath(formData: FormData, status: string) {
  const returnProductId = optionalString(formData, 'returnProductId');
  return returnProductId ? `/admin/products/${returnProductId}?status=${status}` : adminPath(status);
}

function productDetailReturnPath(formData: FormData, status: string) {
  const returnProductId = optionalString(formData, 'returnProductId');
  return returnProductId ? `/admin/products/${returnProductId}?status=${status}` : adminPath(status);
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
  return formData.getAll(name).includes('on');
}

function boolFieldDefault(formData: FormData, name: string, fallback: boolean) {
  return formData.has(name) ? boolField(formData, name) : fallback;
}

function intField(formData: FormData, name: string, fallback = 0) {
  const value = Number.parseInt(stringField(formData, name, String(fallback)), 10);
  return Number.isFinite(value) ? value : fallback;
}

function optionalIntField(formData: FormData, name: string) {
  const raw = optionalString(formData, name);
  if (!raw) return null;
  const value = Number.parseInt(raw, 10);
  return Number.isFinite(value) ? value : null;
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
  if (!(file instanceof File) || file.size === 0) redirect('/admin/media?status=error&message=Choose+an+image+file+to+upload.');

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
    seoTitle: optionalString(formData, 'seoTitle') ?? null,
    seoDescription: optionalString(formData, 'seoDescription') ?? null,
    canonicalPath: optionalString(formData, 'canonicalPath') ?? null,
    seoIndex: boolFieldDefault(formData, 'seoIndex', true),
    priceCents: priceCentsField(formData, 'price'),
    currency: stringField(formData, 'currency', 'CAD') || 'CAD',
    imageUrl: resolveImageUrl(formData),
    categoryId: requiredString(formData, 'categoryId'),
    productTypeId: optionalString(formData, 'productTypeId') ?? null,
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
    seoTitle: optionalString(formData, 'seoTitle') ?? null,
    seoDescription: optionalString(formData, 'seoDescription') ?? null,
    canonicalPath: optionalString(formData, 'canonicalPath') ?? null,
    seoIndex: boolFieldDefault(formData, 'seoIndex', true),
    priceCents: priceCentsField(formData, 'price'),
    currency: stringField(formData, 'currency', 'CAD') || 'CAD',
    imageUrl: resolveImageUrl(formData),
    categoryId: requiredString(formData, 'categoryId'),
    productTypeId: optionalString(formData, 'productTypeId') ?? null,
    availableToday: boolField(formData, 'availableToday'),
    bestSeller: boolField(formData, 'bestSeller'),
    requiresQuote: boolField(formData, 'requiresQuote'),
    isActive: boolField(formData, 'isActive'),
    sortOrder: intField(formData, 'sortOrder', 0)
  });

  revalidateCatalog();
  redirect(`/admin/products/${productId}?status=product-updated`);
}

function optionListField(formData: FormData, name: string) {
  const raw = stringField(formData, name);
  if (!raw) return undefined;
  const options = raw
    .split(/\r?\n|,/)
    .map((option) => option.trim())
    .filter(Boolean);
  return options.length ? options : undefined;
}

function attributeValueEntries(formData: FormData) {
  return formData
    .getAll('attributeId')
    .filter((value): value is string => typeof value === 'string' && Boolean(value.trim()))
    .map((attributeId) => ({ attributeId, value: stringField(formData, `attributeValue:${attributeId}`) }));
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (quoted && char === '"' && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (!quoted && char === ',') {
      row.push(cell.trim());
      cell = '';
    } else if (!quoted && (char === '\n' || char === '\r')) {
      if (char === '\r' && next === '\n') index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = '';
    } else {
      cell += char;
    }
  }

  row.push(cell.trim());
  if (row.some(Boolean)) rows.push(row);
  return rows;
}

function csvRecords(text: string) {
  const [header, ...rows] = parseCsv(text);
  if (!header?.length) return [];
  return rows.map((row) => Object.fromEntries(header.map((key, index) => [key, row[index] ?? ''])));
}

function csvBool(value: string | undefined, fallback = false) {
  if (!value) return fallback;
  return ['true', '1', 'yes', 'on'].includes(value.trim().toLowerCase());
}

function csvPriceCents(value: string | undefined) {
  const parsed = Number.parseFloat(value ?? '0');
  return Number.isFinite(parsed) ? Math.max(0, Math.round(parsed * 100)) : 0;
}

export async function createProductVariantAction(productId: string, formData: FormData) {
  await ensureCanWriteCms();
  if (!productId) throw new Error('productId is required');

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { imageUrl: true, title: true, code: true } });
  if (!product) throw new Error('Product not found.');

  const variant = await prisma.productVariant.create({
    data: {
      productId,
      sku: requiredString(formData, 'sku'),
      name: requiredString(formData, 'name'),
      priceCents: priceCentsField(formData, 'price'),
      currency: stringField(formData, 'currency', 'CAD') || 'CAD',
      imageUrl: resolveOptionalImageUrl(formData, 'variantSelectedMediaUrl', 'variantImageUrl') ?? product.imageUrl,
      stockQuantity: intField(formData, 'stockQuantity', 0),
      trackInventory: boolFieldDefault(formData, 'trackInventory', true),
      lowStockThreshold: optionalIntField(formData, 'lowStockThreshold'),
      isActive: boolField(formData, 'isActive'),
      sortOrder: intField(formData, 'sortOrder', 0)
    }
  });
  await variantStockAuditService.recordChange(null, { ...variant, product });

  revalidateCatalog();
  revalidatePath(`/admin/products/${productId}`);
  redirect(`/admin/products/${productId}?status=product-variant-created`);
}

export async function updateProductVariantAction(productId: string, variantId: string, formData: FormData) {
  await ensureCanWriteCms();
  if (!productId) throw new Error('productId is required');
  if (!variantId) throw new Error('variantId is required');

  const product = await prisma.product.findUnique({ where: { id: productId }, select: { imageUrl: true, title: true, code: true } });
  if (!product) throw new Error('Product not found.');
  const existingVariant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    select: {
      id: true,
      sku: true,
      name: true,
      stockQuantity: true,
      trackInventory: true,
      lowStockThreshold: true,
      product: { select: { title: true, code: true } }
    }
  });
  if (!existingVariant) throw new Error('Variant not found.');

  const variant = await prisma.productVariant.update({
    where: { id: variantId },
    data: {
      sku: requiredString(formData, 'sku'),
      name: requiredString(formData, 'name'),
      priceCents: priceCentsField(formData, 'price'),
      currency: stringField(formData, 'currency', 'CAD') || 'CAD',
      imageUrl: resolveOptionalImageUrl(formData, 'variantSelectedMediaUrl', 'variantImageUrl') ?? product.imageUrl,
      stockQuantity: intField(formData, 'stockQuantity', 0),
      trackInventory: boolFieldDefault(formData, 'trackInventory', true),
      lowStockThreshold: optionalIntField(formData, 'lowStockThreshold'),
      isActive: boolField(formData, 'isActive'),
      sortOrder: intField(formData, 'sortOrder', 0)
    }
  });
  await variantStockAuditService.recordChange(existingVariant, { ...variant, product });

  revalidateCatalog();
  revalidatePath(`/admin/products/${productId}`);
  redirect(`/admin/products/${productId}?status=product-variant-updated`);
}

export async function updateVariantLocationStockAction(productId: string, variantId: string, formData: FormData) {
  await ensureCanWriteCms();
  if (!productId) throw new Error('productId is required');
  if (!variantId) throw new Error('variantId is required');

  const locationId = requiredString(formData, 'locationId');
  const quantity = Math.max(0, intField(formData, 'quantity', 0));
  const reservedQuantity = Math.max(0, intField(formData, 'reservedQuantity', 0));
  const lowStockThreshold = optionalIntField(formData, 'lowStockThreshold');

  const [variant, location, existingStock] = await Promise.all([
    prisma.productVariant.findUnique({
      where: { id: variantId },
      select: { id: true, sku: true, name: true, product: { select: { title: true, code: true } } }
    }),
    prisma.warehouseLocation.findUnique({ where: { id: locationId }, select: { id: true, slug: true, name: true } }),
    prisma.productVariantLocationStock.findUnique({
      where: { variantId_locationId: { variantId, locationId } },
      include: {
        variant: { select: { sku: true, name: true, product: { select: { title: true, code: true } } } },
        location: { select: { slug: true, name: true } }
      }
    })
  ]);

  if (!variant) throw new Error('Variant not found.');
  if (!location) throw new Error('Warehouse location not found.');

  const stock = await prisma.productVariantLocationStock.upsert({
    where: { variantId_locationId: { variantId, locationId } },
    create: { variantId, locationId, quantity, reservedQuantity, lowStockThreshold },
    update: { quantity, reservedQuantity, lowStockThreshold },
    include: {
      variant: { select: { sku: true, name: true, product: { select: { title: true, code: true } } } },
      location: { select: { slug: true, name: true } }
    }
  });

  const aggregate = await prisma.productVariantLocationStock.aggregate({
    where: { variantId },
    _sum: { quantity: true }
  });
  await prisma.productVariant.update({
    where: { id: variantId },
    data: { stockQuantity: aggregate._sum.quantity ?? 0 }
  });

  await variantStockAuditService.recordLocationChange(existingStock, stock);

  revalidateCatalog();
  revalidatePath(`/admin/products/${productId}`);
  redirect(`/admin/products/${productId}?status=variant-location-stock-updated`);
}
