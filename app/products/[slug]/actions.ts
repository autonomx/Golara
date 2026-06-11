'use server';

import { redirect } from 'next/navigation';
import { publicInquiryService } from '@/lib/inquiries/public-inquiry-service';
import { validateInquiryInput } from '@/lib/inquiries/validate-inquiry';
import { hasDatabase } from '@/lib/prisma';
import { assertSameOriginServerAction } from '@/lib/server-action-origin';

function stringField(formData: FormData, name: string, fallback = '') {
  const value = formData.get(name);
  if (typeof value !== 'string') return fallback;
  return value.trim();
}

function inquiryPath(productSlug: string, status: string) {
  return `/products/${productSlug}?inquiry=${encodeURIComponent(status)}`;
}

export async function createInquiryAction(productId: string | undefined, productSlug: string, formData: FormData) {
  // Enforce same-origin policy to prevent CSRF/spam for public inquiries
  await assertSameOriginServerAction();

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

  await publicInquiryService.createInquiry({
    productId,
    inquiry: validation.value
  });

  redirect(inquiryPath(productSlug, 'sent'));
}
