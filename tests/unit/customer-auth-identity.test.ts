import assert from 'node:assert/strict';
import {
  hashCustomerAuthIdentifier,
  hashCustomerAuthIp,
  hashCustomerAuthPhone,
  hashCustomerAuthUserAgent,
  normalizeDigits,
  normalizeIpForAuth,
  normalizePhoneForAuth,
  normalizeUserAgentForAuth
} from '../../lib/customer-auth/identity';

const ORIGINAL_ENV = { ...process.env };

async function withEnv<T>(env: Record<string, string | undefined>, run: () => Promise<T> | T) {
  process.env = { ...ORIGINAL_ENV };
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }

  try {
    return await run();
  } finally {
    process.env = { ...ORIGINAL_ENV };
  }
}

export async function runCustomerAuthIdentityTests() {
  assert.equal(normalizeDigits('۰۱۲۳۴۵۶۷۸۹'), '0123456789');
  assert.equal(normalizeDigits('٠١٢٣٤٥٦٧٨٩'), '0123456789');

  assert.equal(normalizePhoneForAuth(' +98 912 345 6789 '), '+989123456789');
  assert.equal(normalizePhoneForAuth('0098 912 345 6789'), '+989123456789');
  assert.equal(normalizePhoneForAuth('۰۹۱۲ ۳۴۵ ۶۷۸۹'), '09123456789');
  assert.equal(normalizePhoneForAuth('not a phone'), '');

  assert.equal(normalizeIpForAuth('203.0.113.10, 198.51.100.4'), '203.0.113.10');
  assert.equal(normalizeIpForAuth(' 2001:DB8::1 '), '2001:db8::1');
  assert.equal(normalizeIpForAuth(undefined), '');

  assert.equal(normalizeUserAgentForAuth(' Mozilla/5.0   Test Browser '), 'Mozilla/5.0 Test Browser');
  assert.equal(normalizeUserAgentForAuth(null), '');

  const secret = 'test-secret';
  const phoneHash = hashCustomerAuthPhone('+98 912 345 6789', secret);
  assert.match(phoneHash, /^[a-f0-9]{64}$/);
  assert.equal(phoneHash, hashCustomerAuthPhone('+989123456789', secret));
  assert.notEqual(phoneHash, hashCustomerAuthIdentifier('ip', '+989123456789', secret));
  assert.notEqual(phoneHash, hashCustomerAuthPhone('+989123456789', 'other-secret'));

  assert.equal(hashCustomerAuthIp('203.0.113.10, 198.51.100.4', secret), hashCustomerAuthIp('203.0.113.10', secret));
  assert.equal(hashCustomerAuthUserAgent(' Browser   One ', secret), hashCustomerAuthUserAgent('Browser One', secret));
  assert.equal(hashCustomerAuthPhone('', secret), '');

  await withEnv({ NODE_ENV: 'production', CUSTOMER_AUTH_HASH_SECRET: undefined }, () => {
    assert.throws(() => hashCustomerAuthPhone('+989123456789'), /CUSTOMER_AUTH_HASH_SECRET is required/);
  });

  await withEnv({ NODE_ENV: 'test', CUSTOMER_AUTH_HASH_SECRET: undefined }, () => {
    assert.match(hashCustomerAuthPhone('+989123456789'), /^[a-f0-9]{64}$/);
  });

  console.log('customer-auth-identity.test.ts passed');
}
