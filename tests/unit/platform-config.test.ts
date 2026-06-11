import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const configSource = readFileSync('next.config.mjs', 'utf8');

export async function runPlatformConfigTests() {
  assert.match(configSource, /async\s+headers\s*\(\)\s*{/);
  assert.match(configSource, /Strict-Transport-Security/);
  assert.match(configSource, /max-age=63072000; includeSubDomains; preload/);
  assert.match(configSource, /X-Frame-Options[\s\S]*?DENY/);
  assert.match(configSource, /X-Content-Type-Options[\s\S]*?nosniff/);
  assert.match(configSource, /Referrer-Policy[\s\S]*?strict-origin-when-cross-origin/);
  assert.match(configSource, /Permissions-Policy/);

  assert.match(configSource, /hostname:\s*'res\.cloudinary\.com'/);
  assert.doesNotMatch(configSource, /hostname:\s*'\*\*'/);
  assert.doesNotMatch(configSource, /protocol:\s*'http'/);

  console.log('platform-config.test.ts passed');
}
