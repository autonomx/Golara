'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertAdminRole } from '@/lib/admin-auth';
import { cmsCategoryService } from '@/lib/cms/category-service';
import { normalizeImageUrl } from '@/lib/media/media-storage';
import { hasDatabase } from '@/lib/prisma';

async function ensureCanWriteHomepageCategory() {
  await assertAdminRole('owner');
  if (!hasDatabase()) {
    throw new Error('DATABASE_URL is not configured. Add a PostgreSQL connection before editing homepage categories.');
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

function boolField(formData: FormData, name: string) {
  return formData.getAll(name).includes('on');
}

function intField(formData: FormData, name: string, fallback = 0) {
  const value = Number.parseInt(stringField(formData, name, String(fallback)), 10);
  return Number.isFinite(value) ? value : fallback;
}

function optionalImage(formData: FormData) {
  const selected = stringField(formData, 'selectedMediaUrl');
  if (selected) return selected;
  const manual = stringField(formData, 'imageUrl');
  if (manual) return normalizeImageUrl(manual);
  return stringField(formData, 'existingImage') || null;
}

function optionalParentId(formData: FormData, categoryId: string) {
  const parentId = stringField(formData, 'parentId');
  return parentId && parentId !== categoryId ? parentId : null;
}

export async function updateHomepageCategoryTileAction(categoryId: string, formData: FormData) {
  await ensureCanWriteHomepageCategory();
  if (!categoryId) throw new Error('categoryId is required');

  await cmsCategoryService.update(categoryId, {
    title: requiredString(formData, 'title'),
    slug: requiredString(formData, 'slug'),
    eyebrow: stringField(formData, 'eyebrow'),
    description: stringField(formData, 'description'),
    imageUrl: optionalImage(formData),
    parentId: optionalParentId(formData, categoryId),
    showOnHomepage: boolField(formData, 'showOnHomepage'),
    sortOrder: intField(formData, 'sortOrder', 100),
    isActive: boolField(formData, 'isActive')
  });

  revalidatePath('/');
  revalidatePath('/categories');
  revalidatePath('/admin/homepage');
  redirect('/admin/homepage?status=homepage-category-updated');
}
