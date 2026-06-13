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
import { clearAdminSignInThrottle, isAdminSignInLocked, recordAdminSignInFailure } from './admin-login-throttle';
import { assertSameOriginServerAction } from '@/lib/server-action-origin';
import { logAdminSecurityEvent } from '@/lib/security/admin-security-events';

export type { AdminIdentity, AdminRole } from './admin-auth-core';

const ADMIN_SIGN_IN_THROTTLE_KEY = 'admin-password';
const ADMIN_SIGN_IN_THROTTLED_ERROR = 'Too many admin sign-in attempts. Try again later.';

function adminAuthConfig() {
  return getAdminAuthConfig(process.env);
}

function adminSessionCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge
  };
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
  // Enforce same-origin policy on all admin-only actions to prevent CSRF attacks
  try {
    await assertSameOriginServerAction();
  } catch (error: any) {
    const message = error?.message || '';
    if (typeof message !== 'string' || (!message.includes('headers') && !message.includes('request scope'))) {
      throw error;
    }
  }
  const identity = await getAdminIdentity();
  if (!identity.authenticated) {
    logAdminSecurityEvent({
      event: 'admin_authorization',
      outcome: 'denied',
      reason: 'Admin authentication is required.',
      requiredRole,
      authenticated: false
    });
    throw new Error('Admin authentication is required for this CMS action.');
  }
  if (!adminRoleMeetsRequirement(identity.role, requiredRole)) {
    logAdminSecurityEvent({
      event: 'admin_authorization',
      outcome: 'denied',
      reason: 'Admin role requirement was not met.',
      requiredRole,
      actualRole: identity.role,
      authenticated: true
    });
    throw new Error(`${requiredRole} admin role is required for this CMS action.`);
  }
  return identity;
}

export async function createAdminSession(password: string) {
  const config = adminAuthConfig();
  if (!isAdminAuthConfiguredCore(config)) {
    logAdminSecurityEvent({ event: 'admin_login', outcome: 'unconfigured', reason: 'Admin auth is not configured.' });
    return { ok: false, error: 'Admin auth is not configured.' };
  }

  if (isAdminSignInLocked(ADMIN_SIGN_IN_THROTTLE_KEY)) {
    logAdminSecurityEvent({ event: 'admin_login', outcome: 'throttled', reason: ADMIN_SIGN_IN_THROTTLED_ERROR });
    return { ok: false, error: ADMIN_SIGN_IN_THROTTLED_ERROR };
  }

  if (!verifyAdminPassword(password, config)) {
    recordAdminSignInFailure(ADMIN_SIGN_IN_THROTTLE_KEY);
    logAdminSecurityEvent({ event: 'admin_login', outcome: 'failure', reason: 'Invalid admin password.' });
    return { ok: false, error: 'Invalid admin password.' };
  }

  clearAdminSignInThrottle(ADMIN_SIGN_IN_THROTTLE_KEY);
  const cookieStore = await cookies();
  await clearAdminSession();
  cookieStore.set(
    ADMIN_SESSION_COOKIE_NAME,
    createAdminSessionCookieValue(config),
    adminSessionCookieOptions(ADMIN_SESSION_MAX_AGE_SECONDS)
  );
  logAdminSecurityEvent({ event: 'admin_login', outcome: 'success' });

  return { ok: true };
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_SESSION_COOKIE_NAME, '', adminSessionCookieOptions(0));
}
