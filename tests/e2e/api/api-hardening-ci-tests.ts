import assert from 'node:assert/strict';
import { source } from './api-hardening-source';

export async function runOptionalBrowserLoadAndCiContractTests() {
  const packageJson = JSON.parse(source('package.json')) as { scripts: Record<string, string> };
  assert.equal(packageJson.scripts['test:e2e:browser'], 'node tools/run-playwright-api-journeys.mjs');
  assert.equal(packageJson.scripts['test:e2e:providers'], 'node --require ./tests/setup/server-only-register.cjs --import tsx tests/e2e/api/live-provider-contract-tests.ts');
  assert.equal(packageJson.scripts['test:load:api'], 'node tools/run-k6-api-smoke.mjs');
  assert.equal(packageJson.scripts['test:load:catalog'], 'node tools/run-k6-api-smoke.mjs catalog');
  assert.equal(packageJson.scripts['test:load:webhook'], 'node tools/run-k6-api-smoke.mjs webhook');

  assert.match(source('tools/run-playwright-api-journeys.mjs'), /PLAYWRIGHT_REQUIRED/);
  assert.match(source('tests/browser/api-journeys.spec.mjs'), /products\/e2e-red-rose-bouquet/);
  assert.match(source('tools/run-k6-api-smoke.mjs'), /K6_REQUIRED/);
  assert.match(source('tools/run-k6-api-smoke.mjs'), /K6_PROFILE/);
  assert.match(source('tools/run-k6-api-smoke.mjs'), /golaraApiLoadTest\.js/);
  assert.match(source('tests/K6LoadTest/src/test/golaraApiLoadTest.js'), /ramping-vus[\s\S]*?http_req_failed[\s\S]*?http_req_duration/);
  assert.match(source('tests/K6LoadTest/src/test/golaraApiLoadTest.js'), /surface: 'webhook_route'/);
  assert.match(source('tests/K6LoadTest/src/test/golaraApiLoadTest.js'), /catalog_search[\s\S]*?cart_account[\s\S]*?static_route/);
  assert.match(source('tests/e2e/api/live-provider-contract-tests.ts'), /LIVE_STRIPE_WEBHOOK_URL[\s\S]*?LIVE_ZARINPAL_WEBHOOK_URL/);

  const workflow = source('.github/workflows/ci.yml');
  assert.match(workflow, /Production-like E2E contracts/);
  assert.match(workflow, /NODE_ENV: production/);
  assert.match(workflow, /npm run test:e2e/);
}
