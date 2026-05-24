'use server';

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertAdminAuthenticated } from '@/lib/admin-auth';
import { prisma, hasDatabase } from '@/lib/prisma';

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

async function ensureCanWriteCms() {
  await assertAdminAuthenticated();

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

function normalizeExternalImageUrl(value: string) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Image URL must start with http or https.');
  }
  return url.toString();
}

function uploadedFileExtension(file: File) {
  const fromName = file.name.split('.').pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName;
  if (file.type === 'image/png') return 'png';
  if (file.type === 'image/webp') return 'webp';
  if (file.type === 'image/gif') return 'gif';
  return 'jpg';
}

function resolveImageUrl(formData: FormData) {
  const selectedMediaUrl = stringField(formData, 'selectedMediaUrl');
  const imageUrl = stringField(formData, 'imageUrl');
  if (selectedMediaUrl) return selectedMediaUrl;
  if (imageUrl) return normalizeExternalImageUrl(imageUrl);
  throw new Error('Choose a media-library image or provide an image URL.');
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

  const url = normalizeExternalImageUrl(requiredString(formData, 'url'));
  const alt = requiredString(formData, 'alt');

  await prisma.media.upsert({
    where: { url },
    create: { url, alt },
    update: { alt }
  });

  revalidateCatalog();
  redirect(adminPath('media-created'));
}

export async function uploadMediaAction(formData: FormData) {
  await ensureCanWriteCms();

  const file = formData.get('file');
  if (!(file instanceof File) || file.size === 0) {
    throw new Error('Choose an image file to upload.');
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    throw new Error('Upload must be a JPEG, PNG, WebP, or GIF image.');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('Image upload must be 4 MB or smaller.');
  }

  const alt = stringField(formData, 'alt') || file.name;
  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadDir, { recursive: true });

  const extension = uploadedFileExtension(file);
  const safeBaseName = slugify(file.name.replace(/\.[^.]+$/, '')) || 'image';
  const fileName = `${Date.now()}-${safeBaseName}.${extension}`;
  const diskPath = path.join(uploadDir, fileName);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(diskPath, bytes);

  const url = `/uploads/${fileName}`;
  await prisma.media.create({ data: { url, alt } });

  revalidateCatalog();
  redirect(adminPath('media-uploaded'));
}

export async function createCategoryAction(formData: FormData) {
  await ensureCanWriteCms();

  const title = requiredString(formData, 'title');
  const slug = stringField(formData, 'slug') || slugify(title);

  await prisma.category.create({
    data: {
      title,
      slug,
      eyebrow: requiredString(formData, 'eyebrow'),
      description: requiredString(formData, 'description'),
      sortOrder: intField(formData, 'sortOrder', 100),
      isActive: boolField(formData, 'isActive')
    }
  });

  revalidateCatalog();
  redirect(adminPath('category-created'));
}

export async function updateCategoryAction(categoryId: string, formData: FormData) {
  await ensureCanWriteCms();
  if (!categoryId) throw new Error('categoryId is required');

  const title = requiredString(formData, 'title');
  const slug = stringField(formData, 'slug') || slugify(title);

  await prisma.category.update({
    where: { id: categoryId },
    data: {
      title,
      slug,
      eyebrow: requiredString(formData, 'eyebrow'),
      description: requiredString(formData, 'description'),
      sortOrder: intField(formData, 'sortOrder', 100),
      isActive: boolField(formData, 'isActive')
    }
  });

  revalidateCatalog();
  redirect(adminPath('category-updated'));
}

export async function createProductAction(formData: FormData) {
  await ensureCanWriteCms();

  const title = requiredString(formData, 'title');
  const slug = stringField(formData, 'slug') || slugify(title);
  const imageUrl = resolveImageUrl(formData);

  await prisma.product.create({
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
      isActive: boolField(formData, 'isActive')
    }
  });

  revalidateCatalog();
  redirect(adminPath('product-created'));
}

export async function updateProductAction(productId: string, formData: FormData) {
  await ensureCanWriteCms();
  if (!productId) throw new Error('productId is required');

  const title = requiredString(formData, 'title');
  const slug = stringField(formData, 'slug') || slugify(title);
  const imageUrl = resolveImageUrl(formData);

  await prisma.product.update({
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
      isActive: boolField(formData, 'isActive')
    }
  });

  revalidateCatalog();
  redirect(adminPath('product-updated'));
}

export async function updateHomepageAction(formData: FormData) {
  await ensureCanWriteCms();

  const title = requiredString(formData, 'title');
  const eyebrow = requiredString(formData, 'eyebrow');
  const body = requiredString(formData, 'body');

  await prisma.homepageSection.upsert({
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

  revalidateCatalog();
  redirect(adminPath('homepage-updated'));
}
