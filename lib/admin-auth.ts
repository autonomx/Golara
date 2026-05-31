import 'server-only';

import { cookies } from 'next/headers';
import {
  ADMIN_SESSION_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  adminRoleMeetsRequirement,
  createAdminSessionCookieValue,
  createConfiguredAdminIdentity,
  getAdminAuthConfig,
  isAdminAuthConfigured as isAdminAuthConfiguredCore,
  isValidAdminSessionCookie,
  verifyAdminPassword,
  type AdminIdentity,
  type AdminRole
} from './admin-auth-core';

export type { AdminIdentity, AdminRole } from './admin-auth-core';

function adminAuthConfig() {
  return getAdminAuthConfig(process.env);
}

export function isAdminAuthConfigured() {
  return isAdminAuthConfiguredCore(adminAuthConfig());
}

export async function isAdminAuthenticated() {
  const config = adminAuthConfig();
  if (!isAdminAuthConfiguredCore(config)) return false;

  const cookieStore = await cookies();
  return isValidAdminSessionCookie(cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value, config);
}

export async function getAdminIdentity(): Promise<AdminIdentity> {
  return createConfiguredAdminIdentity(await isAdminAuthenticated(), adminAuthConfig());
}

export async function assertAdminAuthenticated() {
  if (!(await isAdminAuthenticated())) {
    throw new Error('Admin authentication is required for this CMS action.');
  }
}

export async function assertAdminRole(requiredRole: AdminRole) {
  const identity = await getAdminIdentity();
  if (!identity.authenticated) {
    throw new Error('Admin authentication is required for this CMS action.');
  }
  if (!adminRoleMeetsRequirement(identity.role, requiredRole)) {
    throw new Error(`${requiredRole} admin role is required for this CMS action.`);
  }
  return identity;
}

export async function createAdminSession(password: string) {
  const config = adminAuthConfig();
  if (!isAdminAuthConfiguredCore(config)) {
    return { ok: false, error: 'Admin auth is not configured.' };
  }

  if (!verifyAdminPassword(password, config)) {
    return { ok: false, error: 'Invalid admin password.' };
  }

  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE_NAME, createAdminSessionCookieValue(config), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS
  });

  return { ok: true };
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_SESSION_COOKIE_NAME);
}
