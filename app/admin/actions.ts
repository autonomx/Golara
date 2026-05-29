'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertAdminRole } from '@/lib/admin-auth';
import { recordAdminAuditLog } from '@/lib/admin-audit-log';
import { normalizeLocale } from '@/lib/i18n/locales';
import { normalizeImageUrl, storeMediaUpload } from '@/lib/media/media-storage';
import { prisma, hasDatabase } from '@/lib/prisma';

async function ensureCanWriteCms() {
  await assertAdminRole('owner');

  if (!hasDatabase()) {
    throw new Error('DATABASE_URL is not configured. Add a PostgreSQL connection before using admin write actions.');
  }
}

function adminPath(status: string, message?: string) {
  const params = new URLSearchParams({ status });
  if (message) params.set('message', message);
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

function revalidateCatalog() {
  revalidatePath('/');
  revalidatePath('/products');
  revalidatePath('/admin');
  revalidatePath('/categories/[slug]', 'page');
  revalidatePath('/products/[slug]', 'page');
}

export async function createMediaFromUrlAction(formData: FormData) {
  await ensureCanWriteCms();

  const url = normalizeImageUrl(requiredString(formData, 'url'));
  const alt = requiredString(formData, 'alt');

  const media = await prisma.media.upsert({ where: { url }, create: { url, alt }, update: { alt } });

  await recordAdminAuditLog({ action: 'media.upsert_url', entity: 'media', entityId: media.id, summary: `Registered media URL: ${alt}`, metadata: { url } });

  revalidateCatalog();
  redirect(adminPath('media-created'));
}

export async function uploadMediaAction(formData: FormData) {
  await ensureCanWriteCms();

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) throw new Error('Choose an image file to upload.');

  const alt = stringField(formData, 'alt') || file.name;
  const storedFile = await storeMediaUpload(file);
  const media = await prisma.media.create({ data: { url: storedFile.url, alt } });

  await recordAdminAuditLog({ action: 'media.upload', entity: 'media', entityId: media.id, summary: `Uploaded media: ${alt}`, metadata: { url: storedFile.url, size: storedFile.size, type: storedFile.type, provider: storedFile.provider } });

  revalidateCatalog();
  redirect(adminPath('media-uploaded'));
}

export async function createCategoryAction(formData: FormData) {
  await ensureCanWriteCms();

  const title = requiredString(formData, 'title');
  const slug = stringField(formData, 'slug') || slugify(title);
  const imageUrl = resolveOptionalImageUrl(formData, 'categorySelectedMediaUrl', 'categoryImageUrl');

  const category = await prisma.category.create({
    data: {
      title,
      slug,
      eyebrow: requiredString(formData, 'eyebrow'),
      description: requiredString(formData, 'description'),
      imageUrl,
      parentId: parentCategoryId(formData),
      showOnHomepage: boolField(formData, 'showOnHomepage'),
      sortOrder: intField(formData, 'sortOrder', 100),
      isActive: boolField(formData, 'isActive')
    }
  });

  await recordAdminAuditLog({ action: 'category.create', entity: 'category', entityId: category.id, summary: `Created category: ${category.title}`, metadata: { slug: category.slug, isActive: category.isActive, parentId: category.parentId, showOnHomepage: category.showOnHomepage } });

  revalidateCatalog();
  redirect(adminPath('category-created'));
}

export async function updateCategoryAction(categoryId: string, formData: FormData) {
  await ensureCanWriteCms();
  if (!categoryId) throw new Error('categoryId is required');

  const title = requiredString(formData, 'title');
  const slug = stringField(formData, 'slug') || slugify(title);
  const imageUrl = resolveOptionalImageUrl(formData, 'categorySelectedMediaUrl', 'categoryImageUrl');

  const category = await prisma.category.update({
    where: { id: categoryId },
    data: {
      title,
      slug,
      eyebrow: requiredString(formData, 'eyebrow'),
      description: requiredString(formData, 'description'),
      imageUrl,
      parentId: parentCategoryId(formData, categoryId),
      showOnHomepage: boolField(formData, 'showOnHomepage'),
      sortOrder: intField(formData, 'sortOrder', 100),
      isActive: boolField(formData, 'isActive')
    }
  });

  await recordAdminAuditLog({ action: 'category.update', entity: 'category', entityId: category.id, summary: `Updated category: ${category.title}`, metadata: { slug: category.slug, isActive: category.isActive, parentId: category.parentId, showOnHomepage: category.showOnHomepage } });

  revalidateCatalog();
  redirect(adminPath('category-updated'));
}

export async function upsertCategoryTranslationAction(categoryId: string, formData: FormData) {
  await ensureCanWriteCms();
  if (!categoryId) throw new Error('categoryId is required');

  const locale = normalizeLocale(requiredString(formData, 'locale'));
  const title = requiredString(formData, 'translationTitle');
  const translation = await prisma.categoryTranslation.upsert({
    where: { categoryId_locale: { categoryId, locale } },
    create: {
      categoryId,
      locale,
      title,
      eyebrow: optionalString(formData, 'translationEyebrow'),
      description: optionalString(formData, 'translationDescription'),
      imageAlt: optionalString(formData, 'translationImageAlt'),
      isPublished: boolField(formData, 'translationIsPublished')
    },
    update: {
      title,
      eyebrow: optionalString(formData, 'translationEyebrow'),
      description: optionalString(formData, 'translationDescription'),
      imageAlt: optionalString(formData, 'translationImageAlt'),
      isPublished: boolField(formData, 'translationIsPublished')
    }
  });

  await recordAdminAuditLog({ action: 'category.translation.upsert', entity: 'category', entityId: categoryId, summary: `Updated ${locale} category translation`, metadata: { locale, translationId: translation.id, isPublished: translation.isPublished } });

  revalidateCatalog();
  redirect(adminPath('category-translation-updated'));
}

export async function createProductAction(formData: FormData) {
  await ensureCanWriteCms();

  const title = requiredString(formData, 'title');
  const slug = stringField(formData, 'slug') || slugify(title);
  const imageUrl = resolveImageUrl(formData);
  const requiresQuote = boolField(formData, 'requiresQuote');

  const product = await prisma.product.create({
    data: {
      title,
      slug,
      code: requiredString(formData, 'code'),
      description: requiredString(formData, 'description'),
      priceCents: priceCentsField(formData, 'price'),
      currency: stringField(formData, 'currency', 'CAD') || 'CAD',
      imageUrl,
      categoryId: requiredString(formData, 'categoryId'),
      availableToday: boolField(formData, 'availableToday'),
      bestSeller: boolField(formData, 'bestSeller'),
      requiresQuote,
      isActive: boolField(formData, 'isActive')
    }
  });

  await recordAdminAuditLog({ action: 'product.create', entity: 'product', entityId: product.id, summary: `Created product: ${product.title}`, metadata: { slug: product.slug, code: product.code, isActive: product.isActive, requiresQuote: product.requiresQuote } });

  revalidateCatalog();
  redirect(adminPath('product-created'));
}

export async function updateProductAction(productId: string, formData: FormData) {
  await ensureCanWriteCms();
  if (!productId) throw new Error('productId is required');

  const title = requiredString(formData, 'title');
  const slug = stringField(formData, 'slug') || slugify(title);
  const imageUrl = resolveImageUrl(formData);
  const requiresQuote = boolField(formData, 'requiresQuote');

  const product = await prisma.product.update({
    where: { id: productId },
    data: {
      title,
      slug,
      code: requiredString(formData, 'code'),
      description: requiredString(formData, 'description'),
      priceCents: priceCentsField(formData, 'price'),
      currency: stringField(formData, 'currency', 'CAD') || 'CAD',
      imageUrl,
      categoryId: requiredString(formData, 'categoryId'),
      availableToday: boolField(formData, 'availableToday'),
      bestSeller: boolField(formData, 'bestSeller'),
      requiresQuote,
      isActive: boolField(formData, 'isActive')
    }
  });

  await recordAdminAuditLog({ action: 'product.update', entity: 'product', entityId: product.id, summary: `Updated product: ${product.title}`, metadata: { slug: product.slug, code: product.code, isActive: product.isActive, requiresQuote: product.requiresQuote } });

  revalidateCatalog();
  redirect(adminPath('product-updated'));
}

export async function upsertProductTranslationAction(productId: string, formData: FormData) {
  await ensureCanWriteCms();
  if (!productId) throw new Error('productId is required');

  const locale = normalizeLocale(requiredString(formData, 'locale'));
  const title = requiredString(formData, 'translationTitle');
  const translation = await prisma.productTranslation.upsert({
    where: { productId_locale: { productId, locale } },
    create: {
      productId,
      locale,
      title,
      description: optionalString(formData, 'translationDescription'),
      imageAlt: optionalString(formData, 'translationImageAlt'),
      isPublished: boolField(formData, 'translationIsPublished')
    },
    update: {
      title,
      description: optionalString(formData, 'translationDescription'),
      imageAlt: optionalString(formData, 'translationImageAlt'),
      isPublished: boolField(formData, 'translationIsPublished')
    }
  });

  await recordAdminAuditLog({ action: 'product.translation.upsert', entity: 'product', entityId: productId, summary: `Updated ${locale} product translation`, metadata: { locale, translationId: translation.id, isPublished: translation.isPublished } });

  revalidateCatalog();
  redirect(adminPath('product-translation-updated'));
}

export async function updateHomepageAction(formData: FormData) {
  await ensureCanWriteCms();

  const title = requiredString(formData, 'title');
  const eyebrow = requiredString(formData, 'eyebrow');
  const body = requiredString(formData, 'body');

  const homepage = await prisma.homepageSection.upsert({
    where: { key: 'home.hero' },
    create: {
      key: 'home.hero',
      title,
      subtitle: eyebrow,
      body,
      payload: {
        eyebrow,
        title,
        body,
        primaryCtaLabel: requiredString(formData, 'primaryCtaLabel'),
        primaryCtaHref: requiredString(formData, 'primaryCtaHref'),
        secondaryCtaLabel: requiredString(formData, 'secondaryCtaLabel'),
        secondaryCtaHref: requiredString(formData, 'secondaryCtaHref'),
        panelEyebrow: requiredString(formData, 'panelEyebrow'),
        panelTitle: requiredString(formData, 'panelTitle'),
        panelBody: requiredString(formData, 'panelBody')
      },
      isActive: true,
      sortOrder: 0
    },
    update: {
      title,
      subtitle: eyebrow,
      body,
      payload: {
        eyebrow,
        title,
        body,
        primaryCtaLabel: requiredString(formData, 'primaryCtaLabel'),
        primaryCtaHref: requiredString(formData, 'primaryCtaHref'),
        secondaryCtaLabel: requiredString(formData, 'secondaryCtaLabel'),
        secondaryCtaHref: requiredString(formData, 'secondaryCtaHref'),
        panelEyebrow: requiredString(formData, 'panelEyebrow'),
        panelTitle: requiredString(formData, 'panelTitle'),
        panelBody: requiredString(formData, 'panelBody')
      },
      isActive: true
    }
  });

  await recordAdminAuditLog({ action: 'homepage.update', entity: 'homepageSection', entityId: homepage.id, summary: `Updated homepage section: ${homepage.key}`, metadata: { key: homepage.key, title: homepage.title } });

  revalidateCatalog();
  redirect(adminPath('homepage-updated'));
}
