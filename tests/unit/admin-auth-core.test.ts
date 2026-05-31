import assert from 'node:assert/strict';
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
  verifyAdminPassword
} from '../../lib/admin-auth-core';

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

  assert.equal(verifyAdminPassword('password', config), true);
  assert.equal(verifyAdminPassword('wrong-password', config), false);
  assert.equal(verifyAdminPassword('password', { ...config, sessionSecret: '' }), false);

  const cookieValue = createAdminSessionCookieValue(config);
  assert.match(cookieValue, /^golara-admin-v1\.[a-f0-9]{64}$/);
  assert.equal(isValidAdminSessionCookie(cookieValue, config), true);
  assert.equal(isValidAdminSessionCookie(undefined, config), false);
  assert.equal(isValidAdminSessionCookie('', config), false);
  assert.equal(isValidAdminSessionCookie('bad-payload.bad-signature', config), false);
  assert.equal(isValidAdminSessionCookie(cookieValue, { ...config, sessionSecret: 'other-secret' }), false);

  assert.deepEqual(createAdminIdentity({ authenticated: true, label: 'Provider User', role: 'owner', provider: 'password' }), {
    authenticated: true,
    type: 'password',
    label: 'Provider User',
    email: undefined,
    role: 'owner',
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

  assert.equal(adminRoleMeetsRequirement('owner', 'owner'), true);
  assert.equal(adminRoleMeetsRequirement('owner', 'staff'), true);
  assert.equal(adminRoleMeetsRequirement('staff', 'staff'), true);
  assert.equal(adminRoleMeetsRequirement('staff', 'owner'), false);

  console.log('admin-auth-core.test.ts passed');
}
