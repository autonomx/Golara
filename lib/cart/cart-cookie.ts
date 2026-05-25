import 'server-only';

import { cookies } from 'next/headers';

export const CART_COOKIE_NAME = 'golara_cart';
const DEFAULT_CART_COOKIE_DAYS = 14;

function cartCookieDays() {
  const parsed = Number.parseInt(process.env.CART_SESSION_TTL_DAYS || String(DEFAULT_CART_COOKIE_DAYS), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_CART_COOKIE_DAYS;
}

export async function getCartTokenCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(CART_COOKIE_NAME)?.value;
}

export async function setCartTokenCookie(token: string) {
  const cookieStore = await cookies();
  const maxAge = cartCookieDays() * 24 * 60 * 60;
  cookieStore.set(CART_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge
  });
}

export async function clearCartTokenCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(CART_COOKIE_NAME);
}
