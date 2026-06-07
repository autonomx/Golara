import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

function source(path: string) {
  return readFileSync(path, 'utf8');
}

function pkgScripts() {
  return (JSON.parse(source('package.json')) as { scripts: Record<string, string> }).scripts;
}

function assertExists(path: string) {
  assert.equal(existsSync(path), true, `${path} should exist`);
}

function assertContains(path: string, markers: string[]) {
  const content = source(path);
  for (const marker of markers) assert.match(content, new RegExp(marker.replaceAll('+', '\\+')), `${path} should contain ${marker}`);
}

function main() {
  const scripts = pkgScripts();
  assert.equal(scripts['test:e2e']?.includes('tests/e2e/run-tests.ts'), true);
  assert.equal(scripts['test:e2e:api']?.includes('tests/e2e/api/run-tests.ts'), true);
  assert.equal(scripts['test:e2e:lifecycle']?.includes('tests/e2e/lifecycle/run-tests.ts'), true);
  assert.equal(scripts['test:e2e:routes'], 'npm run smoke:routes:local');

  for (const path of [
    'tests/e2e/api/run-tests.ts',
    'tests/e2e/api/shared.ts',
    'tests/e2e/api/fixture.ts',
    'tests/e2e/api/storefront-account-tests.ts',
    'tests/e2e/api/admin-content-tests.ts',
    'tests/e2e/api/admin-catalog-tests.ts',
    'tests/e2e/api/admin-order-tests.ts',
    'tests/e2e/api/webhook-tests.ts',
    'tests/e2e/api/boundary-tests.ts',
    'tests/e2e/lifecycle/run-tests.ts',
    'tests/e2e/lifecycle/test-db.ts',
    'tools/smoke-routes.mjs',
    'tools/run-smoke-routes-local.mjs'
  ]) {
    assertExists(path);
  }

  assertContains('tools/smoke-routes.mjs', ['homepage', 'product listing', 'account login', 'SMOKE_BASE_URL']);
  assertContains('tools/run-smoke-routes-local.mjs', ['npm run smoke:routes', 'SMOKE_BASE_URL']);
  assertContains('tests/e2e/api/run-tests.ts', ['prepareApiFixture', 'startNextServer', 'runPublicReadRouteTests', 'runWebhookRouteTests']);
  assertContains('tests/e2e/api/shared.ts', ['E2E_DATABASE_URL', 'DATABASE_URL', 'CookieJar', 'submitServerAction']);
  assertContains('tests/e2e/api/storefront-account-tests.ts', ['API checkout action order', 'API E2E Inquiry Customer']);
  assertContains('tests/e2e/api/admin-content-tests.ts', ['store-settings-updated', 'homepage-updated', 'media-created']);
  assertContains('tests/e2e/api/admin-catalog-tests.ts', ['API-E2E-PREMIUM-001', 'variant-location-stock-updated']);
  assertContains('tests/e2e/api/admin-order-tests.ts', ['API-E2E-ADMIN-EDIT-1001', 'manual-payment-refunded']);
  assertContains('tests/e2e/api/webhook-tests.ts', ['invalid_signature', 'duplicate', 'verified_paid']);
  assertContains('tests/e2e/api/boundary-tests.ts', ['invalid_code', 'expired-customer-session', 'failed_after_paid']);
  assertContains('tests/e2e/lifecycle/test-db.ts', ['assertSafeLifecycleDatabaseUrl', 'resetLifecycleDatabase']);

  console.log('e2e smoke tests passed');
}

main();
