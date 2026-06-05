import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

export async function runOutboundWebhookAdminRepositoryReadPreflightTests() {
  const note = source('docs/production-roadmap-phase35-admin-repository-read-preflight.md');

  assert.match(note, /Admin Repository Read Preflight/);
  assert.match(note, /normalized filters/);
  assert.match(note, /normalized sort/);
  assert.match(note, /normalized page size/);
  assert.match(note, /safe field projection/);
  assert.match(note, /exact-match filters/);
  assert.match(note, /opaque cursor/);
  assert.match(note, /no raw payload/);
  assert.match(note, /protected values/);
  assert.match(note, /route handlers/);
  assert.match(note, /no UI/);
  assert.match(note, /recovery controls/);
  assert.match(note, /worker behavior/);
  assert.match(note, /implementation deferral/i);

  console.log('outbound-webhook-admin-repository-read-preflight.test.ts passed');
}
