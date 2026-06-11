'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertAdminRole } from '@/lib/admin-auth';
import { hasDatabase, prisma } from '@/lib/prisma';
import { assertSameOriginServerAction } from '@/lib/server-action-origin';

async function ensureCanWriteFeaturedPick() {
  // Enforce same-origin policy for admin homepage product actions
  await assertSameOriginServerAction();
  await assertAdminRole('owner');
  if (!hasDatabase()) {
    throw new Error('DATABASE_URL is not configured. Add a PostgreSQL connection before editing featured picks.');
  }
}

function stringField(formData: FormData, name: string, fallback = '') {
  const value = formData.get(name);
  return typeof value === 'string' ? value.trim() : fallback;
}

function requiredString(formData: FormData, name: string) {
  const value = stringField(formData, name);
  if (!value) throw new Error(`${name} is required`);
  return value;
}

function intField(formData: FormData, name: string, fallback = 0) {
  const value = Number.parseInt(stringField(formData, name, String(fallback)), 10);
  return Number.isFinite(value) ? value : fallback;
}

function featuredPickReturnPath(status: string, page?: string) {
  const params = new URLSearchParams({ status });
  if (page && page !== '1') params.set('featuredPage', page);
  return `/admin/homepage?${params.toString()}`;
}

function revalidateFeaturedPickPaths() {
  revalidatePath('/');
  revalidatePath('/products');
  revalidatePath('/admin/homepage');
}

export async function addHomepageFeaturedPickAction(formData: FormData) {
  await ensureCanWriteFeaturedPick();
  const productId = requiredString(formData, 'productId');

  await prisma.product.update({
    where: { id: productId },
    data: {
      bestSeller: true,
      isActive: true,
      sortOrder: intField(formData, 'sortOrder', 100)
    }
  });

  revalidateFeaturedPickPaths();
  redirect('/admin/homepage?status=homepage-featured-added');
}

export async function removeHomepageFeaturedPickAction(productId: string, formData: FormData) {
  await ensureCanWriteFeaturedPick();
  if (!productId) throw new Error('productId is required');

  await prisma.product.update({
    where: { id: productId },
    data: { bestSeller: false }
  });

  revalidateFeaturedPickPaths();
  redirect(featuredPickReturnPath('homepage-featured-removed', stringField(formData, 'featuredPage')));
}

export async function updateHomepageFeaturedPickAction(productId: string, formData: FormData) {
  await ensureCanWriteFeaturedPick();
  if (!productId) throw new Error('productId is required');

  await prisma.product.update({
    where: { id: productId },
    data: {
      bestSeller: true,
      isActive: formData.getAll('isActive').includes('on'),
      sortOrder: intField(formData, 'sortOrder', 100)
    }
  });

  revalidateFeaturedPickPaths();
  redirect(featuredPickReturnPath('homepage-featured-updated', stringField(formData, 'featuredPage')));
}
