import 'server-only';

import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'node:crypto';

const COOKIE_NAME = 'golara_admin_session';
const SESSION_PAYLOAD = 'golara-admin-v1';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

function configuredPassword() {
  return process.env.ADMIN_PASSWORD?.trim() ?? '';
}

function configuredSecret() {
  return process.env.ADMIN_SESSION_SECRET?.trim() ?? '';
}

export function isAdminAuthConfigured() {
  return Boolean(configuredPassword() && configuredSecret());
}

function sign(value: string) {
  return createHmac('sha256', configuredSecret()).update(value).digest('hex');
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export async function isAdminAuthenticated() {
  if (!isAdminAuthConfigured()) return false;

  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(COOKIE_NAME)?.value;
  if (!cookieValue) return false;

  const [payload, signature] = cookieValue.split('.');
  if (payload !== SESSION_PAYLOAD || !signature) return false;

  return safeEqual(signature, sign(payload));
}

export async function assertAdminAuthenticated() {
  if (!(await isAdminAuthenticated())) {
    throw new Error('Admin authentication is required for this CMS action.');
  }
}

export async function createAdminSession(password: string) {
  if (!isAdminAuthConfigured()) {
    return { ok: false, error: 'Admin auth is not configured.' };
  }

  if (!safeEqual(password, configuredPassword())) {
    return { ok: false, error: 'Invalid admin password.' };
  }

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, `${SESSION_PAYLOAD}.${sign(SESSION_PAYLOAD)}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS
  });

  return { ok: true };
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
