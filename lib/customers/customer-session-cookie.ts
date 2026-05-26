import 'server-only';

import { cookies } from 'next/headers';

export const CUSTOMER_SESSION_COOKIE_NAME = 'golara_customer_session';
const DEFAULT_CUSTOMER_SESSION_DAYS = 30;

function customerSessionDays() {
  const parsed = Number.parseInt(process.env.CUSTOMER_SESSION_TTL_DAYS || String(DEFAULT_CUSTOMER_SESSION_DAYS), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_CUSTOMER_SESSION_DAYS;
}

export async function getCustomerSessionCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(CUSTOMER_SESSION_COOKIE_NAME)?.value;
}

export async function setCustomerSessionCookie(token: string) {
  const cookieStore = await cookies();
  const maxAge = customerSessionDays() * 24 * 60 * 60;
  cookieStore.set(CUSTOMER_SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge
  });
}

export async function clearCustomerSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(CUSTOMER_SESSION_COOKIE_NAME);
}
