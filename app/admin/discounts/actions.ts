'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertAdminRole } from '@/lib/admin-auth';
import { hasDatabase } from '@/lib/prisma';
import { createPromotionDiscount } from '@/lib/promotions/promotion-discount-repository';
import { createPromotionVoucher } from '@/lib/promotions/promotion-voucher-repository';

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

function boolFieldDefault(formData: FormData, name: string, fallback: boolean) {
  return formData.has(name) ? formData.getAll(name).includes('on') : fallback;
}

function intField(formData: FormData, name: string, fallback = 0) {
  const value = Number.parseInt(stringField(formData, name, String(fallback)), 10);
  return Number.isFinite(value) ? value : fallback;
}

function optionalIntField(formData: FormData, name: string) {
  const value = optionalString(formData, name);
  if (!value) return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
}

function optionalDateField(formData: FormData, name: string) {
  const value = optionalString(formData, name);
  return value ? `${value}T00:00:00.000Z` : null;
}

async function ensureCanWriteDiscounts() {
  await assertAdminRole('owner');

  if (!hasDatabase()) {
    throw new Error('DATABASE_URL is not configured. Add a PostgreSQL connection before creating discounts.');
  }
}

function discountReturnPath(status: string, message?: string) {
  const params = new URLSearchParams({ status });
  if (message) params.set('message', message);
  return `/admin/discounts?${params.toString()}`;
}

export async function createAdminDiscountAction(formData: FormData) {
  await ensureCanWriteDiscounts();

  const discount = await createPromotionDiscount({
    name: requiredString(formData, 'name'),
    slug: optionalString(formData, 'slug'),
    discountType: requiredString(formData, 'discountType'),
    value: intField(formData, 'value'),
    currency: stringField(formData, 'currency', 'TOMAN') || 'TOMAN',
    status: stringField(formData, 'status', 'draft') || 'draft',
    description: optionalString(formData, 'description'),
    isActive: boolFieldDefault(formData, 'isActive', true),
    startsAt: optionalDateField(formData, 'startsAt'),
    endsAt: optionalDateField(formData, 'endsAt'),
    usageLimit: optionalIntField(formData, 'usageLimit'),
    minimumSubtotalCents: optionalIntField(formData, 'minimumSubtotalCents')
  });

  const voucherCode = optionalString(formData, 'voucherCode');
  if (voucherCode) {
    await createPromotionVoucher({
      code: voucherCode,
      promotionDiscountId: discount.id,
      status: stringField(formData, 'voucherStatus', stringField(formData, 'status', 'draft')) || 'draft',
      isActive: boolFieldDefault(formData, 'voucherIsActive', true),
      startsAt: optionalDateField(formData, 'startsAt'),
      endsAt: optionalDateField(formData, 'endsAt'),
      usageLimit: optionalIntField(formData, 'voucherUsageLimit') ?? optionalIntField(formData, 'usageLimit'),
      minimumSubtotalCents: optionalIntField(formData, 'minimumSubtotalCents')
    });
  }

  revalidatePath('/admin');
  revalidatePath('/admin/discounts');
  redirect(discountReturnPath('discount-created', voucherCode ? `Created discount ${discount.name} with voucher ${voucherCode.toUpperCase()}.` : `Created discount ${discount.name}.`));
}
