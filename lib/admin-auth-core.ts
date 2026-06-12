import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

export const ADMIN_SESSION_COOKIE_NAME = 'golara_admin_session';
export const ADMIN_SESSION_PAYLOAD = 'golara-admin-v1';
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;
export const ADMIN_SESSION_NONCE_BYTES = 16;

export type AdminRole = 'owner' | 'staff';
export type AdminIdentityProvider = 'password';

export type AdminIdentity = {
  authenticated: boolean;
  type: AdminIdentityProvider;
  label: string;
  email?: string;
  role: AdminRole;
  provider: AdminIdentityProvider;
};

export type AdminAuthConfig = {
  password: string;
  sessionSecret: string;
  label: string;
  email?: string;
  role: AdminRole;
  provider: AdminIdentityProvider;
};

export type AdminIdentityInput = {
  authenticated: boolean;
  label: string;
  email?: string;
  role: AdminRole;
  provider: AdminIdentityProvider;
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

export function normalizeAdminIdentityProvider(value: string | undefined): AdminIdentityProvider {
  const provider = value?.trim().toLowerCase();
  return provider === 'password' || !provider ? 'password' : 'password';
}

export function getAdminAuthConfig(env: Record<string, string | undefined>): AdminAuthConfig {
  return {
    password: envValue(env, 'ADMIN_PASSWORD'),
    sessionSecret: envValue(env, 'ADMIN_SESSION_SECRET'),
    label: envValue(env, 'ADMIN_LABEL') || 'Admin',
    email: envValue(env, 'ADMIN_EMAIL') || undefined,
    role: normalizeAdminRole(env.ADMIN_ROLE),
    provider: normalizeAdminIdentityProvider(env.ADMIN_IDENTITY_PROVIDER)
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

export function createAdminSessionPayload(issuedAtMs = Date.now(), nonce = randomBytes(ADMIN_SESSION_NONCE_BYTES).toString('hex')) {
  return `${ADMIN_SESSION_PAYLOAD}.${issuedAtMs}.${nonce}`;
}

export function createAdminSessionCookieValue(config: AdminAuthConfig, issuedAtMs = Date.now(), nonce?: string) {
  const sessionPayload = createAdminSessionPayload(issuedAtMs, nonce);
  return `${sessionPayload}.${signAdminSessionPayload(sessionPayload, config)}`;
}

export function isValidAdminSessionCookie(cookieValue: string | undefined, config: AdminAuthConfig, nowMs = Date.now()) {
  if (!cookieValue || !isAdminAuthConfigured(config)) return false;

  const [payloadMarker, issuedAtValue, nonce, signature, ...extra] = cookieValue.split('.');
  if (extra.length > 0) return false;
  if (payloadMarker !== ADMIN_SESSION_PAYLOAD || !issuedAtValue || !nonce || !signature) return false;
  if (!/^\d+$/.test(issuedAtValue) || !/^[a-f0-9]{32}$/i.test(nonce)) return false;

  const issuedAtMs = Number.parseInt(issuedAtValue, 10);
  if (!Number.isSafeInteger(issuedAtMs) || issuedAtMs <= 0) return false;
  if (issuedAtMs > nowMs) return false;
  if (nowMs - issuedAtMs > ADMIN_SESSION_MAX_AGE_SECONDS * 1000) return false;

  const sessionPayload = `${payloadMarker}.${issuedAtValue}.${nonce}`;
  return safeAdminEqual(signature, signAdminSessionPayload(sessionPayload, config));
}

export function verifyAdminPassword(password: string, config: AdminAuthConfig) {
  return isAdminAuthConfigured(config) && safeAdminEqual(password, config.password);
}

export function createAdminIdentity(input: AdminIdentityInput): AdminIdentity {
  return {
    authenticated: input.authenticated,
    type: input.provider,
    label: input.label,
    email: input.email,
    role: input.role,
    provider: input.provider
  };
}

export function createConfiguredAdminIdentity(authenticated: boolean, config: AdminAuthConfig): AdminIdentity {
  return createAdminIdentity({
    authenticated,
    label: config.label,
    email: config.email,
    role: config.role,
    provider: config.provider
  });
}

export function adminRoleMeetsRequirement(actualRole: AdminRole, requiredRole: AdminRole) {
  return ROLE_RANK[actualRole] >= ROLE_RANK[requiredRole];
}
