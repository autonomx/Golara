'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertAdminAuthenticated } from '@/lib/admin-auth';
import { prisma, hasDatabase } from '@/lib/prisma';

async function ensureCanWriteCms() {
  await assertAdminAuthenticated();

  if (!hasDatabase()) {
    throw new Error('DATABASE_URL is not configured. Add a PostgreSQL connection before using admin write actions.');
  }
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

function revalidateCatalog() {
  revalidatePath('/');
  revalidatePath('/products');
  revalidatePath('/admin');
  revalidatePath('/categories/[slug]', 'page');
  revalidatePath('/products/[slug]', 'page');
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
  redirect('/admin?status=category-created');
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
  redirect('/admin?status=category-updated');
}

export async function createProductAction(formData: FormData) {
  await ensureCanWriteCms();

  const title = requiredString(formData, 'title');
  const slug = stringField(formData, 'slug') || slugify(title);

  await prisma.product.create({
    data: {
      title,
      slug,
      code: requiredString(formData, 'code'),
      description: requiredString(formData, 'description'),
      priceCents: priceCentsField(formData, 'price'),
      currency: stringField(formData, 'currency', 'CAD') || 'CAD',
      imageUrl: requiredString(formData, 'imageUrl'),
      categoryId: requiredString(formData, 'categoryId'),
      availableToday: boolField(formData, 'availableToday'),
      bestSeller: boolField(formData, 'bestSeller'),
      isActive: boolField(formData, 'isActive')
    }
  });

  revalidateCatalog();
  redirect('/admin?status=product-created');
}

export async function updateProductAction(productId: string, formData: FormData) {
  await ensureCanWriteCms();
  if (!productId) throw new Error('productId is required');

  const title = requiredString(formData, 'title');
  const slug = stringField(formData, 'slug') || slugify(title);

  await prisma.product.update({
    where: { id: productId },
    data: {
      title,
      slug,
      code: requiredString(formData, 'code'),
      description: requiredString(formData, 'description'),
      priceCents: priceCentsField(formData, 'price'),
      currency: stringField(formData, 'currency', 'CAD') || 'CAD',
      imageUrl: requiredString(formData, 'imageUrl'),
      categoryId: requiredString(formData, 'categoryId'),
      availableToday: boolField(formData, 'availableToday'),
      bestSeller: boolField(formData, 'bestSeller'),
      isActive: boolField(formData, 'isActive')
    }
  });

  revalidateCatalog();
  redirect('/admin?status=product-updated');
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
  redirect('/admin?status=homepage-updated');
}
