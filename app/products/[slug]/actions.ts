'use server';

import { redirect } from 'next/navigation';
import { notifyNewInquiry } from '@/lib/notifications/inquiry-notifications';
import { hasDatabase, prisma } from '@/lib/prisma';

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

function optionalDate(value: string) {
  if (!value) return undefined;
  const date = new Date(`${value}T12:00:00.000Z`);
  if (Number.isNaN(date.getTime())) return undefined;
  return date;
}

export async function createInquiryAction(productId: string | undefined, productSlug: string, formData: FormData) {
  if (!hasDatabase()) {
    redirect(`/products/${productSlug}?inquiry=database-required`);
  }

  const name = requiredString(formData, 'name');
  const phone = requiredString(formData, 'phone');
  const email = stringField(formData, 'email') || undefined;
  const message = requiredString(formData, 'message');
  const deliveryDate = optionalDate(stringField(formData, 'deliveryDate'));
  const deliveryNotes = stringField(formData, 'deliveryNotes') || undefined;

  const inquiry = await prisma.customerInquiry.create({
    data: {
      name,
      phone,
      email,
      message,
      deliveryDate,
      deliveryNotes,
      productId
    },
    include: {
      product: { select: { title: true } }
    }
  });

  await notifyNewInquiry({
    inquiryId: inquiry.id,
    productTitle: inquiry.product?.title,
    customerName: name,
    customerPhone: phone,
    customerEmail: email,
    message
  });

  redirect(`/products/${productSlug}?inquiry=sent`);
}
