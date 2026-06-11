import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

export async function runContentSecurityPolicyConfigTests() {
  const config = readFileSync('next.config.mjs', 'utf8');

  assert.match(config, /Content-Security-Policy/);
  assert.match(config, /default-src 'self'/);
  assert.match(config, /base-uri 'self'/);
  assert.match(config, /object-src 'none'/);
  assert.match(config, /frame-ancestors 'none'/);
  assert.match(config, /form-action 'self'/);
  assert.match(config, /img-src 'self' data: blob: https:\/\/res\.cloudinary\.com/);
  assert.match(config, /connect-src 'self'/);
  assert.match(config, /upgrade-insecure-requests/);
  assert.doesNotMatch(config, /default-src \*/);
  assert.doesNotMatch(config, /img-src[^\n]+https:\s/);
  assert.doesNotMatch(config, /object-src 'self'/);
  assert.doesNotMatch(config, /frame-ancestors \*/);

  console.log('content-security-policy-config.test.ts passed');
}
