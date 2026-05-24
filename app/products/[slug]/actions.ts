'use server';

import { redirect } from 'next/navigation';
import { validateInquiryInput } from '@/lib/inquiries/validate-inquiry';
import { notifyNewInquiry } from '@/lib/notifications/inquiry-notifications';
import { hasDatabase, prisma } from '@/lib/prisma';

function stringField(formData: FormData, name: string, fallback = '') {
  const value = formData.get(name);
  if (typeof value !== 'string') return fallback;
  return value.trim();
}

function inquiryPath(productSlug: string, status: string) {
  return `/products/${productSlug}?inquiry=${encodeURIComponent(status)}`;
}

export async function createInquiryAction(productId: string | undefined, productSlug: string, formData: FormData) {
  if (!hasDatabase()) {
    redirect(inquiryPath(productSlug, 'database-required'));
  }

  const validation = validateInquiryInput({
    name: stringField(formData, 'name'),
    phone: stringField(formData, 'phone'),
    email: stringField(formData, 'email'),
    message: stringField(formData, 'message'),
    deliveryDate: stringField(formData, 'deliveryDate'),
    deliveryNotes: stringField(formData, 'deliveryNotes')
  });

  if (!validation.ok) {
    redirect(inquiryPath(productSlug, validation.code));
  }

  const inquiry = await prisma.customerInquiry.create({
    data: {
      name: validation.value.name,
      phone: validation.value.phone,
      email: validation.value.email,
      message: validation.value.message,
      deliveryDate: validation.value.deliveryDate,
      deliveryNotes: validation.value.deliveryNotes,
      productId
    },
    include: {
      product: { select: { title: true } }
    }
  });

  await notifyNewInquiry({
    inquiryId: inquiry.id,
    productTitle: inquiry.product?.title,
    customerName: validation.value.name,
    customerPhone: validation.value.phone,
    customerEmail: validation.value.email,
    message: validation.value.message
  });

  redirect(inquiryPath(productSlug, 'sent'));
}
