'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { createCustomerSession, linkCustomerAccount } from '@/lib/customers/customer-account-repository';
import { setCustomerSessionCookie } from '@/lib/customers/customer-session-cookie';
import { customerProfileCompletionPath, isCustomerProfileComplete } from '@/lib/customers/customer-profile-completion';
import { issueCustomerOtp, verifyCustomerOtp } from '@/lib/customers/customer-otp-repository';
import { normalizeCustomerPhone } from '@/lib/customers/customer-repository';
import { hasDatabase } from '@/lib/prisma';
import { assertSameOriginServerAction } from '@/lib/server-action-origin';

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
  await assertSameOriginServerAction();
  const returnTo = safeReturnTo(stringField(formData, 'returnTo', '/account'));
  if (!hasDatabase()) redirect(loginPath('database-required', undefined, returnTo));

  let redirectTarget = loginPath('request-failed', undefined, returnTo);
  try {
    const phone = normalizeCustomerPhone(stringField(formData, 'phone'));
    const result = await issueCustomerOtp({ phone, purpose: 'login', ...(await requestContext()) });
    redirectTarget = result.ok ? loginPath('code-sent', phone, returnTo) : loginPath(result.reason, phone, returnTo);
  } catch (error) {
    console.warn('[account-login] failed to request OTP', error);
  }
  redirect(redirectTarget);
}

export async function verifyCustomerOtpAction(formData: FormData) {
  await assertSameOriginServerAction();
  const returnTo = safeReturnTo(stringField(formData, 'returnTo', '/account'));
  if (!hasDatabase()) redirect(loginPath('database-required', undefined, returnTo));

  let redirectTarget = loginPath('verify-failed', stringField(formData, 'phone'), returnTo);
  try {
    const phone = normalizeCustomerPhone(stringField(formData, 'phone'));
    const code = stringField(formData, 'code');
    const result = await verifyCustomerOtp({ phone, code, purpose: 'login', ...(await requestContext()) });
    if (!result.ok) {
      redirectTarget = loginPath(result.reason, phone, returnTo);
    } else {
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
      redirectTarget = isCustomerProfileComplete(account.customer) ? returnTo : customerProfileCompletionPath(returnTo);
    }
  } catch (error) {
    console.warn('[account-login] failed to verify OTP', error);
  }
  redirect(redirectTarget);
}
