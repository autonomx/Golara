import { createHmac, timingSafeEqual } from 'node:crypto';

export const ADMIN_SESSION_COOKIE_NAME = 'golara_admin_session';
export const ADMIN_SESSION_PAYLOAD = 'golara-admin-v1';
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

export type AdminRole = 'owner' | 'staff';

export type AdminIdentity = {
  authenticated: boolean;
  type: 'password';
  label: string;
  email?: string;
  role: AdminRole;
  provider: 'password';
};

export type AdminAuthConfig = {
  password: string;
  sessionSecret: string;
  label: string;
  email?: string;
  role: AdminRole;
};

const ROLE_RANK: Record<AdminRole, number> = {
  staff: 1,
  owner: 2
};

function envValue(env: Record<string, string | undefined>, name: string) {
  return env[name]?.trim() || '';
}

export function normalizeAdminRole(value: string | undefined): AdminRole {
  return value?.trim().toLowerCase() === 'staff' ? 'staff' : 'owner';
}

export function getAdminAuthConfig(env: Record<string, string | undefined>): AdminAuthConfig {
  return {
    password: envValue(env, 'ADMIN_PASSWORD'),
    sessionSecret: envValue(env, 'ADMIN_SESSION_SECRET'),
    label: envValue(env, 'ADMIN_LABEL') || 'Admin',
    email: envValue(env, 'ADMIN_EMAIL') || undefined,
    role: normalizeAdminRole(env.ADMIN_ROLE)
  };
}

export function isAdminAuthConfigured(config: AdminAuthConfig) {
  return Boolean(config.password && config.sessionSecret);
}

export function signAdminSessionPayload(payload: string, config: AdminAuthConfig) {
  return createHmac('sha256', config.sessionSecret).update(payload).digest('hex');
}

export function safeAdminEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && timingSafeEqual(leftBuffer, rightBuffer);
}

export function createAdminSessionCookieValue(config: AdminAuthConfig) {
  return `${ADMIN_SESSION_PAYLOAD}.${signAdminSessionPayload(ADMIN_SESSION_PAYLOAD, config)}`;
}

export function isValidAdminSessionCookie(cookieValue: string | undefined, config: AdminAuthConfig) {
  if (!cookieValue || !isAdminAuthConfigured(config)) return false;

  const [payload, signature] = cookieValue.split('.');
  if (payload !== ADMIN_SESSION_PAYLOAD || !signature) return false;

  return safeAdminEqual(signature, signAdminSessionPayload(payload, config));
}

export function verifyAdminPassword(password: string, config: AdminAuthConfig) {
  return isAdminAuthConfigured(config) && safeAdminEqual(password, config.password);
}

export function createAdminIdentity(authenticated: boolean, config: AdminAuthConfig): AdminIdentity {
  return {
    authenticated,
    type: 'password',
    label: config.label,
    email: config.email,
    role: config.role,
    provider: 'password'
  };
}

export function adminRoleMeetsRequirement(actualRole: AdminRole, requiredRole: AdminRole) {
  return ROLE_RANK[actualRole] >= ROLE_RANK[requiredRole];
}
