import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  assertAdminAuthenticated as assertAdminAuthenticatedWrapper,
  assertAdminRole as assertAdminRoleWrapper,
  createAdminSession as createAdminSessionWrapper,
  getAdminIdentity as getAdminIdentityWrapper,
  isAdminAuthenticated as isAdminAuthenticatedWrapper,
  isAdminAuthConfigured as isAdminAuthConfiguredWrapper
} from '../../lib/admin-auth';
import {
  ADMIN_SESSION_COOKIE_NAME,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  ADMIN_SESSION_PAYLOAD,
  adminRoleMeetsRequirement,
  createAdminIdentity,
  createAdminSessionCookieValue,
  createConfiguredAdminIdentity,
  getAdminAuthConfig,
  isAdminAuthConfigured,
  isValidAdminSessionCookie,
  normalizeAdminIdentityProvider,
  normalizeAdminRole,
  safeAdminEqual,
  signAdminSessionPayload,
  verifyAdminPassword,
  type AdminRole
} from '../../lib/admin-auth-core';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runAdminAuthCoreTests() {
  assert.equal(ADMIN_SESSION_COOKIE_NAME, 'golara_admin_session');
  assert.equal(ADMIN_SESSION_PAYLOAD, 'golara-admin-v1');
  assert.equal(ADMIN_SESSION_MAX_AGE_SECONDS, 60 * 60 * 8);

  assert.equal(normalizeAdminRole(undefined), 'owner');
  assert.equal(normalizeAdminRole(''), 'owner');
  assert.equal(normalizeAdminRole(' OWNER '), 'owner');
  assert.equal(normalizeAdminRole(' staff '), 'staff');
  assert.equal(normalizeAdminRole('unsupported'), 'owner');

  assert.equal(normalizeAdminIdentityProvider(undefined), 'password');
  assert.equal(normalizeAdminIdentityProvider(''), 'password');
  assert.equal(normalizeAdminIdentityProvider(' PASSWORD '), 'password');
  assert.equal(normalizeAdminIdentityProvider('oauth'), 'password');

  const config = getAdminAuthConfig({
    ADMIN_PASSWORD: ' password ',
    ADMIN_SESSION_SECRET: ' secret ',
    ADMIN_LABEL: ' Owner User ',
    ADMIN_EMAIL: ' owner@example.invalid ',
    ADMIN_ROLE: ' staff ',
    ADMIN_IDENTITY_PROVIDER: ' password '
  });
  assert.deepEqual(config, {
    password: 'password',
    sessionSecret: 'secret',
    label: 'Owner User',
    email: 'owner@example.invalid',
    role: 'staff',
    provider: 'password'
  });

  assert.deepEqual(getAdminAuthConfig({}), {
    password: '',
    sessionSecret: '',
    label: 'Admin',
    email: undefined,
    role: 'owner',
    provider: 'password'
  });

  assert.equal(isAdminAuthConfigured(config), true);
  assert.equal(isAdminAuthConfigured({ ...config, password: '' }), false);
  assert.equal(isAdminAuthConfigured({ ...config, sessionSecret: '' }), false);

  assert.equal(signAdminSessionPayload(ADMIN_SESSION_PAYLOAD, config), signAdminSessionPayload(ADMIN_SESSION_PAYLOAD, config));
  assert.equal(signAdminSessionPayload('other-payload', config) === signAdminSessionPayload(ADMIN_SESSION_PAYLOAD, config), false);
  assert.equal(safeAdminEqual('same', 'same'), true);
  assert.equal(safeAdminEqual('same', 'different'), false);
  assert.equal(safeAdminEqual('same', 'longer-value'), false);

  assert.equal(verifyAdminPassword('password', config), true);
  assert.equal(verifyAdminPassword('wrong-password', config), false);
  assert.equal(verifyAdminPassword('password', { ...config, sessionSecret: '' }), false);

  const cookieValue = createAdminSessionCookieValue(config);
  assert.match(cookieValue, /^golara-admin-v1\.[a-f0-9]{64}$/);
  assert.equal(isValidAdminSessionCookie(cookieValue, config), true);
  assert.equal(isValidAdminSessionCookie(undefined, config), false);
  assert.equal(isValidAdminSessionCookie('', config), false);
  assert.equal(isValidAdminSessionCookie('bad-payload.bad-signature', config), false);
  assert.equal(isValidAdminSessionCookie(`${ADMIN_SESSION_PAYLOAD}.`, config), false);
  assert.equal(isValidAdminSessionCookie(`${ADMIN_SESSION_PAYLOAD}.${signAdminSessionPayload('other-payload', config)}`, config), false);
  assert.equal(isValidAdminSessionCookie(`${ADMIN_SESSION_PAYLOAD}.${signAdminSessionPayload(ADMIN_SESSION_PAYLOAD, config)}.extra`, config), true);
  assert.equal(isValidAdminSessionCookie(cookieValue, { ...config, sessionSecret: 'other-secret' }), false);

  assert.deepEqual(createAdminIdentity({ authenticated: true, label: 'Provider User', role: 'owner', provider: 'password' }), {
    authenticated: true,
    type: 'password',
    label: 'Provider User',
    email: undefined,
    role: 'owner',
    provider: 'password'
  });
  assert.deepEqual(createAdminIdentity({ authenticated: false, label: 'Staff User', email: 'staff@example.invalid', role: 'staff', provider: 'password' }), {
    authenticated: false,
    type: 'password',
    label: 'Staff User',
    email: 'staff@example.invalid',
    role: 'staff',
    provider: 'password'
  });

  assert.deepEqual(createConfiguredAdminIdentity(true, config), {
    authenticated: true,
    type: 'password',
    label: 'Owner User',
    email: 'owner@example.invalid',
    role: 'staff',
    provider: 'password'
  });

  const roles: AdminRole[] = ['staff', 'owner'];
  const expectedRoleAccess: Record<AdminRole, Record<AdminRole, boolean>> = {
    staff: { staff: true, owner: false },
    owner: { staff: true, owner: true }
  };

  for (const actualRole of roles) {
    for (const requiredRole of roles) {
      assert.equal(
        adminRoleMeetsRequirement(actualRole, requiredRole),
        expectedRoleAccess[actualRole][requiredRole],
        `${actualRole} requiring ${requiredRole}`
      );
    }
  }

  const originalAdminEnv = {
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
    ADMIN_SESSION_SECRET: process.env.ADMIN_SESSION_SECRET,
    ADMIN_LABEL: process.env.ADMIN_LABEL,
    ADMIN_EMAIL: process.env.ADMIN_EMAIL,
    ADMIN_ROLE: process.env.ADMIN_ROLE,
    ADMIN_IDENTITY_PROVIDER: process.env.ADMIN_IDENTITY_PROVIDER
  };

  try {
    delete process.env.ADMIN_PASSWORD;
    delete process.env.ADMIN_SESSION_SECRET;
    delete process.env.ADMIN_LABEL;
    delete process.env.ADMIN_EMAIL;
    delete process.env.ADMIN_ROLE;
    delete process.env.ADMIN_IDENTITY_PROVIDER;

    assert.equal(isAdminAuthConfiguredWrapper(), false);
    assert.equal(await isAdminAuthenticatedWrapper(), false);
    assert.deepEqual(await getAdminIdentityWrapper(), {
      authenticated: false,
      type: 'password',
      label: 'Admin',
      email: undefined,
      role: 'owner',
      provider: 'password'
    });
    await assert.rejects(assertAdminAuthenticatedWrapper, /Admin authentication is required for this CMS action\./);
    await assert.rejects(() => assertAdminRoleWrapper('owner'), /Admin authentication is required for this CMS action\./);
    assert.deepEqual(await createAdminSessionWrapper('anything'), { ok: false, error: 'Admin auth is not configured.' });

    process.env.ADMIN_PASSWORD = 'secret-password';
    process.env.ADMIN_SESSION_SECRET = 'session-secret';
    process.env.ADMIN_LABEL = ' Owner User ';
    process.env.ADMIN_EMAIL = ' owner@example.invalid ';
    process.env.ADMIN_ROLE = ' staff ';
    process.env.ADMIN_IDENTITY_PROVIDER = ' password ';

    assert.equal(isAdminAuthConfiguredWrapper(), true);
    assert.deepEqual(await createAdminSessionWrapper('wrong-password'), { ok: false, error: 'Invalid admin password.' });
  } finally {
    for (const [key, value] of Object.entries(originalAdminEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }

  const adminAuthSource = source('lib/admin-auth.ts');
  for (const marker of [
    'cookieStore.get(ADMIN_SESSION_COOKIE_NAME)?.value',
    'cookieStore.set(ADMIN_SESSION_COOKIE_NAME, createAdminSessionCookieValue(config)',
    'httpOnly: true',
    "sameSite: 'lax'",
    "secure: process.env.NODE_ENV === 'production'",
    "path: '/'",
    'maxAge: ADMIN_SESSION_MAX_AGE_SECONDS',
    'cookieStore.delete(ADMIN_SESSION_COOKIE_NAME)',
    'adminRoleMeetsRequirement(identity.role, requiredRole)'
  ]) {
    assert.ok(adminAuthSource.includes(marker), `admin-auth source must include ${marker}`);
  }

  console.log('admin-auth-core.test.ts passed');
}
