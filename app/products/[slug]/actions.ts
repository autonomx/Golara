'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { publicInquiryService } from '@/lib/inquiries/public-inquiry-service';
import { validateInquiryInput } from '@/lib/inquiries/validate-inquiry';
import { hasDatabase } from '@/lib/prisma';
import { assertSameOriginServerAction } from '@/lib/server-action-origin';

const PUBLIC_INQUIRY_COOLDOWN_COOKIE = 'publicInquiryCooldown';
const PUBLIC_INQUIRY_COOLDOWN_SECONDS = 60 * 5;

type CookieStore = Awaited<ReturnType<typeof cookies>>;

function stringField(formData: FormData, name: string, fallback = '') {
  const value = formData.get(name);
  if (typeof value !== 'string') return fallback;
  return value.trim();
}

function inquiryPath(productSlug: string, status: string) {
  return `/products/${productSlug}?inquiry=${encodeURIComponent(status)}`;
}

function assertInquirySubmissionNotThrottled(productSlug: string, cookieStore: CookieStore) {
  const cooldown = cookieStore.get(PUBLIC_INQUIRY_COOLDOWN_COOKIE);
  if (cooldown) {
    redirect(inquiryPath(productSlug, 'rate-limited'));
  }
}

function setInquirySubmissionThrottle(cookieStore: CookieStore) {
  cookieStore.set(PUBLIC_INQUIRY_COOLDOWN_COOKIE, '1', {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: PUBLIC_INQUIRY_COOLDOWN_SECONDS,
    path: '/'
  });
}

export async function createInquiryAction(productId: string | undefined, productSlug: string, formData: FormData) {
  // Enforce same-origin policy to prevent CSRF/spam for public inquiries
  await assertSameOriginServerAction();

  const cookieStore = await cookies();
  assertInquirySubmissionNotThrottled(productSlug, cookieStore);

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

  setInquirySubmissionThrottle(cookieStore);

  redirect(inquiryPath(productSlug, 'sent'));
}
