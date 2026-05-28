'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createCustomerSession, linkCustomerAccount } from '@/lib/customers/customer-account-repository';
import { setCustomerSessionCookie } from '@/lib/customers/customer-session-cookie';
import { issueCustomerOtp, verifyCustomerOtp } from '@/lib/customers/customer-otp-repository';
import { normalizeCustomerPhone } from '@/lib/customers/customer-repository';
import { hasDatabase } from '@/lib/prisma';

function stringField(formData: FormData, name: string, fallback = '') {
  const value = formData.get(name);
  if (typeof value !== 'string') return fallback;
  return value.trim();
}

function safeReturnTo(value?: string) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/account';
  return value;
}

function loginPath(status: string, phone?: string, returnTo?: string) {
  const params = new URLSearchParams({ status });
  if (phone) params.set('phone', phone);
  if (returnTo) params.set('returnTo', returnTo);
  return `/account/login?${params.toString()}`;
}

async function requestContext() {
  const requestHeaders = await headers();
  return {
    ipAddress: requestHeaders.get('x-forwarded-for') || requestHeaders.get('x-real-ip') || undefined,
    userAgent: requestHeaders.get('user-agent') || undefined
  };
}

export async function requestCustomerOtpAction(formData: FormData) {
  const returnTo = safeReturnTo(stringField(formData, 'returnTo', '/account'));
  if (!hasDatabase()) redirect(loginPath('database-required', undefined, returnTo));

  try {
    const phone = normalizeCustomerPhone(stringField(formData, 'phone'));
    const result = await issueCustomerOtp({ phone, purpose: 'login', ...(await requestContext()) });
    if (!result.ok) redirect(loginPath(result.reason, phone, returnTo));
    redirect(loginPath('code-sent', phone, returnTo));
  } catch (error) {
    console.warn('[account-login] failed to request OTP', error);
    redirect(loginPath('request-failed', undefined, returnTo));
  }
}

export async function verifyCustomerOtpAction(formData: FormData) {
  const returnTo = safeReturnTo(stringField(formData, 'returnTo', '/account'));
  if (!hasDatabase()) redirect(loginPath('database-required', undefined, returnTo));

  try {
    const phone = normalizeCustomerPhone(stringField(formData, 'phone'));
    const code = stringField(formData, 'code');
    const result = await verifyCustomerOtp({ phone, code, purpose: 'login' });
    if (!result.ok) redirect(loginPath(result.reason, phone, returnTo));

    const account = await linkCustomerAccount({
      phone,
      provider: 'phone',
      providerAccountId: phone,
      locale: 'fa-IR'
    });
    const { token } = await createCustomerSession({
      customerId: account.customerId,
      provider: 'phone-otp'
    });
    await setCustomerSessionCookie(token);
    redirect(returnTo);
  } catch (error) {
    console.warn('[account-login] failed to verify OTP', error);
    redirect(loginPath('verify-failed', stringField(formData, 'phone'), returnTo));
  }
}
